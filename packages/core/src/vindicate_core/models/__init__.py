"""Financial data models for vindicate-core.

This package provides reusable financial data structures for:
- IRS Form 433-A data structures (legacy.py)
- Transaction management and categorization (financial.py)
- Audit trail and provenance tracking (audit.py)
- Bank account representation
- Financial period analysis
- Monthly spending breakdowns
"""

# Import legacy models (IRS Form 433-A related)
from vindicate_core.models.legacy import (
    # Enumerations
    FilingStatus,
    EmploymentType,
    IncomeFrequency,
    IncomeType,
    ExpenseCategory,
    AssetType,
    DebtType,
    USRegion,
    # Helper functions
    get_region_for_state,
    # Personal Info
    Dependent,
    PersonalInfo,
    # Income
    IncomeSource,
    Employment,
    # Expenses
    Expense,
    LivingExpenses,
    # Assets - note: BankAccount from legacy has different structure
    RealProperty,
    Vehicle,
    OtherAsset,
    # Debts
    Debt,
    TaxPeriod,
    # Form 433-A
    Form433A,
    # Calculation Results
    ExpenseAllowance,
    AuditEntry,  # Legacy AuditEntry for backwards compatibility with calculator.py
    Form433AResult,
    # Worksheet
    Form433ALineItem,
    Form433AWorksheet,
    # Budget (legacy)
    BankTransaction,
    CategorySummary,
    MonthlyBudget,
    BudgetAnalysis,
    # Legacy compatibility
    FinancialSnapshot,
    CalculationResult,
)

# Import legacy BankAccount with alias to avoid conflict
from vindicate_core.models.legacy import BankAccount as LegacyBankAccount

# Import legacy TransactionCategory - keep as default for backwards compat
from vindicate_core.models.legacy import TransactionCategory

# Import new financial models
from vindicate_core.models.financial import (
    Transaction,
    FinancialPeriod,
    MonthlyBreakdown,
)

# Import new models with aliases to distinguish from legacy
from vindicate_core.models.financial import TransactionCategory as NewTransactionCategory
from vindicate_core.models.financial import BankAccount as NewBankAccount

# For backwards compatibility, use the legacy BankAccount as the default export
BankAccount = LegacyBankAccount

# Import audit trail models (new audit system)
# Note: AuditEntry from audit.py is exported as ProvenanceEntry to avoid
# conflict with the legacy AuditEntry used by calculator.py
from vindicate_core.models.audit import (
    AuditSeverity,
    BoundingBox,
    AuditSource,
    AuditEntry as ProvenanceEntry,  # Renamed to avoid conflict with legacy AuditEntry
    AuditWarning,
    AuditError,
    AuditTrail,
)

__all__ = [
    # Enumerations
    "FilingStatus",
    "EmploymentType",
    "IncomeFrequency",
    "IncomeType",
    "ExpenseCategory",
    "AssetType",
    "DebtType",
    "USRegion",
    # Helper functions
    "get_region_for_state",
    # Personal Info
    "Dependent",
    "PersonalInfo",
    # Income
    "IncomeSource",
    "Employment",
    # Expenses
    "Expense",
    "LivingExpenses",
    # Assets
    "BankAccount",  # Legacy version for backwards compat
    "LegacyBankAccount",
    "NewBankAccount",  # New version from financial.py
    "RealProperty",
    "Vehicle",
    "OtherAsset",
    # Debts
    "Debt",
    "TaxPeriod",
    # Form 433-A
    "Form433A",
    # Calculation Results
    "ExpenseAllowance",
    "AuditEntry",  # Legacy AuditEntry for backwards compatibility
    "Form433AResult",
    # Worksheet
    "Form433ALineItem",
    "Form433AWorksheet",
    # Budget models
    "TransactionCategory",  # Legacy version for backwards compat
    "NewTransactionCategory",  # New version from financial.py
    "BankTransaction",
    "CategorySummary",
    "MonthlyBudget",
    "BudgetAnalysis",
    # Legacy compatibility
    "FinancialSnapshot",
    "CalculationResult",
    # New financial models
    "Transaction",
    "FinancialPeriod",
    "MonthlyBreakdown",
    # Audit Trail Models (new audit system)
    "AuditSeverity",
    "BoundingBox",
    "AuditSource",
    "ProvenanceEntry",  # New AuditEntry renamed to avoid conflict
    "AuditWarning",
    "AuditError",
    "AuditTrail",
]
