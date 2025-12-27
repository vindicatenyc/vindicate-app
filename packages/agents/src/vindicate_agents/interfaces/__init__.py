"""Framework-agnostic agent interfaces.

This package defines the core protocols and result types that any
LLM framework adapter must implement. These interfaces are completely
framework-independent - no imports from Google ADK, LangChain, or
other AI/ML frameworks are allowed.

Available Interfaces:
    AgentProtocol: The core protocol for all agent implementations
    PipelineProtocol: Protocol for agent pipeline orchestration
    AgentResult: Standardized result wrapper for agent outputs
    AgentStatus: Enum for execution status codes

Pipeline Data Types:
    RawDocument: Agent 1 output (document intake)
    ExtractedTransactions: Agent 2 output (transaction extraction)
    ClassifiedTransactions: Agent 3 output (classification)
    ValidatedTransactions: Agent 4 output (validation)
    FinancialModel: Agent 5 output (final model)
"""

from vindicate_agents.interfaces.base import (
    # Type variables
    InputT,
    OutputT,
    ResultT,
    # Enumerations
    AgentStatus,
    # Result models
    AgentResult,
    # Protocols
    AgentProtocol,
    PipelineProtocol,
)

from vindicate_agents.interfaces.types import (
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
    # Type variables
    "InputT",
    "OutputT",
    "ResultT",
    # Enumerations (base)
    "AgentStatus",
    # Result models
    "AgentResult",
    # Protocols
    "AgentProtocol",
    "PipelineProtocol",
    # Enums (pipeline)
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
