"""Core financial data models for transaction and account management.

This module provides form-agnostic financial data structures for:
- Bank transactions and categorization
- Bank account management with transaction history
- Financial period analysis and reporting
- Monthly spending breakdowns

These models are designed to be reusable across different financial
analysis contexts, independent of specific IRS forms or tax calculations.
"""

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, computed_field, field_validator


class TransactionCategory(str, Enum):
    """Categories for classifying financial transactions.

    These categories map to common spending patterns and can be
    used for budgeting, expense tracking, and financial analysis.
    """

    # Income categories
    INCOME_SALARY = "income_salary"
    INCOME_FREELANCE = "income_freelance"
    INCOME_INVESTMENT = "income_investment"
    INCOME_TRANSFER = "income_transfer"
    INCOME_OTHER = "income_other"

    # Housing
    HOUSING_RENT = "housing_rent"
    HOUSING_MORTGAGE = "housing_mortgage"
    HOUSING_UTILITIES = "housing_utilities"
    HOUSING_MAINTENANCE = "housing_maintenance"
    HOUSING_INSURANCE = "housing_insurance"

    # Transportation
    TRANSPORTATION_GAS = "transportation_gas"
    TRANSPORTATION_AUTO_PAYMENT = "transportation_auto_payment"
    TRANSPORTATION_AUTO_INSURANCE = "transportation_auto_insurance"
    TRANSPORTATION_PUBLIC = "transportation_public"
    TRANSPORTATION_RIDESHARE = "transportation_rideshare"
    TRANSPORTATION_PARKING = "transportation_parking"
    TRANSPORTATION_MAINTENANCE = "transportation_maintenance"

    # Food and Dining
    FOOD_GROCERIES = "food_groceries"
    FOOD_RESTAURANTS = "food_restaurants"
    FOOD_DELIVERY = "food_delivery"
    FOOD_COFFEE = "food_coffee"

    # Healthcare
    HEALTHCARE_INSURANCE = "healthcare_insurance"
    HEALTHCARE_MEDICAL = "healthcare_medical"
    HEALTHCARE_PHARMACY = "healthcare_pharmacy"
    HEALTHCARE_DENTAL = "healthcare_dental"
    HEALTHCARE_VISION = "healthcare_vision"

    # Shopping
    SHOPPING_GENERAL = "shopping_general"
    SHOPPING_CLOTHING = "shopping_clothing"
    SHOPPING_ELECTRONICS = "shopping_electronics"
    SHOPPING_HOME = "shopping_home"

    # Entertainment
    ENTERTAINMENT_GENERAL = "entertainment_general"
    ENTERTAINMENT_SUBSCRIPTIONS = "entertainment_subscriptions"
    ENTERTAINMENT_STREAMING = "entertainment_streaming"
    ENTERTAINMENT_EVENTS = "entertainment_events"

    # Financial
    FINANCIAL_DEBT_PAYMENT = "financial_debt_payment"
    FINANCIAL_SAVINGS = "financial_savings"
    FINANCIAL_INVESTMENT = "financial_investment"
    FINANCIAL_FEES = "financial_fees"
    FINANCIAL_TAXES = "financial_taxes"

    # Personal
    PERSONAL_CHILDCARE = "personal_childcare"
    PERSONAL_EDUCATION = "personal_education"
    PERSONAL_PETS = "personal_pets"
    PERSONAL_GIFTS = "personal_gifts"
    PERSONAL_CHARITY = "personal_charity"

    # Transfers
    TRANSFER_INTERNAL = "transfer_internal"
    TRANSFER_EXTERNAL = "transfer_external"

    # Other
    ATM_WITHDRAWAL = "atm_withdrawal"
    OTHER = "other"
    UNCATEGORIZED = "uncategorized"


class Transaction(BaseModel):
    """A single financial transaction.

    Represents an individual debit or credit transaction from a bank
    account, credit card, or other financial instrument.
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "date": "2025-01-15",
                    "description": "AMAZON.COM*1A2B3C4D5",
                    "amount": "-49.99",
                    "category": "shopping_general",
                    "merchant": "Amazon",
                }
            ]
        }
    }

    date: date = Field(
        description="The date the transaction occurred or was posted"
    )
    description: str = Field(
        description="Original transaction description from the bank statement"
    )
    amount: Decimal = Field(
        description="Transaction amount. Negative for debits/expenses, positive for credits/income"
    )
    category: TransactionCategory = Field(
        default=TransactionCategory.UNCATEGORIZED,
        description="Category classification for the transaction",
    )
    merchant: Optional[str] = Field(
        default=None,
        description="Normalized merchant name, if identified",
    )
    reference_id: Optional[str] = Field(
        default=None,
        description="Unique reference ID from the bank or statement",
    )
    memo: Optional[str] = Field(
        default=None,
        description="Additional notes or memo for the transaction",
    )
    source_file: Optional[str] = Field(
        default=None,
        description="Source file or document this transaction was extracted from",
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for category classification (0.0 to 1.0)",
    )

    @computed_field
    @property
    def is_debit(self) -> bool:
        """Returns True if this is a debit (expense) transaction."""
        return self.amount < 0

    @computed_field
    @property
    def is_credit(self) -> bool:
        """Returns True if this is a credit (income) transaction."""
        return self.amount > 0

    @computed_field
    @property
    def abs_amount(self) -> Decimal:
        """Returns the absolute value of the transaction amount."""
        return abs(self.amount)

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount_to_decimal(cls, v):
        """Coerce string amounts to Decimal."""
        if isinstance(v, str):
            return Decimal(v)
        return v


class BankAccount(BaseModel):
    """A bank account with associated transactions.

    Represents a single bank account (checking, savings, credit card, etc.)
    with its transaction history and calculated balances.
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "institution_name": "Chase Bank",
                    "account_name": "Primary Checking",
                    "account_type": "checking",
                    "account_number_last_four": "1234",
                    "opening_balance": "5000.00",
                    "transactions": [],
                }
            ]
        }
    }

    institution_name: str = Field(
        description="Name of the financial institution (e.g., 'Chase Bank', 'Bank of America')"
    )
    account_name: str = Field(
        description="Display name for the account (e.g., 'Primary Checking', 'Emergency Savings')"
    )
    account_type: str = Field(
        description="Type of account: checking, savings, credit_card, investment, etc."
    )
    account_number_last_four: Optional[str] = Field(
        default=None,
        description="Last 4 digits of the account number for identification",
    )
    opening_balance: Decimal = Field(
        default=Decimal("0"),
        description="Account balance at the start of the analysis period",
    )
    transactions: list[Transaction] = Field(
        default_factory=list,
        description="List of transactions for this account",
    )

    @computed_field
    @property
    def current_balance(self) -> Decimal:
        """Calculate current balance from opening balance and transactions."""
        return self.opening_balance + sum(t.amount for t in self.transactions)

    @computed_field
    @property
    def total_credits(self) -> Decimal:
        """Sum of all credit (positive) transactions."""
        return sum(t.amount for t in self.transactions if t.is_credit)

    @computed_field
    @property
    def total_debits(self) -> Decimal:
        """Sum of all debit (negative) transactions (returned as positive)."""
        return sum(t.abs_amount for t in self.transactions if t.is_debit)

    @computed_field
    @property
    def transaction_count(self) -> int:
        """Total number of transactions."""
        return len(self.transactions)

    def get_transactions_by_category(
        self, category: TransactionCategory
    ) -> list[Transaction]:
        """Get all transactions matching a specific category."""
        return [t for t in self.transactions if t.category == category]

    def get_transactions_in_range(
        self, start_date: date, end_date: date
    ) -> list[Transaction]:
        """Get transactions within a date range (inclusive)."""
        return [
            t for t in self.transactions if start_date <= t.date <= end_date
        ]


class FinancialPeriod(BaseModel):
    """A financial reporting period with summary statistics.

    Represents a date range (typically a month, quarter, or year)
    with aggregated financial metrics for analysis and reporting.
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "start_date": "2025-01-01",
                    "end_date": "2025-01-31",
                    "label": "January 2025",
                    "total_income": "5000.00",
                    "total_expenses": "3500.00",
                    "transaction_count": 45,
                }
            ]
        }
    }

    start_date: date = Field(description="Start date of the financial period (inclusive)")
    end_date: date = Field(description="End date of the financial period (inclusive)")
    label: Optional[str] = Field(
        default=None,
        description="Human-readable label for the period (e.g., 'January 2025', 'Q1 2025')",
    )
    total_income: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
        description="Total income (credits) for the period",
    )
    total_expenses: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
        description="Total expenses (debits) for the period",
    )
    opening_balance: Optional[Decimal] = Field(
        default=None,
        description="Account balance at the start of the period",
    )
    closing_balance: Optional[Decimal] = Field(
        default=None,
        description="Account balance at the end of the period",
    )
    transaction_count: int = Field(
        default=0,
        ge=0,
        description="Number of transactions in the period",
    )

    @computed_field
    @property
    def net_cashflow(self) -> Decimal:
        """Net cashflow: income minus expenses."""
        return self.total_income - self.total_expenses

    @computed_field
    @property
    def savings_rate(self) -> Decimal:
        """Savings rate as a percentage of income (0-100)."""
        if self.total_income == 0:
            return Decimal("0")
        return (self.net_cashflow / self.total_income) * Decimal("100")

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v, info):
        """Validate that end_date is not before start_date."""
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date must be on or after start_date")
        return v


class MonthlyBreakdown(BaseModel):
    """Monthly spending breakdown by category.

    Provides a detailed view of spending patterns for a single month,
    organized by transaction category for budgeting and analysis.
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "year": 2025,
                    "month": 1,
                    "category_totals": {
                        "food_groceries": "450.00",
                        "housing_rent": "1800.00",
                        "transportation_gas": "120.00",
                    },
                    "total_income": "5000.00",
                    "total_expenses": "3500.00",
                }
            ]
        }
    }

    year: int = Field(
        ge=1900,
        le=2100,
        description="Year of the monthly breakdown",
    )
    month: int = Field(
        ge=1,
        le=12,
        description="Month number (1-12)",
    )
    category_totals: dict[TransactionCategory, Decimal] = Field(
        default_factory=dict,
        description="Total spending by category (absolute values for expenses)",
    )
    category_counts: dict[TransactionCategory, int] = Field(
        default_factory=dict,
        description="Number of transactions by category",
    )
    total_income: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
        description="Total income for the month",
    )
    total_expenses: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
        description="Total expenses for the month",
    )
    transaction_count: int = Field(
        default=0,
        ge=0,
        description="Total number of transactions for the month",
    )
    source_accounts: list[str] = Field(
        default_factory=list,
        description="List of account names included in this breakdown",
    )

    @computed_field
    @property
    def net_cashflow(self) -> Decimal:
        """Net cashflow: income minus expenses."""
        return self.total_income - self.total_expenses

    @computed_field
    @property
    def savings_rate(self) -> Decimal:
        """Savings rate as a percentage of income (0-100)."""
        if self.total_income == 0:
            return Decimal("0")
        return (self.net_cashflow / self.total_income) * Decimal("100")

    @computed_field
    @property
    def label(self) -> str:
        """Human-readable label for the month (e.g., 'January 2025')."""
        from calendar import month_name

        return f"{month_name[self.month]} {self.year}"

    def get_top_expense_categories(self, n: int = 5) -> list[tuple[TransactionCategory, Decimal]]:
        """Get the top N expense categories by amount.

        Args:
            n: Number of top categories to return.

        Returns:
            List of (category, amount) tuples sorted by amount descending.
        """
        # Filter for expense categories (non-income, non-transfer)
        expense_cats = {
            k: v
            for k, v in self.category_totals.items()
            if not k.value.startswith("income_") and not k.value.startswith("transfer_")
        }
        sorted_cats = sorted(expense_cats.items(), key=lambda x: x[1], reverse=True)
        return sorted_cats[:n]
