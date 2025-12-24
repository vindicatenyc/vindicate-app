"""Core data models for financial calculations."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCategory(str, Enum):
    """IRS expense categories for OIC calculations."""

    HOUSING = "housing"
    UTILITIES = "utilities"
    FOOD = "food"
    TRANSPORTATION = "transportation"
    HEALTHCARE = "healthcare"
    TAXES = "taxes"
    COURT_ORDERED = "court_ordered"
    CHILDCARE = "childcare"
    OTHER_NECESSARY = "other_necessary"


class Expense(BaseModel):
    """A monthly expense item."""

    category: ExpenseCategory
    amount: Decimal = Field(ge=0)
    description: str
    is_necessary: bool = True
    documentation_type: Optional[str] = None


class Debt(BaseModel):
    """A debt obligation."""

    creditor_name: str
    account_number_last_four: str
    total_balance: Decimal
    monthly_payment: Decimal = Field(ge=0)
    interest_rate: Decimal = Field(ge=0, le=100)
    is_secured: bool = False
    collateral_description: Optional[str] = None


class FinancialSnapshot(BaseModel):
    """Complete financial picture for a user at a point in time."""

    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    gross_monthly_income: Decimal
    business_income: Decimal = Decimal("0")
    other_income: Decimal = Decimal("0")
    expenses: list[Expense] = Field(default_factory=list)
    debts: list[Debt] = Field(default_factory=list)
    liquid_assets: Decimal = Decimal("0")
    family_size: int = Field(ge=1, default=1)
    state: str = Field(default="NY", pattern="^[A-Z]{2}$")

    @property
    def total_monthly_income(self) -> Decimal:
        """Calculate total monthly income from all sources."""
        return self.gross_monthly_income + self.business_income + self.other_income


class AuditEntry(BaseModel):
    """Audit log entry for calculation transparency."""

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    step: str
    input_value: str
    output_value: str
    source: str
    notes: Optional[str] = None


class CalculationResult(BaseModel):
    """Result of a financial calculation with full audit trail."""

    gross_income: Decimal
    allowed_expenses: Decimal
    debt_obligations: Decimal
    disposable_income: Decimal
    rcp_48_months: Decimal
    rcp_60_months: Decimal
    audit_log: list[AuditEntry]
    methodology_version: str
    confidence_level: float = Field(ge=0, le=1)
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    warnings: list[str] = Field(default_factory=list)
