"""Vindicate Core - Financial calculations and document generation."""

__version__ = "0.1.0"

from .calculator import DisposableIncomeCalculator, Form433ACalculator
from .models import (
    # Legacy exports
    FinancialSnapshot,
    CalculationResult,
    # Form 433-A models
    Form433A,
    Form433AResult,
    PersonalInfo,
    Dependent,
    Employment,
    IncomeSource,
    LivingExpenses,
    BankAccount,
    RealProperty,
    Vehicle,
    OtherAsset,
    Debt,
    TaxPeriod,
    Expense,
    ExpenseAllowance,
    AuditEntry,
    # Worksheet models
    Form433ALineItem,
    Form433AWorksheet,
    # Budget models
    TransactionCategory,
    BankTransaction,
    CategorySummary,
    MonthlyBudget,
    BudgetAnalysis,
    # Enums
    FilingStatus,
    EmploymentType,
    IncomeFrequency,
    IncomeType,
    ExpenseCategory,
    AssetType,
    DebtType,
    USRegion,
)
from .irs_standards import (
    get_irs_standards_version,
    get_national_standard_food_clothing,
    get_housing_standard,
    get_transportation_standard,
    get_healthcare_standard,
    get_all_allowable_expenses,
    calculate_rcp_lump_sum,
    calculate_rcp_periodic,
    MINIMUM_OIC_OFFER,
    IRS_STANDARDS_VERSION,
)
from .pdf_parser import (
    PDFParser,
    BankStatementParser,
    PayStubParser,
    DocumentAnalyzer,
    DocumentType,
    DocumentExtractionResult,
    ExtractedAmount,
    ExtractedDate,
)
from .report_generator import (
    Form433AReportGenerator,
    Form433AWorksheetGenerator,
    MonthlyBudgetReportGenerator,
)
from .data_mapper import (
    DocumentDataMapper,
    AggregatedData,
    PersonData,
    W2Data,
    BankAccountData,
    ExcludedDocument,
    ExtractionAuditEntry,
    ProcessingResult,
)
from .transaction_extractor import (
    TransactionExtractor,
    aggregate_monthly_budgets,
    build_budget_analysis,
    categorize_transaction,
)

# LLM extractor is optional (requires anthropic package)
try:
    from .llm_extractor import LLMExtractor, create_llm_extractor
    from .llm_transaction_extractor import (
        LLMTransactionExtractor,
        LLMTransactionExtractionResult,
        create_llm_transaction_extractor,
    )
    _LLM_AVAILABLE = True
except ImportError:
    _LLM_AVAILABLE = False

__all__ = [
    # Calculators
    "DisposableIncomeCalculator",
    "Form433ACalculator",
    # Legacy models
    "FinancialSnapshot",
    "CalculationResult",
    # Form 433-A models
    "Form433A",
    "Form433AResult",
    "PersonalInfo",
    "Dependent",
    "Employment",
    "IncomeSource",
    "LivingExpenses",
    "BankAccount",
    "RealProperty",
    "Vehicle",
    "OtherAsset",
    "Debt",
    "TaxPeriod",
    "Expense",
    "ExpenseAllowance",
    "AuditEntry",
    # Worksheet models
    "Form433ALineItem",
    "Form433AWorksheet",
    # Budget models
    "TransactionCategory",
    "BankTransaction",
    "CategorySummary",
    "MonthlyBudget",
    "BudgetAnalysis",
    # Enums
    "FilingStatus",
    "EmploymentType",
    "IncomeFrequency",
    "IncomeType",
    "ExpenseCategory",
    "AssetType",
    "DebtType",
    "USRegion",
    # IRS Standards
    "get_irs_standards_version",
    "get_national_standard_food_clothing",
    "get_housing_standard",
    "get_transportation_standard",
    "get_healthcare_standard",
    "get_all_allowable_expenses",
    "calculate_rcp_lump_sum",
    "calculate_rcp_periodic",
    "MINIMUM_OIC_OFFER",
    "IRS_STANDARDS_VERSION",
    # PDF Parsing
    "PDFParser",
    "BankStatementParser",
    "PayStubParser",
    "DocumentAnalyzer",
    "DocumentType",
    "DocumentExtractionResult",
    "ExtractedAmount",
    "ExtractedDate",
    # Report Generation
    "Form433AReportGenerator",
    "Form433AWorksheetGenerator",
    "MonthlyBudgetReportGenerator",
    # Data Mapper
    "DocumentDataMapper",
    "AggregatedData",
    "PersonData",
    "W2Data",
    "BankAccountData",
    "ExcludedDocument",
    "ExtractionAuditEntry",
    "ProcessingResult",
    # Transaction Extractor
    "TransactionExtractor",
    "aggregate_monthly_budgets",
    "build_budget_analysis",
    "categorize_transaction",
]

# Add LLM exports if available
if _LLM_AVAILABLE:
    __all__.extend([
        "LLMExtractor",
        "create_llm_extractor",
        "LLMTransactionExtractor",
        "LLMTransactionExtractionResult",
        "create_llm_transaction_extractor",
    ])
