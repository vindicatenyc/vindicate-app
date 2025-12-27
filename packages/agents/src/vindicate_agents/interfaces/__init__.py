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

__all__ = [
    # Type variables
    "InputT",
    "OutputT",
    "ResultT",
    # Enumerations
    "AgentStatus",
    # Result models
    "AgentResult",
    # Protocols
    "AgentProtocol",
    "PipelineProtocol",
]
