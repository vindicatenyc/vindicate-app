"""Models package for Vindicate Core.

This package re-exports all models from _models_core.py (original models.py)
and audit.py (audit trail models).

Note: AuditEntry is exported from _models_core for backwards compatibility
with existing calculator code. The new audit trail models use different names
to avoid conflicts.
"""

# Re-export everything from the original models module
from .._models_core import (
    # Enums
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
    # Personal Models
    Dependent,
    PersonalInfo,
    # Income Models
    IncomeSource,
    Employment,
    # Expense Models
    Expense,
    LivingExpenses,
    # Asset Models
    BankAccount,
    RealProperty,
    Vehicle,
    OtherAsset,
    # Debt Models
    Debt,
    TaxPeriod,
    # Main Form 433-A Model
    Form433A,
    # Result Models
    ExpenseAllowance,
    AuditEntry,  # Legacy AuditEntry for backwards compatibility
    Form433AResult,
    Form433ALineItem,
    Form433AWorksheet,
    # Transaction Models
    TransactionCategory,
    BankTransaction,
    CategorySummary,
    MonthlyBudget,
    BudgetAnalysis,
    # Legacy Models
    FinancialSnapshot,
    CalculationResult,
)

# Re-export audit trail models (new audit system)
# Note: AuditEntry from audit.py is exported as ProvenanceEntry to avoid
# conflict with the legacy AuditEntry used by calculator.py
from .audit import (
    AuditSeverity,
    BoundingBox,
    AuditSource,
    AuditEntry as ProvenanceEntry,  # Renamed to avoid conflict
    AuditWarning,
    AuditError,
    AuditTrail,
)

__all__ = [
    # Enums
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
    # Personal Models
    "Dependent",
    "PersonalInfo",
    # Income Models
    "IncomeSource",
    "Employment",
    # Expense Models
    "Expense",
    "LivingExpenses",
    # Asset Models
    "BankAccount",
    "RealProperty",
    "Vehicle",
    "OtherAsset",
    # Debt Models
    "Debt",
    "TaxPeriod",
    # Main Form 433-A Model
    "Form433A",
    # Result Models
    "ExpenseAllowance",
    "AuditEntry",  # Legacy AuditEntry for backwards compatibility
    "Form433AResult",
    "Form433ALineItem",
    "Form433AWorksheet",
    # Transaction Models
    "TransactionCategory",
    "BankTransaction",
    "CategorySummary",
    "MonthlyBudget",
    "BudgetAnalysis",
    # Legacy Models
    "FinancialSnapshot",
    "CalculationResult",
    # Audit Trail Models (new audit system)
    "AuditSeverity",
    "BoundingBox",
    "AuditSource",
    "ProvenanceEntry",  # New AuditEntry renamed to avoid conflict
    "AuditWarning",
    "AuditError",
    "AuditTrail",
]
