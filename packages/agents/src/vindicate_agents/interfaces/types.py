"""Pipeline data types for Vindicate agent processing stages.

This module defines the data contracts between agents in the 5-stage pipeline:
1. Document Intake (RawDocument)
2. Transaction Extraction (ExtractedTransactions)
3. Transaction Classification (ClassifiedTransactions)
4. Transaction Validation (ValidatedTransactions)
5. Financial Model Generation (FinancialModel)

Each stage enriches the data with more structure and validation.
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# =============================================================================
# ENUMERATIONS
# =============================================================================


class DocumentType(str, Enum):
    """Types of financial documents processed by the pipeline."""

    BANK_STATEMENT = "bank_statement"
    PAY_STUB = "pay_stub"
    TAX_RETURN = "tax_return"
    W2 = "w2"
    FORM_1099 = "form_1099"
    CREDIT_CARD_STATEMENT = "credit_card_statement"
    UTILITY_BILL = "utility_bill"
    LEASE_AGREEMENT = "lease_agreement"
    MORTGAGE_STATEMENT = "mortgage_statement"
    INVESTMENT_STATEMENT = "investment_statement"
    UNKNOWN = "unknown"


class TransactionType(str, Enum):
    """Transaction direction/type."""

    CREDIT = "credit"  # Money in
    DEBIT = "debit"  # Money out
    TRANSFER = "transfer"  # Internal transfer
    UNKNOWN = "unknown"


class ClassificationCategory(str, Enum):
    """IRS Form 433-A expense/income categories for classification."""

    # Income categories
    INCOME_WAGES = "income_wages"
    INCOME_SELF_EMPLOYMENT = "income_self_employment"
    INCOME_SOCIAL_SECURITY = "income_social_security"
    INCOME_PENSION = "income_pension"
    INCOME_RENTAL = "income_rental"
    INCOME_INTEREST_DIVIDENDS = "income_interest_dividends"
    INCOME_OTHER = "income_other"

    # National Standards (Food/Clothing/Misc)
    FOOD = "food"
    CLOTHING = "clothing"
    PERSONAL_CARE = "personal_care"
    HOUSEKEEPING = "housekeeping"
    MISCELLANEOUS = "miscellaneous"

    # Housing and Utilities
    HOUSING_RENT = "housing_rent"
    HOUSING_MORTGAGE = "housing_mortgage"
    HOUSING_PROPERTY_TAX = "housing_property_tax"
    HOUSING_INSURANCE = "housing_insurance"
    UTILITIES = "utilities"

    # Transportation
    VEHICLE_PAYMENT = "vehicle_payment"
    VEHICLE_OPERATING = "vehicle_operating"
    PUBLIC_TRANSPORTATION = "public_transportation"

    # Healthcare
    HEALTH_INSURANCE = "health_insurance"
    OUT_OF_POCKET_HEALTHCARE = "out_of_pocket_healthcare"

    # Court-Ordered
    CHILD_SUPPORT = "child_support"
    ALIMONY = "alimony"

    # Other Necessary Expenses
    CHILDCARE = "childcare"
    LIFE_INSURANCE = "life_insurance"
    TAX_PAYMENTS = "tax_payments"
    STUDENT_LOANS = "student_loans"

    # Non-allowable/discretionary
    ENTERTAINMENT = "entertainment"
    DINING_OUT = "dining_out"
    SUBSCRIPTIONS = "subscriptions"
    SHOPPING = "shopping"

    # Financial
    SAVINGS = "savings"
    DEBT_PAYMENT = "debt_payment"
    TRANSFER = "transfer"
    FEES = "fees"

    # Catch-all
    OTHER = "other"
    UNCLASSIFIED = "unclassified"


class ValidationStatus(str, Enum):
    """Status of transaction validation."""

    VALID = "valid"
    VALID_WITH_WARNINGS = "valid_with_warnings"
    REQUIRES_REVIEW = "requires_review"
    INVALID = "invalid"
    DUPLICATE = "duplicate"


# =============================================================================
# BASE TYPES
# =============================================================================


class AuditTrailEntry(BaseModel):
    """A single entry in the audit trail for traceability."""

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent_name: str
    action: str
    input_summary: str
    output_summary: str
    duration_ms: Optional[int] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        """Pydantic configuration."""

        frozen = False


class PipelineWarning(BaseModel):
    """A warning generated during pipeline processing."""

    code: str = Field(description="Machine-readable warning code")
    message: str = Field(description="Human-readable warning message")
    severity: str = Field(
        default="warning", description="Severity: info, warning, error"
    )
    source_agent: str = Field(description="Agent that generated the warning")
    source_field: Optional[str] = Field(
        default=None, description="Field that triggered the warning"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        frozen = False


class Confidence(BaseModel):
    """Confidence score with breakdown."""

    overall: float = Field(ge=0.0, le=1.0, description="Overall confidence 0-1")
    extraction: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Extraction confidence"
    )
    classification: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Classification confidence"
    )
    validation: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Validation confidence"
    )
    reasoning: Optional[str] = Field(
        default=None, description="Explanation for confidence score"
    )

    class Config:
        """Pydantic configuration."""

        frozen = False


# =============================================================================
# STAGE 1: RAW DOCUMENT (Agent 1 Output)
# =============================================================================


class RawDocument(BaseModel):
    """Output from Agent 1: Document Intake.

    Represents a raw financial document that has been ingested and had
    basic text extracted. No transaction parsing yet - just raw content.
    """

    # Identity
    id: UUID = Field(default_factory=uuid4)
    case_id: Optional[str] = Field(
        default=None, description="Associated case/client ID"
    )

    # Document info
    document_type: DocumentType
    source_filename: str
    source_path: Optional[str] = None
    file_hash: Optional[str] = Field(
        default=None, description="SHA-256 hash of source file"
    )

    # Extracted content
    raw_text: str = Field(description="Full extracted text from document")
    page_count: int = Field(default=1, ge=1)
    extracted_tables: list[list[list[str]]] = Field(
        default_factory=list, description="Tables extracted from document"
    )

    # Document metadata detected
    statement_date: Optional[date] = Field(
        default=None, description="Statement date if detected"
    )
    account_number_masked: Optional[str] = Field(
        default=None, description="Last 4 digits of account"
    )
    institution_name: Optional[str] = Field(
        default=None, description="Bank/institution name"
    )

    # Processing metadata
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: Confidence
    audit_trail: list[AuditTrailEntry] = Field(default_factory=list)
    warnings: list[PipelineWarning] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        frozen = False


# =============================================================================
# STAGE 2: EXTRACTED TRANSACTIONS (Agent 2 Output)
# =============================================================================


class ExtractedTransaction(BaseModel):
    """A single transaction extracted from a document."""

    # Identity
    id: UUID = Field(default_factory=uuid4)
    source_document_id: UUID

    # Transaction data
    date: date
    description: str
    amount: Decimal = Field(description="Absolute amount")
    transaction_type: TransactionType
    raw_text: str = Field(description="Original text from document")

    # Optional fields extracted
    merchant: Optional[str] = None
    check_number: Optional[str] = None
    reference_number: Optional[str] = None
    balance_after: Optional[Decimal] = None

    # Extraction metadata
    confidence: float = Field(ge=0.0, le=1.0)
    extraction_method: str = Field(
        default="llm", description="Method used: llm, regex, table"
    )
    page_number: Optional[int] = None
    row_index: Optional[int] = None

    class Config:
        """Pydantic configuration."""

        frozen = False


class ExtractedTransactions(BaseModel):
    """Output from Agent 2: Transaction Extraction.

    Contains all transactions extracted from a RawDocument.
    """

    # Identity
    id: UUID = Field(default_factory=uuid4)
    source_document_id: UUID

    # Extracted data
    transactions: list[ExtractedTransaction] = Field(default_factory=list)

    # Summary statistics
    total_credits: Decimal = Field(default=Decimal("0"))
    total_debits: Decimal = Field(default=Decimal("0"))
    transaction_count: int = Field(default=0)
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None

    # Processing metadata
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: Confidence
    audit_trail: list[AuditTrailEntry] = Field(default_factory=list)
    warnings: list[PipelineWarning] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        frozen = False

    @property
    def net_cashflow(self) -> Decimal:
        """Net cashflow (credits - debits)."""
        return self.total_credits - self.total_debits


# =============================================================================
# STAGE 3: CLASSIFIED TRANSACTIONS (Agent 3 Output)
# =============================================================================


class ClassifiedTransaction(BaseModel):
    """A transaction with IRS category classification."""

    # Core transaction data (from extraction)
    id: UUID = Field(default_factory=uuid4)
    source_transaction_id: UUID
    date: date
    description: str
    amount: Decimal
    transaction_type: TransactionType

    # Classification
    category: ClassificationCategory
    subcategory: Optional[str] = Field(
        default=None, description="More specific categorization"
    )
    is_recurring: bool = Field(default=False)
    is_necessary: bool = Field(
        default=True, description="IRS-allowable necessary expense"
    )

    # IRS mapping
    form_433a_line: Optional[str] = Field(
        default=None, description="Form 433-A line number"
    )
    expense_category_irs: Optional[str] = Field(
        default=None, description="IRS expense category code"
    )

    # Classification metadata
    classification_confidence: float = Field(ge=0.0, le=1.0)
    classification_reasoning: Optional[str] = None
    alternative_categories: list[tuple[ClassificationCategory, float]] = Field(
        default_factory=list, description="Alternative classifications with confidence"
    )

    class Config:
        """Pydantic configuration."""

        frozen = False


class ClassifiedTransactions(BaseModel):
    """Output from Agent 3: Transaction Classification.

    All transactions classified into IRS Form 433-A categories.
    """

    # Identity
    id: UUID = Field(default_factory=uuid4)
    source_extraction_id: UUID

    # Classified data
    transactions: list[ClassifiedTransaction] = Field(default_factory=list)

    # Category summaries
    category_totals: dict[str, Decimal] = Field(
        default_factory=dict, description="Total amount per category"
    )
    category_counts: dict[str, int] = Field(
        default_factory=dict, description="Transaction count per category"
    )

    # Recurring transaction detection
    recurring_transactions: list[UUID] = Field(
        default_factory=list, description="IDs of detected recurring transactions"
    )
    monthly_recurring_total: Decimal = Field(default=Decimal("0"))

    # Processing metadata
    classified_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: Confidence
    audit_trail: list[AuditTrailEntry] = Field(default_factory=list)
    warnings: list[PipelineWarning] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        frozen = False


# =============================================================================
# STAGE 4: VALIDATED TRANSACTIONS (Agent 4 Output)
# =============================================================================


class ValidatedTransaction(BaseModel):
    """A transaction that has been validated."""

    # Core transaction data
    id: UUID = Field(default_factory=uuid4)
    source_classification_id: UUID
    date: date
    description: str
    amount: Decimal
    transaction_type: TransactionType
    category: ClassificationCategory

    # Validation status
    validation_status: ValidationStatus
    validation_notes: list[str] = Field(default_factory=list)

    # Anomaly detection
    is_anomaly: bool = Field(default=False)
    anomaly_reason: Optional[str] = None
    anomaly_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="How anomalous (0=normal, 1=very)"
    )

    # Duplicate detection
    is_duplicate: bool = Field(default=False)
    duplicate_of: Optional[UUID] = None

    # Amount validation
    amount_validated: bool = Field(default=True)
    amount_issues: list[str] = Field(default_factory=list)

    # IRS compliance flags
    is_irs_allowable: bool = Field(default=True)
    irs_allowable_amount: Optional[Decimal] = Field(
        default=None, description="IRS-allowed amount if different from actual"
    )
    irs_variance_notes: Optional[str] = None

    class Config:
        """Pydantic configuration."""

        frozen = False


class ValidatedTransactions(BaseModel):
    """Output from Agent 4: Transaction Validation.

    All transactions validated for accuracy, duplicates, and anomalies.
    """

    # Identity
    id: UUID = Field(default_factory=uuid4)
    source_classification_id: UUID

    # Validated data
    transactions: list[ValidatedTransaction] = Field(default_factory=list)

    # Validation summary
    total_valid: int = Field(default=0)
    total_with_warnings: int = Field(default=0)
    total_requires_review: int = Field(default=0)
    total_invalid: int = Field(default=0)
    total_duplicates: int = Field(default=0)

    # Anomaly summary
    anomalies_detected: list[UUID] = Field(default_factory=list)
    anomaly_summary: Optional[str] = None

    # IRS compliance summary
    total_irs_allowable: Decimal = Field(default=Decimal("0"))
    total_irs_variance: Decimal = Field(
        default=Decimal("0"), description="Amount over IRS standards"
    )

    # Processing metadata
    validated_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: Confidence
    audit_trail: list[AuditTrailEntry] = Field(default_factory=list)
    warnings: list[PipelineWarning] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        frozen = False

    @property
    def validation_pass_rate(self) -> float:
        """Percentage of transactions that passed validation."""
        total = len(self.transactions)
        if total == 0:
            return 1.0
        passed = self.total_valid + self.total_with_warnings
        return passed / total


# =============================================================================
# STAGE 5: FINANCIAL MODEL (Agent 5 Output - Final)
# =============================================================================


class FinancialModel(BaseModel):
    """Output from Agent 5: Financial Model Generation (Final).

    Complete financial model ready for Form 433-A calculations.
    This is the final output of the 5-agent pipeline.
    """

    # Identity
    id: UUID = Field(default_factory=uuid4)
    case_id: Optional[str] = None
    client_name: Optional[str] = None

    # Source tracking
    source_document_ids: list[UUID] = Field(default_factory=list)
    analysis_period_start: date
    analysis_period_end: date
    months_analyzed: int = Field(ge=1)

    # Income summary (monthly averages)
    gross_monthly_income: Decimal = Field(default=Decimal("0"))
    income_by_category: dict[str, Decimal] = Field(default_factory=dict)
    income_sources: list[str] = Field(
        default_factory=list, description="Identified income sources"
    )

    # Expense summary (monthly averages)
    total_monthly_expenses: Decimal = Field(default=Decimal("0"))
    expenses_by_category: dict[str, Decimal] = Field(default_factory=dict)

    # IRS Standards Comparison
    irs_allowed_expenses: Decimal = Field(default=Decimal("0"))
    actual_vs_irs_variance: Decimal = Field(default=Decimal("0"))
    over_standard_categories: list[str] = Field(
        default_factory=list, description="Categories exceeding IRS standards"
    )

    # Form 433-A Key Metrics
    monthly_disposable_income: Decimal = Field(default=Decimal("0"))
    reasonable_collection_potential_48: Decimal = Field(
        default=Decimal("0"), description="RCP with 48-month multiplier"
    )
    reasonable_collection_potential_60: Decimal = Field(
        default=Decimal("0"), description="RCP with 60-month multiplier"
    )

    # Assets (if detected from documents)
    liquid_assets_detected: Decimal = Field(default=Decimal("0"))
    total_asset_equity: Decimal = Field(default=Decimal("0"))

    # Recurring obligations
    recurring_expenses: list[dict] = Field(
        default_factory=list, description="Detected recurring monthly expenses"
    )
    total_recurring_monthly: Decimal = Field(default=Decimal("0"))

    # Quality metrics
    data_completeness: float = Field(
        ge=0.0, le=1.0, description="How complete the data is"
    )
    months_with_data: int = Field(default=0)
    transaction_count_total: int = Field(default=0)

    # Recommendations
    recommendations: list[str] = Field(default_factory=list)
    additional_docs_needed: list[str] = Field(
        default_factory=list, description="Documents to request"
    )

    # Full pipeline metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    pipeline_version: str = Field(default="1.0.0")
    confidence: Confidence
    audit_trail: list[AuditTrailEntry] = Field(default_factory=list)
    warnings: list[PipelineWarning] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        frozen = False

    @property
    def net_monthly_cashflow(self) -> Decimal:
        """Net monthly cashflow (income - expenses)."""
        return self.gross_monthly_income - self.total_monthly_expenses

    @property
    def expense_to_income_ratio(self) -> float:
        """Ratio of expenses to income."""
        if self.gross_monthly_income == 0:
            return 0.0
        return float(self.total_monthly_expenses / self.gross_monthly_income)

    @property
    def qualifies_for_cnc(self) -> bool:
        """Whether client likely qualifies for Currently Not Collectible status."""
        return self.monthly_disposable_income <= Decimal("0")
