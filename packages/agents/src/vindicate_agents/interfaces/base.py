"""Framework-agnostic agent interfaces for Vindicate.

This module defines the core protocols (contracts) that any LLM framework
implementation must satisfy. These interfaces use Python's structural subtyping
via typing.Protocol, allowing any class that implements the required methods
to be considered compatible - no explicit inheritance required.

Design Goals:
- Framework independence: No imports from Google ADK, LangChain, or other frameworks
- Duck typing: Any class with matching method signatures is compatible
- Async-first: All processing methods are async for non-blocking I/O
- Type safety: Generic types for input/output provide static type checking

Example Usage:
    ```python
    from vindicate_agents.interfaces.base import AgentProtocol, AgentResult

    class MyDocumentAgent:
        '''A concrete agent implementation.'''

        async def process(self, document: Document) -> AgentResult[ExtractedData]:
            # Implementation here
            ...

        def validate_input(self, document: Document) -> bool:
            return isinstance(document, Document)

    # MyDocumentAgent is compatible with AgentProtocol[Document, ExtractedData]
    # without needing to explicitly inherit from it
    ```
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Generic, Optional, Protocol, TypeVar, runtime_checkable

from pydantic import BaseModel, Field


# =============================================================================
# TYPE VARIABLES
# =============================================================================

InputT = TypeVar("InputT", contravariant=True)
"""Type variable for agent input types. Contravariant for consumer flexibility."""

OutputT = TypeVar("OutputT", covariant=True)
"""Type variable for agent output types. Covariant for producer flexibility."""

ResultT = TypeVar("ResultT")
"""Type variable for result data types."""


# =============================================================================
# ENUMERATIONS
# =============================================================================

class AgentStatus(str, Enum):
    """Status codes for agent execution results."""

    SUCCESS = "success"
    """Agent completed successfully."""

    PARTIAL = "partial"
    """Agent completed but with incomplete results."""

    ERROR = "error"
    """Agent encountered an error during execution."""

    TIMEOUT = "timeout"
    """Agent execution exceeded time limit."""

    CANCELLED = "cancelled"
    """Agent execution was cancelled."""


# =============================================================================
# RESULT MODELS
# =============================================================================

class AgentResult(BaseModel, Generic[ResultT]):
    """Standardized wrapper for agent processing results.

    This model provides a consistent structure for all agent outputs,
    including success/failure status, timing information, and metadata.
    All agent implementations should return their results wrapped in this type.

    Attributes:
        status: The execution status (success, error, partial, etc.)
        data: The actual result data, typed according to the agent's OutputT
        error: Error message if status is ERROR, None otherwise
        error_details: Additional error context (stack trace, etc.)
        started_at: When processing began
        completed_at: When processing finished
        duration_ms: Processing time in milliseconds
        metadata: Additional context about the processing run
        warnings: Non-fatal issues encountered during processing
        agent_name: Name/identifier of the agent that produced this result
        agent_version: Version of the agent implementation

    Example:
        ```python
        result = AgentResult(
            status=AgentStatus.SUCCESS,
            data={"extracted_income": 5000.00},
            agent_name="IncomeExtractorAgent",
            agent_version="1.0.0",
        )
        ```
    """

    status: AgentStatus = Field(
        default=AgentStatus.SUCCESS,
        description="Execution status of the agent"
    )
    data: Optional[Any] = Field(
        default=None,
        description="The result data from agent processing"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if status is ERROR"
    )
    error_details: Optional[dict[str, Any]] = Field(
        default=None,
        description="Additional error context and details"
    )
    started_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when processing started"
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when processing completed"
    )
    duration_ms: Optional[float] = Field(
        default=None,
        ge=0,
        description="Processing duration in milliseconds"
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the processing"
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Non-fatal warnings from processing"
    )
    agent_name: Optional[str] = Field(
        default=None,
        description="Name of the agent that produced this result"
    )
    agent_version: Optional[str] = Field(
        default=None,
        description="Version of the agent implementation"
    )

    @property
    def is_success(self) -> bool:
        """Check if the result indicates successful processing."""
        return self.status == AgentStatus.SUCCESS

    @property
    def is_error(self) -> bool:
        """Check if the result indicates an error occurred."""
        return self.status == AgentStatus.ERROR

    @property
    def has_warnings(self) -> bool:
        """Check if any warnings were generated."""
        return len(self.warnings) > 0

    @classmethod
    def success(
        cls,
        data: Any,
        *,
        agent_name: Optional[str] = None,
        agent_version: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        warnings: Optional[list[str]] = None,
    ) -> AgentResult[Any]:
        """Create a successful result with the given data.

        Args:
            data: The result data
            agent_name: Name of the agent
            agent_version: Version of the agent
            metadata: Additional metadata
            warnings: Any warnings to include

        Returns:
            An AgentResult with SUCCESS status
        """
        return cls(
            status=AgentStatus.SUCCESS,
            data=data,
            agent_name=agent_name,
            agent_version=agent_version,
            metadata=metadata or {},
            warnings=warnings or [],
        )

    @classmethod
    def error(
        cls,
        message: str,
        *,
        details: Optional[dict[str, Any]] = None,
        agent_name: Optional[str] = None,
        agent_version: Optional[str] = None,
    ) -> AgentResult[Any]:
        """Create an error result with the given message.

        Args:
            message: The error message
            details: Additional error context
            agent_name: Name of the agent
            agent_version: Version of the agent

        Returns:
            An AgentResult with ERROR status
        """
        return cls(
            status=AgentStatus.ERROR,
            error=message,
            error_details=details,
            agent_name=agent_name,
            agent_version=agent_version,
        )


# =============================================================================
# AGENT PROTOCOL
# =============================================================================

@runtime_checkable
class AgentProtocol(Protocol[InputT, OutputT]):
    """Protocol defining the contract for all agent implementations.

    This is the core interface that any LLM framework adapter must implement.
    It defines a minimal, framework-agnostic contract for agent behavior:

    - `process()`: The main async method that performs the agent's work
    - `validate_input()`: Validates input before processing

    The protocol uses structural subtyping (duck typing), meaning any class
    that implements these methods with compatible signatures is automatically
    considered an implementation - no explicit inheritance required.

    Type Parameters:
        InputT: The type of input the agent accepts (contravariant)
        OutputT: The type of data in the result (covariant)

    Example Implementation:
        ```python
        class DocumentExtractionAgent:
            '''Extracts structured data from documents.'''

            async def process(
                self,
                document: Document,
            ) -> AgentResult[ExtractedData]:
                # Validate
                if not self.validate_input(document):
                    return AgentResult.error("Invalid document format")

                # Process document with LLM
                extracted = await self._extract_with_llm(document)

                return AgentResult.success(
                    data=extracted,
                    agent_name="DocumentExtractionAgent",
                )

            def validate_input(self, document: Document) -> bool:
                return (
                    document is not None
                    and hasattr(document, 'content')
                    and len(document.content) > 0
                )
        ```

    Notes:
        - Implementations MUST be async-compatible
        - Implementations SHOULD return AgentResult for consistency
        - Implementations MAY add additional methods beyond this protocol
    """

    async def process(self, input_data: InputT) -> AgentResult[OutputT]:
        """Process the input and return a result.

        This is the main entry point for agent execution. Implementations
        should:
        1. Validate the input (optionally using validate_input())
        2. Perform the agent's core logic (LLM calls, data processing, etc.)
        3. Return results wrapped in AgentResult

        Args:
            input_data: The input to process, typed according to InputT

        Returns:
            AgentResult containing the output data or error information

        Raises:
            This method should NOT raise exceptions. All errors should be
            captured and returned as AgentResult with ERROR status.
        """
        ...

    def validate_input(self, input_data: InputT) -> bool:
        """Validate the input before processing.

        Implementations should check that the input meets all requirements
        for successful processing. This method is synchronous to allow for
        fast validation before async processing begins.

        Args:
            input_data: The input to validate

        Returns:
            True if the input is valid and can be processed, False otherwise

        Example:
            ```python
            def validate_input(self, data: dict) -> bool:
                required_keys = ['document_type', 'content']
                return all(key in data for key in required_keys)
            ```
        """
        ...


# =============================================================================
# PIPELINE PROTOCOL
# =============================================================================

@runtime_checkable
class PipelineProtocol(Protocol):
    """Protocol defining the contract for agent pipeline implementations.

    A pipeline orchestrates multiple agents to perform complex workflows.
    It manages the flow of data between agents, handles errors, and
    aggregates results.

    Example Implementation:
        ```python
        class DocumentProcessingPipeline:
            '''Pipeline for processing financial documents.'''

            def __init__(self):
                self._agents: list[AgentProtocol] = []

            def add_agent(self, agent: AgentProtocol) -> None:
                self._agents.append(agent)

            async def execute(
                self,
                input_data: Any,
            ) -> AgentResult[Any]:
                current_data = input_data

                for agent in self._agents:
                    if not agent.validate_input(current_data):
                        return AgentResult.error(
                            f"Validation failed at {agent}"
                        )

                    result = await agent.process(current_data)

                    if result.is_error:
                        return result

                    current_data = result.data

                return AgentResult.success(current_data)
        ```

    Notes:
        - Pipelines coordinate agent execution order
        - Pipelines handle error propagation between agents
        - Pipelines may implement parallel execution strategies
    """

    def add_agent(self, agent: AgentProtocol[Any, Any]) -> None:
        """Add an agent to the pipeline.

        Agents are typically executed in the order they are added,
        though implementations may support more complex ordering.

        Args:
            agent: The agent to add to the pipeline
        """
        ...

    async def execute(self, input_data: Any) -> AgentResult[Any]:
        """Execute the pipeline with the given input.

        Runs all agents in the pipeline, passing data between them
        as configured. Handles error propagation and result aggregation.

        Args:
            input_data: Initial input to the pipeline

        Returns:
            AgentResult containing the final pipeline output or error

        Raises:
            This method should NOT raise exceptions. All errors should be
            captured and returned as AgentResult with ERROR status.
        """
        ...

    def validate_pipeline(self) -> bool:
        """Validate that the pipeline is properly configured.

        Checks that all agents are compatible and the pipeline
        can be executed successfully.

        Returns:
            True if the pipeline is valid, False otherwise
        """
        ...


# =============================================================================
# EXPORTS
# =============================================================================

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
