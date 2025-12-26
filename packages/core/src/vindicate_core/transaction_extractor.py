"""Transaction extractor for bank statement PDF parsing.

Uses pdfplumber for table extraction and categorizes transactions
into budget categories for Form 433-A living expense analysis.
"""

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional, Generator, TYPE_CHECKING
from collections import defaultdict

import structlog

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

from .models import (
    BankTransaction,
    TransactionCategory,
    MonthlyBudget,
    CategorySummary,
    BudgetAnalysis,
)

if TYPE_CHECKING:
    from .llm_transaction_extractor import LLMTransactionExtractor

logger = structlog.get_logger()


# =============================================================================
# TRANSACTION CATEGORIZATION
# =============================================================================

# Keywords for categorizing transactions
CATEGORY_KEYWORDS: dict[TransactionCategory, list[str]] = {
    # Income
    TransactionCategory.PAYCHECK: [
        'payroll', 'direct deposit', 'salary', 'wages', 'paycheck',
        'gusto', 'adp', 'paychex', 'workday',
    ],
    TransactionCategory.INCOME: [
        'deposit', 'credit', 'refund', 'reimbursement', 'cashback',
    ],
    TransactionCategory.TRANSFER_IN: [
        'transfer from', 'mobile deposit', 'zelle from', 'venmo from',
        'cash app from', 'wire transfer in',
    ],

    # Rent/Mortgage
    TransactionCategory.RENT: [
        'rent', 'landlord', 'property management', 'apartment', 'lease',
        'housing', 'real estate', 'rentpayment',
    ],
    TransactionCategory.MORTGAGE: [
        'mortgage', 'home loan', 'wells fargo home', 'chase home',
        'rocket mortgage', 'quicken loans', 'mr cooper', 'loan care',
    ],

    # Utilities
    TransactionCategory.UTILITIES: [
        'con ed', 'coned', 'electric', 'gas bill', 'water bill',
        'national grid', 'pge', 'duke energy', 'verizon', 'at&t',
        't-mobile', 'sprint', 'spectrum', 'comcast', 'xfinity',
        'optimum', 'fios', 'internet', 'cable', 'utility',
    ],

    # Food
    TransactionCategory.GROCERIES: [
        'grocery', 'supermarket', 'whole foods', 'trader joe',
        'safeway', 'kroger', 'publix', 'walmart', 'target',
        'costco', 'sam\'s club', 'aldi', 'food mart', 'market',
        'h-e-b', 'wegmans', 'stop & shop', 'shoprite', 'food lion',
        'food emporium', 'gristedes', 'key food', 'foodtown',
    ],
    TransactionCategory.RESTAURANTS: [
        'restaurant', 'cafe', 'diner', 'pizza', 'sushi', 'chinese',
        'mexican', 'thai', 'indian', 'italian', 'burger', 'mcdonald',
        'wendy', 'chipotle', 'panera', 'subway', 'domino', 'grubhub',
        'doordash', 'uber eats', 'seamless', 'postmates', 'caviar',
    ],
    TransactionCategory.COFFEE_SHOPS: [
        'starbucks', 'dunkin', 'coffee', 'cafe', 'peet', 'blue bottle',
    ],

    # Transportation
    TransactionCategory.GAS: [
        'shell', 'exxon', 'mobil', 'chevron', 'bp', 'citgo', 'sunoco',
        'speedway', 'wawa', 'gas station', 'fuel', 'gasoline', 'marathon',
    ],
    TransactionCategory.RIDESHARE: [
        'uber', 'lyft', 'via', 'juno', 'taxi', 'cab',
    ],
    TransactionCategory.PUBLIC_TRANSIT: [
        'mta', 'metro', 'transit', 'bus', 'train', 'subway', 'bart',
        'cta', 'septa', 'wmata', 'path', 'nj transit', 'amtrak',
    ],
    TransactionCategory.PARKING: [
        'parking', 'garage', 'meter', 'spot', 'parkwhiz', 'spothero',
    ],
    TransactionCategory.AUTO_PAYMENT: [
        'auto loan', 'car payment', 'toyota financial', 'honda financial',
        'ford credit', 'capital one auto', 'ally auto', 'santander',
        'bridgecrest', 'carmax', 'carvana',
    ],

    # Healthcare
    TransactionCategory.HEALTHCARE: [
        'hospital', 'medical', 'doctor', 'clinic', 'urgent care',
        'dental', 'vision', 'optometrist', 'dermatologist', 'lab',
        'quest', 'labcorp',
    ],
    TransactionCategory.PHARMACY: [
        'pharmacy', 'cvs', 'walgreens', 'rite aid', 'duane reade',
        'prescription', 'rx', 'drugstore',
    ],
    TransactionCategory.INSURANCE_HEALTH: [
        'blue cross', 'aetna', 'united health', 'cigna', 'humana',
        'kaiser', 'anthem', 'health insurance', 'medical insurance',
    ],

    # Shopping
    TransactionCategory.AMAZON: [
        'amazon', 'amzn', 'prime',
    ],
    TransactionCategory.SHOPPING: [
        'store', 'shop', 'mall', 'best buy', 'home depot', 'lowe\'s',
        'ikea', 'bed bath', 'williams sonoma', 'crate barrel',
        'pottery barn', 'macy', 'nordstrom', 'bloomingdale', 'saks',
        'tj maxx', 'marshalls', 'ross', 'kohls', 'jcpenney',
    ],
    TransactionCategory.CLOTHING: [
        'apparel', 'clothing', 'shoes', 'nike', 'adidas', 'gap',
        'old navy', 'h&m', 'zara', 'uniqlo', 'forever 21',
    ],

    # Entertainment
    TransactionCategory.STREAMING: [
        'netflix', 'spotify', 'hulu', 'disney+', 'hbo max', 'apple tv',
        'youtube', 'peacock', 'paramount+', 'amazon prime video',
        'audible', 'apple music', 'pandora',
    ],
    TransactionCategory.SUBSCRIPTIONS: [
        'subscription', 'monthly', 'membership', 'recurring',
        'adobe', 'microsoft 365', 'dropbox', 'icloud', 'google one',
        'gym', 'fitness', 'planet fitness', 'equinox', 'la fitness',
    ],
    TransactionCategory.ENTERTAINMENT: [
        'movie', 'theater', 'concert', 'ticket', 'event', 'game',
        'amc', 'regal', 'fandango', 'stubhub', 'ticketmaster',
    ],

    # Financial
    TransactionCategory.INSURANCE: [
        'insurance', 'geico', 'progressive', 'state farm', 'allstate',
        'farmers', 'usaa', 'liberty mutual', 'nationwide',
    ],
    TransactionCategory.DEBT_PAYMENT: [
        'loan payment', 'student loan', 'sallie mae', 'navient',
        'great lakes', 'mohela', 'credit card payment', 'balance transfer',
    ],
    TransactionCategory.TRANSFER_OUT: [
        'transfer to', 'zelle to', 'venmo to', 'cash app to',
        'wire transfer out', 'ach transfer',
    ],
    TransactionCategory.SAVINGS: [
        'savings', 'investment', '401k', 'ira', 'brokerage',
        'fidelity', 'vanguard', 'schwab', 'etrade', 'robinhood',
    ],

    # Other
    TransactionCategory.FEES: [
        'fee', 'charge', 'overdraft', 'nsf', 'maintenance fee',
        'atm fee', 'foreign transaction', 'late fee',
    ],
    TransactionCategory.ATM: [
        'atm', 'cash withdrawal', 'cash back',
    ],
}


def categorize_transaction(description: str, amount: Decimal) -> TransactionCategory:
    """
    Categorize a transaction based on its description and amount.

    Args:
        description: Transaction description text
        amount: Transaction amount (positive = credit, negative = debit)

    Returns:
        Best matching TransactionCategory
    """
    desc_lower = description.lower()

    # Check each category's keywords
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return category

    # Default based on amount direction
    if amount > 0:
        return TransactionCategory.INCOME
    return TransactionCategory.OTHER


# =============================================================================
# TRANSACTION EXTRACTOR
# =============================================================================

class TransactionExtractor:
    """
    Extract transactions from bank statement PDFs using pdfplumber.

    Parses tables and text to identify transaction entries, then
    categorizes them for budget analysis.

    Optionally uses LLM (Claude) for more reliable extraction,
    especially for proper credit/debit classification of payroll deposits.
    """

    # Common date patterns in bank statements
    DATE_PATTERNS = [
        r'(\d{1,2}/\d{1,2}/\d{2,4})',  # MM/DD/YYYY or MM/DD/YY
        r'(\d{1,2}/\d{1,2})\b',         # MM/DD (without year, common in Chase)
        r'(\d{1,2}-\d{1,2}-\d{2,4})',  # MM-DD-YYYY
        r'(\d{4}-\d{2}-\d{2})',         # YYYY-MM-DD
        r'([A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4})',  # Jan 15, 2025
    ]

    # Amount patterns
    AMOUNT_PATTERN = re.compile(
        r'\$?\s*([\d,]+\.?\d*)\s*(?:cr|dr|credit|debit)?',
        re.IGNORECASE
    )

    def __init__(
        self,
        use_llm: bool = False,
        llm_api_key: Optional[str] = None,
    ):
        """
        Initialize the transaction extractor.

        Args:
            use_llm: If True, use Claude LLM for transaction extraction.
                     Falls back to regex if LLM fails or is unavailable.
            llm_api_key: Anthropic API key. If not provided, uses ANTHROPIC_API_KEY env var.
        """
        if not HAS_PDFPLUMBER:
            logger.warning("pdfplumber not available - transaction extraction disabled")

        self._use_llm = use_llm
        self._llm_api_key = llm_api_key
        self._llm_extractor: Optional["LLMTransactionExtractor"] = None

    def _get_llm_extractor(self) -> Optional["LLMTransactionExtractor"]:
        """Lazily create the LLM extractor when needed."""
        if self._llm_extractor is None and self._use_llm:
            try:
                from .llm_transaction_extractor import LLMTransactionExtractor
                self._llm_extractor = LLMTransactionExtractor(api_key=self._llm_api_key)
                logger.info("llm_transaction_extractor_initialized")
            except (ImportError, ValueError) as e:
                logger.warning("llm_extractor_unavailable", error=str(e))
                self._use_llm = False  # Disable to avoid repeated failures
        return self._llm_extractor

    def extract_transactions(
        self,
        pdf_path: str,
        statement_date: Optional[date] = None,
    ) -> list[BankTransaction]:
        """
        Extract transactions from a bank statement PDF.

        If LLM extraction is enabled, tries LLM first for more reliable
        credit/debit classification, then falls back to regex if needed.

        Args:
            pdf_path: Path to bank statement PDF
            statement_date: Optional statement date for year inference

        Returns:
            List of BankTransaction objects
        """
        if not HAS_PDFPLUMBER:
            logger.warning("pdfplumber not available", file=pdf_path)
            return []

        file_name = Path(pdf_path).name

        # Try LLM extraction first if enabled
        if self._use_llm:
            llm_transactions = self._extract_with_llm(pdf_path, statement_date)
            if llm_transactions:
                logger.info(
                    "llm_transactions_extracted",
                    file=file_name,
                    count=len(llm_transactions),
                )
                return llm_transactions

        # Fall back to regex/table extraction
        return self._extract_with_regex(pdf_path, statement_date)

    def _extract_with_llm(
        self,
        pdf_path: str,
        statement_date: Optional[date] = None,
    ) -> Optional[list[BankTransaction]]:
        """
        Extract transactions using LLM.

        Returns None if extraction fails, allowing fallback to regex.
        """
        llm_extractor = self._get_llm_extractor()
        if not llm_extractor:
            return None

        file_name = Path(pdf_path).name

        try:
            # Extract text from PDF
            full_text = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    full_text.append(text)

            document_text = "\n\n".join(full_text)

            if len(document_text.strip()) < 100:
                logger.warning("llm_extraction_skipped_short_text", file=file_name)
                return None

            # Call LLM extractor
            result = llm_extractor.extract_transactions(
                document_text=document_text,
                source_file=file_name,
                statement_date=statement_date,
            )

            if result.success and result.transactions:
                logger.info(
                    "llm_extraction_success",
                    file=file_name,
                    transactions=len(result.transactions),
                    confidence=result.confidence,
                    tokens=result.tokens_used,
                )
                return result.transactions
            else:
                logger.warning(
                    "llm_extraction_failed",
                    file=file_name,
                    error=result.error,
                )
                return None

        except Exception as e:
            logger.error("llm_extraction_error", file=file_name, error=str(e))
            return None

    def _extract_with_regex(
        self,
        pdf_path: str,
        statement_date: Optional[date] = None,
    ) -> list[BankTransaction]:
        """Extract transactions using regex/table parsing (original method)."""
        transactions = []
        file_name = Path(pdf_path).name

        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Try table extraction first
                    tables = page.extract_tables()
                    for table in tables:
                        txns = self._parse_table(table, file_name, statement_date)
                        transactions.extend(txns)

                    # If no tables found, try text parsing
                    if not tables:
                        text = page.extract_text() or ""
                        txns = self._parse_text(text, file_name, statement_date)
                        transactions.extend(txns)

        except Exception as e:
            logger.error("transaction_extraction_failed", file=pdf_path, error=str(e))

        logger.info(
            "regex_transactions_extracted",
            file=file_name,
            count=len(transactions),
        )

        return transactions

    def _parse_table(
        self,
        table: list[list],
        source_file: str,
        statement_date: Optional[date] = None,
    ) -> list[BankTransaction]:
        """Parse a table to extract transactions."""
        transactions = []

        if not table or len(table) < 2:
            return transactions

        # Try to identify column indices
        header = table[0] if table[0] else []
        header_lower = [str(h).lower() if h else '' for h in header]

        date_col = self._find_column(header_lower, ['date', 'posted', 'trans date'])
        desc_col = self._find_column(header_lower, ['description', 'desc', 'transaction', 'details'])
        amount_col = self._find_column(header_lower, ['amount', 'debit', 'credit', 'withdrawal', 'deposit'])
        debit_col = self._find_column(header_lower, ['debit', 'withdrawal', 'out'])
        credit_col = self._find_column(header_lower, ['credit', 'deposit', 'in'])

        # Parse each row
        for row in table[1:]:
            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                continue

            try:
                txn = self._parse_row(
                    row, date_col, desc_col, amount_col, debit_col, credit_col,
                    source_file, statement_date
                )
                if txn:
                    transactions.append(txn)
            except Exception as e:
                logger.debug("row_parse_error", row=str(row)[:100], error=str(e))

        return transactions

    def _find_column(self, header: list[str], keywords: list[str]) -> int:
        """Find column index matching keywords."""
        for i, h in enumerate(header):
            for kw in keywords:
                if kw in h:
                    return i
        return -1

    def _parse_row(
        self,
        row: list,
        date_col: int,
        desc_col: int,
        amount_col: int,
        debit_col: int,
        credit_col: int,
        source_file: str,
        statement_date: Optional[date],
    ) -> Optional[BankTransaction]:
        """Parse a single row into a transaction."""
        # Extract date
        txn_date = None
        if date_col >= 0 and date_col < len(row) and row[date_col]:
            txn_date = self._parse_date(str(row[date_col]), statement_date)

        if not txn_date:
            # Try to find date anywhere in row
            for cell in row:
                if cell:
                    txn_date = self._parse_date(str(cell), statement_date)
                    if txn_date:
                        break

        if not txn_date:
            return None

        # Extract description
        description = ""
        if desc_col >= 0 and desc_col < len(row) and row[desc_col]:
            description = str(row[desc_col]).strip()
        else:
            # Use longest text cell as description
            for cell in row:
                if cell and len(str(cell)) > len(description):
                    cell_str = str(cell).strip()
                    # Skip if it looks like a number
                    if not re.match(r'^[\d,.$\-]+$', cell_str):
                        description = cell_str

        if not description:
            return None

        # Extract amount
        amount = Decimal("0")
        is_debit = True

        # Try separate debit/credit columns
        if debit_col >= 0 and debit_col < len(row) and row[debit_col]:
            amount = self._parse_amount(str(row[debit_col]))
            is_debit = True
            amount = -abs(amount)  # Debits are negative
        elif credit_col >= 0 and credit_col < len(row) and row[credit_col]:
            amount = self._parse_amount(str(row[credit_col]))
            is_debit = False
            amount = abs(amount)  # Credits are positive

        # Try single amount column
        if amount == 0 and amount_col >= 0 and amount_col < len(row) and row[amount_col]:
            amount_str = str(row[amount_col])
            amount = self._parse_amount(amount_str)
            # Infer direction from text
            is_debit = not any(kw in amount_str.lower() for kw in ['cr', 'credit', '+'])
            if is_debit:
                amount = -abs(amount)
            else:
                amount = abs(amount)

        if amount == 0:
            return None

        # Categorize
        category = categorize_transaction(description, amount)

        return BankTransaction(
            date=txn_date,
            description=description,
            amount=amount,
            category=category,
            is_debit=is_debit,
            source_file=source_file,
            confidence=0.8,
        )

    def _parse_text(
        self,
        text: str,
        source_file: str,
        statement_date: Optional[date] = None,
    ) -> list[BankTransaction]:
        """Parse text to extract transactions (fallback when no tables)."""
        transactions = []
        lines = text.split('\n')

        # Pattern for amount at END of line (common in bank statements)
        # Matches: 29.95, 1,234.56, $29.95, (29.95), -29.95
        end_amount_pattern = re.compile(
            r'[\s]+'  # Whitespace before amount
            r'(\()?'  # Optional opening paren (for negative)
            r'\$?'    # Optional dollar sign
            r'([\d,]+\.\d{2})'  # Amount with exactly 2 decimal places
            r'(\))?'  # Optional closing paren
            r'\s*$'   # End of line
        )

        for line in lines:
            line = line.strip()
            if len(line) < 10:
                continue

            # Look for lines with date at START
            txn_date = None
            date_match = None
            for pattern in self.DATE_PATTERNS:
                match = re.match(pattern, line)  # Match at START
                if match:
                    txn_date = self._parse_date(match.group(1), statement_date)
                    if txn_date:
                        date_match = match
                        break

            if not txn_date:
                continue

            # Look for amount at END of line
            amount_match = end_amount_pattern.search(line)
            if not amount_match:
                continue

            amount_str = amount_match.group(2)
            amount = self._parse_amount(amount_str)
            if amount == 0 or amount < Decimal("0.01"):
                continue

            # Extract description (text between date and amount)
            desc_start = date_match.end() if date_match else 0
            desc_end = amount_match.start()
            description = line[desc_start:desc_end].strip()

            # Clean up description
            description = re.sub(r'\s+', ' ', description).strip()

            if len(description) < 3:
                continue

            # Determine direction from parentheses or keywords
            has_parens = amount_match.group(1) and amount_match.group(3)
            # Credit keywords - money coming IN to the account
            credit_keywords = [
                'deposit', 'credit', 'zelle payment from', 'transfer from',
                'payroll', 'direct dep', 'ppd', 'ach credit',
                'refund', 'cashback', 'interest', 'dividend',
            ]
            is_credit = any(kw in line.lower() for kw in credit_keywords)
            is_debit = has_parens or not is_credit

            if is_debit:
                amount = -abs(amount)
            else:
                amount = abs(amount)

            category = categorize_transaction(description, amount)

            transactions.append(BankTransaction(
                date=txn_date,
                description=description,
                amount=amount,
                category=category,
                is_debit=is_debit,
                source_file=source_file,
                confidence=0.7,
            ))

        return transactions

    def _parse_date(self, date_str: str, statement_date: Optional[date] = None) -> Optional[date]:
        """Parse date string into date object."""
        date_str = date_str.strip()

        formats = [
            '%m/%d/%Y', '%m/%d/%y', '%m-%d-%Y', '%m-%d-%y',
            '%Y-%m-%d', '%b %d, %Y', '%b %d %Y',
            '%B %d, %Y', '%B %d %Y',
        ]

        for fmt in formats:
            try:
                parsed = datetime.strptime(date_str, fmt).date()
                # If year is 2-digit and seems wrong, adjust
                if parsed.year > 2099:
                    parsed = parsed.replace(year=parsed.year - 100)
                elif parsed.year < 2000:
                    parsed = parsed.replace(year=parsed.year + 2000)
                return parsed
            except ValueError:
                continue

        # Try MM/DD format (without year) - infer year from statement date or current year
        try:
            if '/' in date_str and len(date_str) <= 5:
                parts = date_str.split('/')
                if len(parts) == 2:
                    month = int(parts[0])
                    day = int(parts[1])
                    # Use statement year or current year
                    year = statement_date.year if statement_date else datetime.now().year
                    return date(year, month, day)
        except (ValueError, AttributeError):
            pass

        return None

    def _parse_amount(self, amount_str: str) -> Decimal:
        """Parse amount string into Decimal."""
        if not amount_str:
            return Decimal("0")

        # Remove currency symbols and whitespace
        clean = re.sub(r'[$,\s]', '', amount_str)

        # Handle parentheses as negative
        if clean.startswith('(') and clean.endswith(')'):
            clean = '-' + clean[1:-1]

        # Handle CR/DR suffixes
        clean = re.sub(r'(cr|dr|credit|debit)$', '', clean, flags=re.IGNORECASE)

        try:
            return Decimal(clean)
        except InvalidOperation:
            return Decimal("0")


# =============================================================================
# BUDGET AGGREGATION
# =============================================================================

def aggregate_monthly_budgets(
    transactions: list[BankTransaction],
    months: Optional[int] = None,
) -> list[MonthlyBudget]:
    """
    Aggregate transactions into monthly budgets.

    Args:
        transactions: List of transactions to aggregate
        months: Optional limit on number of months

    Returns:
        List of MonthlyBudget sorted by date (newest first)
    """
    if not transactions:
        return []

    # Group by month
    by_month: dict[str, list[BankTransaction]] = defaultdict(list)
    for txn in transactions:
        month_key = txn.date.strftime('%Y-%m')
        by_month[month_key].append(txn)

    # Build monthly budgets
    budgets = []
    for month_key in sorted(by_month.keys(), reverse=True):
        if months and len(budgets) >= months:
            break

        month_txns = by_month[month_key]
        budget = _build_monthly_budget(month_key, month_txns)
        budgets.append(budget)

    return budgets


def _build_monthly_budget(month_key: str, transactions: list[BankTransaction]) -> MonthlyBudget:
    """Build a MonthlyBudget from a list of transactions."""
    year, month = map(int, month_key.split('-'))

    # Aggregate by category
    category_totals: dict[TransactionCategory, Decimal] = defaultdict(Decimal)
    category_txns: dict[TransactionCategory, list[BankTransaction]] = defaultdict(list)

    total_income = Decimal("0")
    total_expenses = Decimal("0")
    source_files = set()

    for txn in transactions:
        category_totals[txn.category] += abs(txn.amount)
        category_txns[txn.category].append(txn)
        source_files.add(txn.source_file)

        if txn.amount > 0:
            total_income += txn.amount
        else:
            total_expenses += abs(txn.amount)

    # Build category summaries
    category_details = []
    for cat, total in category_totals.items():
        summary = CategorySummary(
            category=cat,
            total=total,
            count=len(category_txns[cat]),
            transactions=category_txns[cat],
        )
        category_details.append(summary)

    # Sort by total descending
    category_details.sort(key=lambda x: x.total, reverse=True)

    return MonthlyBudget(
        month=month_key,
        year=year,
        month_number=month,
        categories=dict(category_totals),
        category_details=category_details,
        total_income=total_income,
        total_expenses=total_expenses,
        net_cashflow=total_income - total_expenses,
        transaction_count=len(transactions),
        source_files=list(source_files),
    )


def build_budget_analysis(budgets: list[MonthlyBudget]) -> BudgetAnalysis:
    """
    Build comprehensive budget analysis from monthly budgets.

    Args:
        budgets: List of MonthlyBudget objects

    Returns:
        BudgetAnalysis with trends and recommendations
    """
    if not budgets:
        return BudgetAnalysis()

    # Calculate averages
    total_income = sum(b.total_income for b in budgets)
    total_expenses = sum(b.total_expenses for b in budgets)
    total_cashflow = sum(b.net_cashflow for b in budgets)
    n = len(budgets)

    # Category averages
    category_totals: dict[TransactionCategory, Decimal] = defaultdict(Decimal)
    for budget in budgets:
        for cat, total in budget.categories.items():
            category_totals[cat] += total

    avg_by_category = {cat: total / n for cat, total in category_totals.items()}

    # Top expense categories
    expense_cats = [
        (cat, avg) for cat, avg in avg_by_category.items()
        if cat not in [TransactionCategory.INCOME, TransactionCategory.PAYCHECK,
                       TransactionCategory.TRANSFER_IN]
    ]
    expense_cats.sort(key=lambda x: x[1], reverse=True)
    top_expenses = expense_cats[:5]

    # Date range
    all_months = [b.month for b in budgets]
    date_start = datetime.strptime(min(all_months), '%Y-%m').date()
    date_end = datetime.strptime(max(all_months), '%Y-%m').date()

    # Generate insights
    trends = []
    recommendations = []

    avg_income = total_income / n
    avg_expenses = total_expenses / n
    savings_rate = ((avg_income - avg_expenses) / avg_income * 100) if avg_income > 0 else Decimal("0")

    if savings_rate < 10:
        recommendations.append(
            f"Savings rate is {savings_rate:.1f}%. Consider reducing discretionary spending."
        )
    elif savings_rate > 30:
        trends.append(f"Strong savings rate of {savings_rate:.1f}%")

    # Dining out analysis
    dining_avg = avg_by_category.get(TransactionCategory.RESTAURANTS, Decimal("0"))
    if dining_avg > 300:
        recommendations.append(
            f"Restaurant spending averages ${dining_avg:.0f}/month. Consider meal prep."
        )

    return BudgetAnalysis(
        months=budgets,
        date_range_start=date_start,
        date_range_end=date_end,
        avg_monthly_income=avg_income,
        avg_monthly_expenses=avg_expenses,
        avg_net_cashflow=total_cashflow / n,
        avg_by_category=avg_by_category,
        top_expense_categories=top_expenses,
        spending_trends=trends,
        recommendations=recommendations,
    )
