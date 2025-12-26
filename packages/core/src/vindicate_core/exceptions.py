"""Custom exceptions for the Vindicate application.

This module provides a hierarchy of exception classes for consistent error
handling across the Vindicate pipeline. All exceptions inherit from
VindicateError, making it easy to catch all application-specific errors.

Example:
    try:
        result = extractor.extract(document)
    except ExtractionError as e:
        if e.recoverable:
            # Try alternative extraction method
            result = fallback_extractor.extract(document)
        else:
            raise
    except VindicateError as e:
        # Handle any Vindicate-related error
        logger.error(f"Operation failed: {e}")
"""

from typing import Any, Optional


class VindicateError(Exception):
    """Base exception for all Vindicate application errors.

    This is the root of the exception hierarchy. Catching this exception
    will catch all Vindicate-specific errors.

    Attributes:
        message: Human-readable error description.
        details: Optional dictionary with additional context.
        recoverable: Whether the error is potentially recoverable.

    Example:
        >>> raise VindicateError("Something went wrong", details={"code": 500})
        VindicateError: Something went wrong
    """

    def __init__(
        self,
        message: str,
        *,
        details: Optional[dict[str, Any]] = None,
        recoverable: bool = False,
    ) -> None:
        """Initialize VindicateError.

        Args:
            message: Human-readable error description.
            details: Optional dictionary with additional context about the error.
            recoverable: Whether the error is potentially recoverable through
                retry or alternative approaches. Defaults to False.
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.recoverable = recoverable

    def __str__(self) -> str:
        """Return string representation of the error."""
        return self.message

    def __repr__(self) -> str:
        """Return detailed representation of the error."""
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"details={self.details!r}, "
            f"recoverable={self.recoverable!r})"
        )


class ExtractionError(VindicateError):
    """Error raised when document data extraction fails.

    This exception is raised when the system cannot extract required data
    from a document, such as a PDF, image, or other source.

    Attributes:
        source: The document or source that failed extraction.
        field: The specific field that failed to extract (if applicable).
        document_type: Type of document being processed (if known).

    Example:
        >>> raise ExtractionError(
        ...     "Failed to extract SSN from W-2",
        ...     source="w2_2023.pdf",
        ...     field="social_security_number",
        ...     document_type="W2",
        ...     recoverable=True,
        ... )
        ExtractionError: Failed to extract SSN from W-2
    """

    def __init__(
        self,
        message: str,
        *,
        source: Optional[str] = None,
        field: Optional[str] = None,
        document_type: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        recoverable: bool = True,
    ) -> None:
        """Initialize ExtractionError.

        Args:
            message: Human-readable error description.
            source: The document path or identifier being processed.
            field: The specific field that failed extraction.
            document_type: Type of document (e.g., "W2", "BANK_STATEMENT").
            details: Optional dictionary with additional context.
            recoverable: Whether extraction can be retried. Defaults to True
                since alternative extraction methods may succeed.
        """
        super().__init__(message, details=details, recoverable=recoverable)
        self.source = source
        self.field = field
        self.document_type = document_type

        # Add extraction-specific context to details
        if source:
            self.details["source"] = source
        if field:
            self.details["field"] = field
        if document_type:
            self.details["document_type"] = document_type


class ValidationError(VindicateError):
    """Error raised when data validation fails.

    This exception is raised when extracted or user-provided data fails
    validation rules, such as format checks, range validation, or
    business logic constraints.

    Attributes:
        field: The field that failed validation.
        value: The invalid value (if safe to include).
        constraint: The validation constraint that was violated.

    Example:
        >>> raise ValidationError(
        ...     "Invalid filing status",
        ...     field="filing_status",
        ...     value="unknown",
        ...     constraint="Must be one of: single, married_filing_jointly, ...",
        ... )
        ValidationError: Invalid filing status
    """

    def __init__(
        self,
        message: str,
        *,
        field: Optional[str] = None,
        value: Optional[Any] = None,
        constraint: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        recoverable: bool = True,
    ) -> None:
        """Initialize ValidationError.

        Args:
            message: Human-readable error description.
            field: The name of the field that failed validation.
            value: The invalid value (avoid including sensitive data).
            constraint: Description of the validation rule violated.
            details: Optional dictionary with additional context.
            recoverable: Whether the error can be fixed by user correction.
                Defaults to True since validation errors typically require
                user input correction.
        """
        super().__init__(message, details=details, recoverable=recoverable)
        self.field = field
        self.value = value
        self.constraint = constraint

        # Add validation-specific context to details
        if field:
            self.details["field"] = field
        if value is not None:
            self.details["value"] = value
        if constraint:
            self.details["constraint"] = constraint


class AgentError(VindicateError):
    """Error raised when an AI agent operation fails.

    This exception is raised when an AI/LLM agent encounters an error
    during processing, such as API failures, context limits exceeded,
    or unexpected responses.

    Attributes:
        agent_name: Name or identifier of the agent that failed.
        operation: The operation the agent was attempting.
        api_error: The underlying API error message (if applicable).

    Example:
        >>> raise AgentError(
        ...     "LLM extraction failed due to rate limiting",
        ...     agent_name="llm_extractor",
        ...     operation="document_extraction",
        ...     api_error="Rate limit exceeded",
        ...     recoverable=True,
        ... )
        AgentError: LLM extraction failed due to rate limiting
    """

    def __init__(
        self,
        message: str,
        *,
        agent_name: Optional[str] = None,
        operation: Optional[str] = None,
        api_error: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        recoverable: bool = True,
    ) -> None:
        """Initialize AgentError.

        Args:
            message: Human-readable error description.
            agent_name: Identifier for the agent that encountered the error.
            operation: The specific operation being attempted.
            api_error: The underlying API error message if from an external service.
            details: Optional dictionary with additional context.
            recoverable: Whether the operation can be retried. Defaults to True
                since many agent errors (rate limits, timeouts) are transient.
        """
        super().__init__(message, details=details, recoverable=recoverable)
        self.agent_name = agent_name
        self.operation = operation
        self.api_error = api_error

        # Add agent-specific context to details
        if agent_name:
            self.details["agent_name"] = agent_name
        if operation:
            self.details["operation"] = operation
        if api_error:
            self.details["api_error"] = api_error


class ConfigurationError(VindicateError):
    """Error raised when configuration is invalid or missing.

    This exception is raised when required configuration is missing,
    malformed, or contains invalid values. Configuration errors are
    typically fatal and require administrator intervention.

    Attributes:
        config_key: The configuration key that is problematic.
        expected: Description of the expected value or format.
        actual: The actual value found (if any).

    Example:
        >>> raise ConfigurationError(
        ...     "Missing required API key",
        ...     config_key="ANTHROPIC_API_KEY",
        ...     expected="Valid Anthropic API key",
        ... )
        ConfigurationError: Missing required API key
    """

    def __init__(
        self,
        message: str,
        *,
        config_key: Optional[str] = None,
        expected: Optional[str] = None,
        actual: Optional[Any] = None,
        details: Optional[dict[str, Any]] = None,
        recoverable: bool = False,
    ) -> None:
        """Initialize ConfigurationError.

        Args:
            message: Human-readable error description.
            config_key: The name of the configuration key that is problematic.
            expected: Description of what value was expected.
            actual: The actual value found (avoid including secrets).
            details: Optional dictionary with additional context.
            recoverable: Whether the error can be fixed at runtime.
                Defaults to False since configuration errors typically
                require application restart or manual intervention.
        """
        super().__init__(message, details=details, recoverable=recoverable)
        self.config_key = config_key
        self.expected = expected
        self.actual = actual

        # Add configuration-specific context to details
        if config_key:
            self.details["config_key"] = config_key
        if expected:
            self.details["expected"] = expected
        if actual is not None:
            self.details["actual"] = actual


__all__ = [
    "VindicateError",
    "ExtractionError",
    "ValidationError",
    "AgentError",
    "ConfigurationError",
]
