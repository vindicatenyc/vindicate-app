"""Audit trail models for tracking extraction provenance.

This module provides models for tracking where data came from and how
it was processed during document extraction and analysis.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(timezone.utc)


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class BoundingBox(BaseModel):
    """Bounding box coordinates for extracted text.

    Coordinates are typically in points (1/72 inch) from the page origin
    (usually bottom-left for PDF).
    """
    x0: float = Field(ge=0, description="Left edge x-coordinate")
    y0: float = Field(ge=0, description="Bottom edge y-coordinate")
    x1: float = Field(ge=0, description="Right edge x-coordinate")
    y1: float = Field(ge=0, description="Top edge y-coordinate")

    @property
    def width(self) -> float:
        """Width of the bounding box."""
        return self.x1 - self.x0

    @property
    def height(self) -> float:
        """Height of the bounding box."""
        return self.y1 - self.y0


class AuditSource(BaseModel):
    """Document/page/line reference for extracted data.

    Captures the provenance of extracted data - where exactly in the
    source documents the data came from.

    Attributes:
        document_name: Original filename or identifier
        document_type: Type of document (e.g., "bank_statement", "pay_stub")
        page_number: 1-based page number within the document
        line_number: Line number on the page (if applicable)
        bounding_box: Coordinates of the extracted region (if available)
        raw_text: The original text as extracted before processing
        extraction_method: How the data was extracted (e.g., "ocr", "pdf_text", "llm")
        confidence: Extraction confidence score (0.0 to 1.0)
    """
    document_name: str
    document_type: Optional[str] = None
    page_number: Optional[int] = Field(default=None, ge=1)
    line_number: Optional[int] = Field(default=None, ge=1)
    bounding_box: Optional[BoundingBox] = None
    raw_text: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    def to_reference_string(self) -> str:
        """Generate a human-readable source reference string.

        Example: "bank_statement.pdf:p3:l12"
        """
        parts = [self.document_name]
        if self.page_number is not None:
            parts.append(f"p{self.page_number}")
        if self.line_number is not None:
            parts.append(f"l{self.line_number}")
        return ":".join(parts)


class AuditEntry(BaseModel):
    """Single audit event recording a processing step.

    Records what happened during data extraction or processing,
    including the before/after values and source reference.

    Attributes:
        timestamp: When this entry was created (UTC)
        step: Name of the processing step (e.g., "extract_amount", "validate_date")
        action: Human-readable description of what was done
        input_value: Value before processing
        output_value: Value after processing
        source: Source reference for the data
        field_name: Name of the field being processed
        notes: Additional context or explanation
    """
    timestamp: datetime = Field(default_factory=_utc_now)
    step: str
    action: str
    input_value: Optional[str] = None
    output_value: Optional[str] = None
    source: Optional[AuditSource] = None
    field_name: Optional[str] = None
    notes: Optional[str] = None

    def model_post_init(self, __context) -> None:
        """Ensure timestamp is timezone-aware."""
        if self.timestamp.tzinfo is None:
            object.__setattr__(
                self,
                'timestamp',
                self.timestamp.replace(tzinfo=timezone.utc)
            )


class AuditWarning(BaseModel):
    """Warning flagged for human review.

    Represents a potential issue that was detected but didn't
    prevent processing from continuing. Requires human review.

    Attributes:
        timestamp: When this warning was created (UTC)
        code: Machine-readable warning code (e.g., "LOW_CONFIDENCE")
        message: Human-readable warning message
        source: Source reference for the data that triggered the warning
        field_name: Name of the field with the issue
        expected_value: What was expected (if applicable)
        actual_value: What was found
        severity: Warning severity level
        requires_review: Whether this must be reviewed before proceeding
        suggested_action: Recommended action to resolve the warning
    """
    timestamp: datetime = Field(default_factory=_utc_now)
    code: str
    message: str
    source: Optional[AuditSource] = None
    field_name: Optional[str] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None
    severity: AuditSeverity = AuditSeverity.WARNING
    requires_review: bool = True
    suggested_action: Optional[str] = None

    def model_post_init(self, __context) -> None:
        """Ensure timestamp is timezone-aware."""
        if self.timestamp.tzinfo is None:
            object.__setattr__(
                self,
                'timestamp',
                self.timestamp.replace(tzinfo=timezone.utc)
            )


class AuditError(BaseModel):
    """Processing error that prevented successful extraction.

    Records errors that occurred during processing, including
    context for debugging and potential recovery.

    Attributes:
        timestamp: When this error occurred (UTC)
        code: Machine-readable error code (e.g., "PARSE_FAILED")
        message: Human-readable error message
        source: Source reference for the data that caused the error
        field_name: Name of the field being processed when error occurred
        exception_type: Python exception type name (if from an exception)
        exception_message: Exception message (if from an exception)
        stack_trace: Stack trace for debugging (if available)
        is_recoverable: Whether processing can continue despite this error
        recovery_action: What action was taken to recover (if any)
    """
    timestamp: datetime = Field(default_factory=_utc_now)
    code: str
    message: str
    source: Optional[AuditSource] = None
    field_name: Optional[str] = None
    exception_type: Optional[str] = None
    exception_message: Optional[str] = None
    stack_trace: Optional[str] = None
    is_recoverable: bool = False
    recovery_action: Optional[str] = None

    def model_post_init(self, __context) -> None:
        """Ensure timestamp is timezone-aware."""
        if self.timestamp.tzinfo is None:
            object.__setattr__(
                self,
                'timestamp',
                self.timestamp.replace(tzinfo=timezone.utc)
            )

    @classmethod
    def from_exception(
        cls,
        exc: Exception,
        code: str,
        source: Optional[AuditSource] = None,
        field_name: Optional[str] = None,
        is_recoverable: bool = False,
    ) -> "AuditError":
        """Create an AuditError from a Python exception.

        Args:
            exc: The exception that occurred
            code: Machine-readable error code
            source: Source reference for the data
            field_name: Field being processed when error occurred
            is_recoverable: Whether processing can continue

        Returns:
            AuditError with exception details populated
        """
        import traceback

        return cls(
            code=code,
            message=str(exc),
            source=source,
            field_name=field_name,
            exception_type=type(exc).__name__,
            exception_message=str(exc),
            stack_trace=traceback.format_exc(),
            is_recoverable=is_recoverable,
        )


class AuditTrail(BaseModel):
    """Complete audit trail for a processing run.

    Collects all audit entries, warnings, and errors from a single
    processing run (e.g., extracting data from a set of documents).

    Attributes:
        run_id: Unique identifier for this processing run
        started_at: When processing started (UTC)
        completed_at: When processing completed (UTC), None if still running
        status: Current status ("running", "completed", "failed")
        entries: List of all audit entries
        warnings: List of all warnings
        errors: List of all errors
        source_documents: List of documents processed in this run
        metadata: Additional metadata about the run
    """
    run_id: str
    started_at: datetime = Field(default_factory=_utc_now)
    completed_at: Optional[datetime] = None
    status: str = "running"
    entries: list[AuditEntry] = Field(default_factory=list)
    warnings: list[AuditWarning] = Field(default_factory=list)
    errors: list[AuditError] = Field(default_factory=list)
    source_documents: list[str] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)

    def model_post_init(self, __context) -> None:
        """Ensure timestamps are timezone-aware."""
        if self.started_at.tzinfo is None:
            object.__setattr__(
                self,
                'started_at',
                self.started_at.replace(tzinfo=timezone.utc)
            )
        if self.completed_at is not None and self.completed_at.tzinfo is None:
            object.__setattr__(
                self,
                'completed_at',
                self.completed_at.replace(tzinfo=timezone.utc)
            )

    def add_entry(
        self,
        step: str,
        action: str,
        input_value: Optional[str] = None,
        output_value: Optional[str] = None,
        source: Optional[AuditSource] = None,
        field_name: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> AuditEntry:
        """Add an audit entry to the trail.

        Args:
            step: Name of the processing step
            action: Human-readable description of what was done
            input_value: Value before processing
            output_value: Value after processing
            source: Source reference for the data
            field_name: Name of the field being processed
            notes: Additional context or explanation

        Returns:
            The created AuditEntry
        """
        entry = AuditEntry(
            step=step,
            action=action,
            input_value=input_value,
            output_value=output_value,
            source=source,
            field_name=field_name,
            notes=notes,
        )
        self.entries.append(entry)
        return entry

    def add_warning(
        self,
        code: str,
        message: str,
        source: Optional[AuditSource] = None,
        field_name: Optional[str] = None,
        expected_value: Optional[str] = None,
        actual_value: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.WARNING,
        requires_review: bool = True,
        suggested_action: Optional[str] = None,
    ) -> AuditWarning:
        """Add a warning to the trail.

        Args:
            code: Machine-readable warning code
            message: Human-readable warning message
            source: Source reference for the data
            field_name: Name of the field with the issue
            expected_value: What was expected
            actual_value: What was found
            severity: Warning severity level
            requires_review: Whether human review is required
            suggested_action: Recommended action

        Returns:
            The created AuditWarning
        """
        warning = AuditWarning(
            code=code,
            message=message,
            source=source,
            field_name=field_name,
            expected_value=expected_value,
            actual_value=actual_value,
            severity=severity,
            requires_review=requires_review,
            suggested_action=suggested_action,
        )
        self.warnings.append(warning)
        return warning

    def add_error(
        self,
        code: str,
        message: str,
        source: Optional[AuditSource] = None,
        field_name: Optional[str] = None,
        exception: Optional[Exception] = None,
        is_recoverable: bool = False,
        recovery_action: Optional[str] = None,
    ) -> AuditError:
        """Add an error to the trail.

        Args:
            code: Machine-readable error code
            message: Human-readable error message
            source: Source reference for the data
            field_name: Name of the field being processed
            exception: Python exception (if from an exception)
            is_recoverable: Whether processing can continue
            recovery_action: What action was taken to recover

        Returns:
            The created AuditError
        """
        if exception is not None:
            error = AuditError.from_exception(
                exc=exception,
                code=code,
                source=source,
                field_name=field_name,
                is_recoverable=is_recoverable,
            )
            error = error.model_copy(update={"recovery_action": recovery_action})
        else:
            error = AuditError(
                code=code,
                message=message,
                source=source,
                field_name=field_name,
                is_recoverable=is_recoverable,
                recovery_action=recovery_action,
            )
        self.errors.append(error)
        return error

    def complete(self, status: str = "completed") -> None:
        """Mark the audit trail as complete.

        Args:
            status: Final status ("completed" or "failed")
        """
        self.completed_at = _utc_now()
        self.status = status

    def fail(self) -> None:
        """Mark the audit trail as failed."""
        self.complete(status="failed")

    @property
    def has_errors(self) -> bool:
        """Check if there are any errors in the trail."""
        return len(self.errors) > 0

    @property
    def has_warnings(self) -> bool:
        """Check if there are any warnings in the trail."""
        return len(self.warnings) > 0

    @property
    def requires_review(self) -> bool:
        """Check if any warnings require human review."""
        return any(w.requires_review for w in self.warnings)

    @property
    def duration_seconds(self) -> Optional[float]:
        """Calculate the duration of the processing run in seconds."""
        if self.completed_at is None:
            return None
        delta = self.completed_at - self.started_at
        return delta.total_seconds()

    def get_entries_for_field(self, field_name: str) -> list[AuditEntry]:
        """Get all entries related to a specific field.

        Args:
            field_name: Name of the field to filter by

        Returns:
            List of AuditEntry for the specified field
        """
        return [e for e in self.entries if e.field_name == field_name]

    def get_warnings_for_field(self, field_name: str) -> list[AuditWarning]:
        """Get all warnings related to a specific field.

        Args:
            field_name: Name of the field to filter by

        Returns:
            List of AuditWarning for the specified field
        """
        return [w for w in self.warnings if w.field_name == field_name]

    def get_errors_for_field(self, field_name: str) -> list[AuditError]:
        """Get all errors related to a specific field.

        Args:
            field_name: Name of the field to filter by

        Returns:
            List of AuditError for the specified field
        """
        return [e for e in self.errors if e.field_name == field_name]

    def summary(self) -> dict[str, object]:
        """Generate a summary of the audit trail.

        Returns:
            Dictionary with summary statistics
        """
        return {
            "run_id": self.run_id,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": self.duration_seconds,
            "entry_count": len(self.entries),
            "warning_count": len(self.warnings),
            "error_count": len(self.errors),
            "document_count": len(self.source_documents),
            "requires_review": self.requires_review,
        }
