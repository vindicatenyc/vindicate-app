"""Financial data models for vindicate-core.

This package provides reusable financial data structures for:
- Transaction management and categorization
- Bank account representation
- Financial period analysis
- Monthly spending breakdowns
"""

from vindicate_core.models.financial import (
    BankAccount,
    FinancialPeriod,
    MonthlyBreakdown,
    Transaction,
    TransactionCategory,
)

__all__ = [
    "BankAccount",
    "FinancialPeriod",
    "MonthlyBreakdown",
    "Transaction",
    "TransactionCategory",
]
