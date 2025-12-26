"""PDF parsing utilities for financial document extraction.

This module provides tools for extracting financial data from common
document types:
- Bank statements
- Pay stubs
- IRS transcripts
- Tax forms (W-2, 1099, etc.)
- Credit reports

The extracted data can be used to populate Form 433-A models.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from enum import Enum
from pathlib import Path
from typing import Optional, Union

import structlog
from PyPDF2 import PdfReader

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

logger = structlog.get_logger()


class DocumentType(str, Enum):
    """Types of financial documents."""
    BANK_STATEMENT = "bank_statement"
    PAY_STUB = "pay_stub"
    W2 = "w2"
    FORM_1099 = "1099"
    IRS_TRANSCRIPT = "irs_transcript"
    CREDIT_REPORT = "credit_report"
    TAX_RETURN = "tax_return"
    UTILITY_BILL = "utility_bill"
    RETIREMENT_STATEMENT = "retirement_statement"
    PROPERTY_TAX = "property_tax"
    INSURANCE_STATEMENT = "insurance_statement"
    MORTGAGE_STATEMENT = "mortgage_statement"
    VEHICLE_REGISTRATION = "vehicle_registration"
    UNKNOWN = "unknown"


@dataclass
class ExtractedAmount:
    """An extracted monetary amount with context."""
    amount: Decimal
    label: str
    page: int
    confidence: float = 0.8
    raw_text: Optional[str] = None


@dataclass
class ExtractedDate:
    """An extracted date with context."""
    date: date
    label: str
    page: int
    confidence: float = 0.8
    raw_text: Optional[str] = None


@dataclass
class ExtractedText:
    """Raw extracted text from a document."""
    text: str
    page: int
    document_type: DocumentType = DocumentType.UNKNOWN


@dataclass
class DocumentExtractionResult:
    """Result of document parsing."""
    document_type: DocumentType
    file_path: str
    page_count: int
    raw_text: list[ExtractedText]
    amounts: list[ExtractedAmount] = field(default_factory=list)
    dates: list[ExtractedDate] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    extraction_date: datetime = field(default_factory=datetime.utcnow)

    @property
    def full_text(self) -> str:
        """Get all text as a single string."""
        return "\n\n".join(et.text for et in self.raw_text)


class PDFParser:
    """
    PDF document parser for financial data extraction.

    This parser extracts text and identifies financial amounts from
    PDF documents. It supports various financial document types and
    provides structured extraction results.
    """

    # Common patterns for monetary amounts
    MONEY_PATTERNS = [
        r'\$[\d,]+\.?\d*',  # $1,234.56
        r'\$\s*[\d,]+\.?\d*',  # $ 1,234.56
        r'[\d,]+\.\d{2}\s*(?:USD|usd)?',  # 1,234.56 USD
    ]

    # Date patterns
    DATE_PATTERNS = [
        r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
        r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}',  # January 1, 2024
        r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
    ]

    # Document type indicators
    DOCUMENT_INDICATORS = {
        DocumentType.BANK_STATEMENT: [
            r'(?i)statement\s+period',
            r'(?i)account\s+summary',
            r'(?i)beginning\s+balance',
            r'(?i)ending\s+balance',
            r'(?i)deposits?\s+and\s+credits',
            r'(?i)withdrawals?\s+and\s+debits',
        ],
        DocumentType.PAY_STUB: [
            r'(?i)gross\s+pay',
            r'(?i)net\s+pay',
            r'(?i)ytd\s+(?:gross|net|earnings)',
            r'(?i)federal\s+(?:tax|withholding)',
            r'(?i)fica',
            r'(?i)pay\s+period',
        ],
        DocumentType.W2: [
            r'(?i)form\s+w-?2',
            r'(?i)wage\s+and\s+tax\s+statement',
            r'(?i)employer\s+identification\s+number',
            r'(?i)wages,?\s+tips,?\s+other\s+comp',
        ],
        DocumentType.FORM_1099: [
            r'(?i)form\s+1099',
            r'(?i)miscellaneous\s+income',
            r'(?i)nonemployee\s+compensation',
            r'(?i)payer.?s\s+(?:tin|federal)',
        ],
        DocumentType.IRS_TRANSCRIPT: [
            r'(?i)account\s+transcript',
            r'(?i)tax\s+return\s+transcript',
            r'(?i)internal\s+revenue\s+service',
            r'(?i)transcript\s+requested',
        ],
        DocumentType.CREDIT_REPORT: [
            r'(?i)credit\s+(?:report|score|history)',
            r'(?i)equifax|experian|transunion',
            r'(?i)payment\s+history',
            r'(?i)account\s+status',
            r'(?i)credit\s+limit',
        ],
        DocumentType.UTILITY_BILL: [
            r'(?i)electric\s+(?:bill|statement|service)',
            r'(?i)gas\s+(?:bill|statement|service)',
            r'(?i)water\s+(?:bill|statement|service)',
            r'(?i)utility\s+(?:bill|statement)',
            r'(?i)amount\s+due',
            r'(?i)due\s+date',
            r'(?i)service\s+(?:address|period)',
            r'(?i)(?:con\s*edison|pge|duke\s+energy|national\s+grid)',
            r'(?i)internet\s+(?:bill|statement|service)',
            r'(?i)phone\s+(?:bill|statement)',
            r'(?i)(?:verizon|at&t|t-mobile|comcast|spectrum)',
        ],
        DocumentType.RETIREMENT_STATEMENT: [
            r'(?i)401\s*\(?k\)?',
            r'(?i)403\s*\(?b\)?',
            r'(?i)(?:ira|roth)\s+(?:statement|account)',
            r'(?i)retirement\s+(?:plan|account|statement)',
            r'(?i)pension\s+(?:statement|benefit)',
            r'(?i)(?:fidelity|vanguard|schwab|t\.?\s*rowe)',
            r'(?i)investment\s+(?:summary|statement)',
            r'(?i)total\s+(?:balance|account\s+value)',
        ],
        DocumentType.PROPERTY_TAX: [
            r'(?i)property\s+tax\s+(?:bill|statement|notice)',
            r'(?i)real\s+estate\s+tax',
            r'(?i)tax\s+(?:assessment|levy)',
            r'(?i)parcel\s+(?:id|number)',
            r'(?i)assessed\s+value',
            r'(?i)(?:county|city|town)\s+tax',
        ],
        DocumentType.INSURANCE_STATEMENT: [
            r'(?i)(?:auto|car|vehicle)\s+insurance',
            r'(?i)(?:home|homeowners?|renters?)\s+insurance',
            r'(?i)(?:life|health)\s+insurance\s+(?:policy|statement)',
            r'(?i)premium\s+(?:due|amount)',
            r'(?i)policy\s+(?:number|holder)',
            r'(?i)coverage\s+(?:period|summary)',
            r'(?i)(?:geico|state\s+farm|allstate|progressive|liberty\s+mutual)',
        ],
        DocumentType.MORTGAGE_STATEMENT: [
            r'(?i)mortgage\s+(?:statement|payment)',
            r'(?i)loan\s+(?:statement|balance)',
            r'(?i)principal\s+(?:balance|payment)',
            r'(?i)escrow\s+(?:balance|payment)',
            r'(?i)(?:quicken|rocket|wells\s+fargo|chase)\s+(?:mortgage|home)',
            r'(?i)interest\s+paid',
        ],
        DocumentType.VEHICLE_REGISTRATION: [
            r'(?i)vehicle\s+registration',
            r'(?i)(?:dmv|department\s+of\s+motor)',
            r'(?i)registration\s+(?:fee|renewal)',
            r'(?i)license\s+plate',
            r'(?i)vin\s*:?\s*[a-z0-9]{17}',
        ],
        DocumentType.TAX_RETURN: [
            r'(?i)(?:income\s+)?tax\s+return',
            r'(?i)form\s+(?:1040|IT-?201|IT-?203)',
            r'(?i)resident\s+income\s+tax\s+return',
            r'(?i)adjusted\s+gross\s+income',
            r'(?i)taxable\s+income',
            r'(?i)filing\s+status',
            r'(?i)(?:new\s+york|nys?)\s+(?:state\s+)?(?:income\s+)?tax\s+return',
        ],
    }

    # Financial field patterns for structured extraction
    FIELD_PATTERNS = {
        # Income fields
        'gross_income': [
            r'(?i)gross\s+(?:pay|income|wages?|earnings?)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)total\s+(?:gross|income)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)gross\s*:\s*\$?([\d,]+\.?\d*)',
            r'(?i)(?:current\s+)?gross\s*[:\s]+\$?([\d,]+\.?\d*)',
            r'(?i)this\s+period\s+(?:gross|earnings?)\s*[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)regular\s+(?:pay|earnings?)\s*[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)total\s+(?:current\s+)?earnings?\s*[:\s]*\$?([\d,]+\.?\d*)',
            # Uber/gig economy patterns (amounts often on next line, use [\s\S] for newlines)
            r'(?i)gross\s+trip\s+earnings[^\d]*\+\s*\$?([\d,]+\.?\d+)',
            r'(?i)gross\s+trip\s+earnings[\s\S]{0,30}\+\s*\$?([\d,]+\.?\d+)',
            r'(?i)your\s+gross\s+payment[\s\S]{0,100}\$([\d,]+\.?\d+)',
            r'(?i)reportable\s+payments[\s\S]{0,100}\$([\d,]+\.?\d+)',
        ],
        'net_income': [
            r'(?i)net\s+(?:pay|income|wages?)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)take\s+home[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)net\s*:\s*\$?([\d,]+\.?\d*)',
            r'(?i)net\s+check\s*[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # YTD fields for paystubs
        'ytd_gross': [
            r'(?i)ytd\s+(?:gross|earnings?)\s*[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)(?:gross|earnings?)\s+ytd\s*[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)year[- ]to[- ]date\s+(?:gross|earnings?)\s*[:\s]*\$?([\d,]+\.?\d*)',
            # ADP format: "Gross Pay $CURRENT YTD" - capture the second (YTD) amount
            r'(?i)gross\s+pay\s+\$?[\d,]+\.?\d{2}\s+([\d,]+\.?\d{2})',
        ],
        'ytd_net': [
            r'(?i)ytd\s+net\s*[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)net\s+ytd\s*[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Employee/employer name extraction
        'employee_name': [
            r'(?i)employee\s*(?:name)?[:\s]+([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)',
            r'(?i)paid\s+to[:\s]+([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)',
            r'(?i)payee[:\s]+([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)',
        ],
        'employer_name': [
            r'(?i)employer[:\s]+([A-Za-z][A-Za-z0-9\s&.,]+?)(?:\n|$)',
            r'(?i)company[:\s]+([A-Za-z][A-Za-z0-9\s&.,]+?)(?:\n|$)',
        ],
        # Pay period fields
        'pay_period_start': [
            r'(?i)(?:pay\s+)?period\s*(?:start(?:ing)?|begin(?:ning)?)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ],
        'pay_period_end': [
            r'(?i)(?:pay\s+)?period\s*end(?:ing)?[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ],
        'pay_date': [
            r'(?i)pay\s+date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ],
        'pay_frequency': [
            r'(?i)(weekly|bi-?weekly|semi-?monthly|monthly)\s*(?:pay|payroll)?',
        ],
        'federal_tax': [
            r'(?i)federal\s+(?:tax|income\s+tax|withholding)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)fed\s+(?:tax|w/h)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'state_tax': [
            r'(?i)state\s+(?:tax|income\s+tax|withholding)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'social_security': [
            r'(?i)(?:social\s+security|ss|fica\s+ss|oasdi)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'medicare': [
            r'(?i)(?:medicare|fica\s+med)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Bank statement fields
        'beginning_balance': [
            r'(?i)beginning\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)opening\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)previous\s+balance[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'ending_balance': [
            r'(?i)ending\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)closing\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)current\s+balance[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'total_deposits': [
            r'(?i)total\s+deposits?[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)deposits?\s+and\s+credits[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'total_withdrawals': [
            r'(?i)total\s+withdrawals?[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)withdrawals?\s+and\s+debits[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Utility bill fields
        'amount_due': [
            r'(?i)(?:total\s+)?amount\s+due[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)(?:total\s+)?due[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)pay\s+this\s+amount[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'previous_balance': [
            r'(?i)previous\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)last\s+bill[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Retirement/401K fields
        'account_balance': [
            r'(?i)(?:total\s+)?account\s+(?:balance|value)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)ending\s+(?:balance|value)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)total\s+(?:assets|balance)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'contributions': [
            r'(?i)(?:employee\s+)?contributions?[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)your\s+contributions?[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'employer_match': [
            r'(?i)employer\s+(?:match|contributions?)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)company\s+(?:match|contributions?)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Property tax fields
        'assessed_value': [
            r'(?i)assessed\s+value[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)total\s+assessment[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'property_tax_amount': [
            r'(?i)(?:total\s+)?tax\s+(?:due|amount)[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)annual\s+tax[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Insurance fields
        'premium_amount': [
            r'(?i)(?:monthly\s+)?premium[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)amount\s+due[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'coverage_amount': [
            r'(?i)coverage\s+(?:amount|limit)[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Mortgage fields
        'principal_balance': [
            r'(?i)principal\s+balance[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)(?:unpaid\s+)?loan\s+balance[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'monthly_payment': [
            r'(?i)(?:monthly\s+)?payment\s+(?:due|amount)?[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)regular\s+payment[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'escrow_balance': [
            r'(?i)escrow\s+balance[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # W-2 specific fields
        'wages_tips': [
            r'(?i)wages,?\s*tips,?\s*other\s+comp[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)box\s*1[:\s]*\$?([\d,]+\.?\d*)',
        ],
        'federal_income_tax_withheld': [
            r'(?i)federal\s+income\s+tax\s+withheld[:\s]*\$?([\d,]+\.?\d*)',
            r'(?i)box\s*2[:\s]*\$?([\d,]+\.?\d*)',
        ],
        # Personal info extraction
        'ssn_last4': [
            r'(?i)ssn[:\s]*\*{5}(\d{4})',
            r'(?i)social\s+security[:\s]*\*{5}(\d{4})',
            r'xxx-xx-(\d{4})',
        ],
        'employer_ein': [
            r'(?i)ein[:\s]*(\d{2}-\d{7})',
            r'(?i)employer\s+id[:\s]*(\d{2}-\d{7})',
        ],
    }

    def __init__(self):
        """Initialize the PDF parser."""
        self._compiled_money_patterns = [re.compile(p) for p in self.MONEY_PATTERNS]
        self._compiled_date_patterns = [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS]

    def parse(self, file_path: Union[str, Path]) -> DocumentExtractionResult:
        """
        Parse a PDF document and extract financial data.

        Args:
            file_path: Path to the PDF file

        Returns:
            DocumentExtractionResult with extracted data
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        if not file_path.suffix.lower() == '.pdf':
            raise ValueError(f"File must be a PDF: {file_path}")

        logger.info("parsing_pdf", file_path=str(file_path))

        try:
            reader = PdfReader(file_path)
        except Exception as e:
            raise ValueError(f"Failed to read PDF: {e}")

        # Extract text from all pages using PyPDF2
        raw_text: list[ExtractedText] = []
        for page_num, page in enumerate(reader.pages, start=1):
            try:
                text = page.extract_text() or ""
                raw_text.append(ExtractedText(
                    text=text,
                    page=page_num,
                ))
            except Exception as e:
                logger.warning("page_extraction_failed", page=page_num, error=str(e))
                raw_text.append(ExtractedText(text="", page=page_num))

        # Check if PyPDF2 extracted meaningful text
        full_text = "\n".join(et.text for et in raw_text)

        # If PyPDF2 failed or extracted very little text, try pdfplumber as fallback
        if HAS_PDFPLUMBER and len(full_text.strip()) < 100:
            logger.info("pypdf2_fallback_pdfplumber", file_path=str(file_path), pypdf2_chars=len(full_text.strip()))
            try:
                with pdfplumber.open(file_path) as pdf:
                    raw_text = []
                    for page_num, page in enumerate(pdf.pages, start=1):
                        try:
                            text = page.extract_text() or ""
                            # Normalize pdfplumber output - convert space-separated numbers to proper format
                            # e.g., "$6 136 38" → "$6,136.38"
                            text = self._normalize_pdfplumber_text(text)
                            raw_text.append(ExtractedText(
                                text=text,
                                page=page_num,
                            ))
                        except Exception as e:
                            logger.warning("pdfplumber_page_failed", page=page_num, error=str(e))
                            raw_text.append(ExtractedText(text="", page=page_num))
                    full_text = "\n".join(et.text for et in raw_text)
                    logger.info("pdfplumber_extraction_success", chars_extracted=len(full_text.strip()))
            except Exception as e:
                logger.warning("pdfplumber_fallback_failed", error=str(e))
        doc_type = self._detect_document_type(full_text)

        for et in raw_text:
            et.document_type = doc_type

        # Extract amounts
        amounts = self._extract_amounts(raw_text)

        # Extract dates
        dates = self._extract_dates(raw_text)

        # Extract structured fields
        metadata = self._extract_structured_fields(full_text, doc_type)

        # Build result
        result = DocumentExtractionResult(
            document_type=doc_type,
            file_path=str(file_path),
            page_count=len(reader.pages),
            raw_text=raw_text,
            amounts=amounts,
            dates=dates,
            metadata=metadata,
        )

        logger.info(
            "pdf_parsed",
            file_path=str(file_path),
            document_type=doc_type.value,
            pages=len(reader.pages),
            amounts_found=len(amounts),
        )

        return result

    def _detect_document_type(self, text: str) -> DocumentType:
        """Detect the type of financial document."""
        scores: dict[DocumentType, int] = {}

        for doc_type, patterns in self.DOCUMENT_INDICATORS.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text):
                    score += 1
            if score > 0:
                scores[doc_type] = score

        if not scores:
            return DocumentType.UNKNOWN

        return max(scores, key=scores.get)  # type: ignore

    def _extract_amounts(self, raw_text: list[ExtractedText]) -> list[ExtractedAmount]:
        """Extract monetary amounts from text."""
        amounts: list[ExtractedAmount] = []

        for extracted in raw_text:
            for pattern in self._compiled_money_patterns:
                for match in pattern.finditer(extracted.text):
                    raw_value = match.group()
                    amount = self._parse_amount(raw_value)

                    if amount is not None:
                        # Try to find a label (words before the amount)
                        start = max(0, match.start() - 50)
                        context = extracted.text[start:match.start()]
                        label = self._extract_label(context)

                        amounts.append(ExtractedAmount(
                            amount=amount,
                            label=label or "Unknown",
                            page=extracted.page,
                            raw_text=raw_value,
                        ))

        return amounts

    def _normalize_pdfplumber_text(self, text: str) -> str:
        """
        Normalize pdfplumber output where numbers are space-separated.

        Converts patterns like "$6 136 38" to "$6,136.38" for proper parsing.
        Handles adjacent numbers like "$6 136 38 123 848 69" → "$6,136.38 123,848.69"
        """
        def convert_single_number(parts: list[str], prefix: str = '') -> str:
            """Convert a list of digit groups to a formatted number."""
            if not parts:
                return ''

            # Last part is cents if exactly 2 digits
            if len(parts[-1]) == 2:
                cents = parts.pop()
                whole = ''.join(parts)
                return f"{prefix}{whole}.{cents}"
            else:
                whole = ''.join(parts)
                return f"{prefix}{whole}"

        def fix_numbers(match: re.Match) -> str:
            """Convert space-separated numbers, handling adjacent amounts."""
            prefix = match.group(1)  # $ or empty
            all_parts = match.group(2).split()  # All digit groups

            if len(all_parts) == 1:
                return match.group(0)  # Single number, no change

            # Strategy: Split into separate numbers at boundaries.
            # A new number starts after a 2-digit group (cents) when followed by
            # a larger group (thousands/hundreds of next number)
            numbers = []
            current_parts = []

            for i, part in enumerate(all_parts):
                current_parts.append(part)

                # Check if this could be cents (2 digits) and next part starts new number
                if len(part) == 2 and i + 1 < len(all_parts):
                    next_part = all_parts[i + 1]
                    # Next part is 3+ digits OR we have enough parts for a complete number
                    if len(next_part) >= 3 or len(current_parts) >= 3:
                        # Complete this number
                        num_prefix = prefix if not numbers else ''
                        numbers.append(convert_single_number(current_parts, num_prefix))
                        current_parts = []

            # Handle remaining parts
            if current_parts:
                num_prefix = prefix if not numbers else ''
                numbers.append(convert_single_number(current_parts, num_prefix))

            return ' '.join(numbers)

        # Pattern: $ followed by space-separated digit groups
        # Match: "$6 136 38" or "6 136 38" but not "09/14/2025"
        result = re.sub(
            r'(\$?)(?<![/\-])(\d{1,3}(?:\s+\d{2,3})+)\b(?![/\-])',
            fix_numbers,
            text
        )

        # Also normalize "(cid:X)" garbage characters from corrupted fonts
        result = re.sub(r'\(cid:\d+\)', '', result)

        return result

    def _parse_amount(self, value: str) -> Optional[Decimal]:
        """Parse a monetary string into a Decimal."""
        # Remove $ and other non-numeric chars except . and -
        cleaned = re.sub(r'[^\d.\-]', '', value)

        if not cleaned or cleaned == '.':
            return None

        try:
            return Decimal(cleaned)
        except InvalidOperation:
            return None

    def _extract_label(self, context: str) -> Optional[str]:
        """Extract a label from the context before an amount."""
        # Get last line or phrase
        lines = context.strip().split('\n')
        if lines:
            last_line = lines[-1].strip()
            # Clean up common separators
            last_line = re.sub(r'[:\.\s]+$', '', last_line)
            if len(last_line) > 3 and len(last_line) < 50:
                return last_line
        return None

    def _extract_dates(self, raw_text: list[ExtractedText]) -> list[ExtractedDate]:
        """Extract dates from text."""
        dates: list[ExtractedDate] = []

        for extracted in raw_text:
            for pattern in self._compiled_date_patterns:
                for match in pattern.finditer(extracted.text):
                    raw_value = match.group()
                    parsed = self._parse_date(raw_value)

                    if parsed is not None:
                        # Try to find a label
                        start = max(0, match.start() - 30)
                        context = extracted.text[start:match.start()]
                        label = self._extract_label(context)

                        dates.append(ExtractedDate(
                            date=parsed,
                            label=label or "Date",
                            page=extracted.page,
                            raw_text=raw_value,
                        ))

        return dates

    def _parse_date(self, value: str) -> Optional[date]:
        """Parse a date string into a date object."""
        formats = [
            '%m/%d/%Y',
            '%m-%d-%Y',
            '%Y-%m-%d',
            '%B %d, %Y',
            '%B %d %Y',
            '%b %d, %Y',
            '%b %d %Y',
        ]

        for fmt in formats:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue

        return None

    def _extract_structured_fields(
        self,
        text: str,
        doc_type: DocumentType
    ) -> dict:
        """Extract structured financial fields."""
        fields: dict = {}

        for field_name, patterns in self.FIELD_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    amount_str = match.group(1)
                    amount = self._parse_amount(amount_str)
                    if amount is not None:
                        fields[field_name] = amount
                        break

        return fields


class BankStatementParser(PDFParser):
    """Specialized parser for bank statements."""

    def parse_statement(self, file_path: Union[str, Path]) -> DocumentExtractionResult:
        """Parse a bank statement and extract key financial data."""
        result = self.parse(file_path)

        if result.document_type != DocumentType.BANK_STATEMENT:
            result.warnings.append(
                f"Document may not be a bank statement (detected: {result.document_type.value})"
            )

        return result

    def get_account_balance(self, result: DocumentExtractionResult) -> Optional[Decimal]:
        """Get the ending balance from a parsed statement."""
        return result.metadata.get('ending_balance')

    def get_total_deposits(self, result: DocumentExtractionResult) -> Optional[Decimal]:
        """Get total deposits from a parsed statement."""
        return result.metadata.get('total_deposits')


class PayStubParser(PDFParser):
    """Specialized parser for pay stubs."""

    def parse_paystub(self, file_path: Union[str, Path]) -> DocumentExtractionResult:
        """Parse a pay stub and extract income data."""
        result = self.parse(file_path)

        if result.document_type != DocumentType.PAY_STUB:
            result.warnings.append(
                f"Document may not be a pay stub (detected: {result.document_type.value})"
            )

        return result

    def get_gross_pay(self, result: DocumentExtractionResult) -> Optional[Decimal]:
        """Get gross pay from a parsed pay stub."""
        return result.metadata.get('gross_income')

    def get_net_pay(self, result: DocumentExtractionResult) -> Optional[Decimal]:
        """Get net pay from a parsed pay stub."""
        return result.metadata.get('net_income')

    def get_federal_tax(self, result: DocumentExtractionResult) -> Optional[Decimal]:
        """Get federal tax withholding from a parsed pay stub."""
        return result.metadata.get('federal_tax')


class DocumentAnalyzer:
    """
    High-level document analyzer that routes documents to appropriate parsers.
    """

    def __init__(self):
        """Initialize the document analyzer."""
        self._pdf_parser = PDFParser()
        self._bank_parser = BankStatementParser()
        self._paystub_parser = PayStubParser()

    def analyze(self, file_path: Union[str, Path]) -> DocumentExtractionResult:
        """
        Analyze a document and extract financial data.

        Args:
            file_path: Path to the document

        Returns:
            DocumentExtractionResult with extracted data
        """
        file_path = Path(file_path)

        if file_path.suffix.lower() == '.pdf':
            return self._pdf_parser.parse(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")

    def analyze_multiple(
        self,
        file_paths: list[Union[str, Path]]
    ) -> list[DocumentExtractionResult]:
        """
        Analyze multiple documents.

        Args:
            file_paths: List of document paths

        Returns:
            List of extraction results
        """
        results = []
        for path in file_paths:
            try:
                result = self.analyze(path)
                results.append(result)
            except Exception as e:
                logger.error("document_analysis_failed", path=str(path), error=str(e))

        return results
