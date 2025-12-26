"""Vindicate Agents Interfaces - Data types for pipeline stages."""

from .types import (
    # Enums
    DocumentType,
    TransactionType,
    ClassificationCategory,
    ValidationStatus,
    # Base types
    AuditTrailEntry,
    PipelineWarning,
    Confidence,
    # Pipeline stage types
    RawDocument,
    ExtractedTransaction,
    ExtractedTransactions,
    ClassifiedTransaction,
    ClassifiedTransactions,
    ValidatedTransaction,
    ValidatedTransactions,
    FinancialModel,
)

__all__ = [
    # Enums
    "DocumentType",
    "TransactionType",
    "ClassificationCategory",
    "ValidationStatus",
    # Base types
    "AuditTrailEntry",
    "PipelineWarning",
    "Confidence",
    # Pipeline stage types
    "RawDocument",
    "ExtractedTransaction",
    "ExtractedTransactions",
    "ClassifiedTransaction",
    "ClassifiedTransactions",
    "ValidatedTransaction",
    "ValidatedTransactions",
    "FinancialModel",
]
