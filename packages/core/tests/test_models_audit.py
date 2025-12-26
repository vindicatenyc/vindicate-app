"""Tests for audit trail models."""

from datetime import datetime, timezone
import json

import pytest

from vindicate_core.models.audit import (
    AuditSource,
    AuditEntry,
    AuditWarning,
    AuditError,
    AuditTrail,
    AuditSeverity,
    BoundingBox,
)


class TestBoundingBox:
    """Tests for BoundingBox model."""

    def test_create_bounding_box(self):
        """Should create a bounding box with coordinates."""
        bbox = BoundingBox(x0=10.0, y0=20.0, x1=100.0, y1=80.0)
        assert bbox.x0 == 10.0
        assert bbox.y0 == 20.0
        assert bbox.x1 == 100.0
        assert bbox.y1 == 80.0

    def test_width_property(self):
        """Should calculate width correctly."""
        bbox = BoundingBox(x0=10.0, y0=20.0, x1=100.0, y1=80.0)
        assert bbox.width == 90.0

    def test_height_property(self):
        """Should calculate height correctly."""
        bbox = BoundingBox(x0=10.0, y0=20.0, x1=100.0, y1=80.0)
        assert bbox.height == 60.0

    def test_serializes_to_json(self):
        """Should serialize to JSON cleanly."""
        bbox = BoundingBox(x0=10.0, y0=20.0, x1=100.0, y1=80.0)
        json_str = bbox.model_dump_json()
        data = json.loads(json_str)
        assert data["x0"] == 10.0
        assert data["x1"] == 100.0


class TestAuditSource:
    """Tests for AuditSource model."""

    def test_create_with_required_fields_only(self):
        """Should create source with only document_name."""
        source = AuditSource(document_name="bank_statement.pdf")
        assert source.document_name == "bank_statement.pdf"
        assert source.page_number is None
        assert source.line_number is None

    def test_create_with_all_fields(self):
        """Should create source with all fields."""
        bbox = BoundingBox(x0=0, y0=0, x1=100, y1=50)
        source = AuditSource(
            document_name="pay_stub.pdf",
            document_type="pay_stub",
            page_number=1,
            line_number=15,
            bounding_box=bbox,
            raw_text="$5,000.00",
            extraction_method="ocr",
            confidence=0.95,
        )
        assert source.document_name == "pay_stub.pdf"
        assert source.document_type == "pay_stub"
        assert source.page_number == 1
        assert source.line_number == 15
        assert source.bounding_box == bbox
        assert source.raw_text == "$5,000.00"
        assert source.extraction_method == "ocr"
        assert source.confidence == 0.95

    def test_to_reference_string_document_only(self):
        """Should generate reference string with just document."""
        source = AuditSource(document_name="statement.pdf")
        assert source.to_reference_string() == "statement.pdf"

    def test_to_reference_string_with_page(self):
        """Should generate reference string with page."""
        source = AuditSource(document_name="statement.pdf", page_number=3)
        assert source.to_reference_string() == "statement.pdf:p3"

    def test_to_reference_string_with_page_and_line(self):
        """Should generate reference string with page and line."""
        source = AuditSource(
            document_name="statement.pdf",
            page_number=3,
            line_number=12,
        )
        assert source.to_reference_string() == "statement.pdf:p3:l12"

    def test_serializes_to_json(self):
        """Should serialize to JSON cleanly."""
        source = AuditSource(
            document_name="test.pdf",
            document_type="bank_statement",
            page_number=2,
            confidence=0.85,
        )
        json_str = source.model_dump_json()
        data = json.loads(json_str)
        assert data["document_name"] == "test.pdf"
        assert data["document_type"] == "bank_statement"
        assert data["page_number"] == 2
        assert data["confidence"] == 0.85

    def test_confidence_validation(self):
        """Should validate confidence is between 0 and 1."""
        with pytest.raises(ValueError):
            AuditSource(document_name="test.pdf", confidence=1.5)
        with pytest.raises(ValueError):
            AuditSource(document_name="test.pdf", confidence=-0.1)


class TestAuditEntry:
    """Tests for AuditEntry model."""

    def test_create_basic_entry(self):
        """Should create entry with required fields."""
        entry = AuditEntry(step="extract_amount", action="Extracted dollar amount")
        assert entry.step == "extract_amount"
        assert entry.action == "Extracted dollar amount"
        assert entry.timestamp is not None

    def test_create_with_values(self):
        """Should create entry with input/output values."""
        entry = AuditEntry(
            step="parse_amount",
            action="Parsed currency value",
            input_value="$5,000.00",
            output_value="5000.00",
            field_name="monthly_income",
            notes="Removed currency symbols and commas",
        )
        assert entry.input_value == "$5,000.00"
        assert entry.output_value == "5000.00"
        assert entry.field_name == "monthly_income"

    def test_create_with_source(self):
        """Should create entry with source reference."""
        source = AuditSource(document_name="pay_stub.pdf", page_number=1)
        entry = AuditEntry(
            step="extract_date",
            action="Extracted pay date",
            source=source,
        )
        assert entry.source == source
        assert entry.source.document_name == "pay_stub.pdf"

    def test_timestamp_is_utc(self):
        """Timestamp should be UTC timezone-aware."""
        entry = AuditEntry(step="test", action="test action")
        assert entry.timestamp.tzinfo is not None
        assert entry.timestamp.tzinfo == timezone.utc

    def test_naive_timestamp_converted_to_utc(self):
        """Naive datetime should be converted to UTC."""
        naive_dt = datetime(2025, 1, 15, 12, 0, 0)
        entry = AuditEntry(step="test", action="test", timestamp=naive_dt)
        assert entry.timestamp.tzinfo == timezone.utc

    def test_serializes_to_json(self):
        """Should serialize to JSON cleanly."""
        entry = AuditEntry(
            step="validate",
            action="Validated amount",
            input_value="5000",
            output_value="5000",
        )
        json_str = entry.model_dump_json()
        data = json.loads(json_str)
        assert data["step"] == "validate"
        assert data["action"] == "Validated amount"
        assert "timestamp" in data


class TestAuditWarning:
    """Tests for AuditWarning model."""

    def test_create_basic_warning(self):
        """Should create warning with required fields."""
        warning = AuditWarning(
            code="LOW_CONFIDENCE",
            message="Extraction confidence below threshold",
        )
        assert warning.code == "LOW_CONFIDENCE"
        assert warning.message == "Extraction confidence below threshold"
        assert warning.severity == AuditSeverity.WARNING
        assert warning.requires_review is True

    def test_create_with_values(self):
        """Should create warning with expected/actual values."""
        warning = AuditWarning(
            code="AMOUNT_MISMATCH",
            message="Extracted amount differs from expected",
            expected_value="5000.00",
            actual_value="4500.00",
            field_name="monthly_income",
        )
        assert warning.expected_value == "5000.00"
        assert warning.actual_value == "4500.00"
        assert warning.field_name == "monthly_income"

    def test_create_with_suggested_action(self):
        """Should store suggested action."""
        warning = AuditWarning(
            code="MISSING_DATA",
            message="Page 2 could not be read",
            suggested_action="Re-scan page 2 with higher DPI",
        )
        assert warning.suggested_action == "Re-scan page 2 with higher DPI"

    def test_timestamp_is_utc(self):
        """Timestamp should be UTC timezone-aware."""
        warning = AuditWarning(code="TEST", message="test")
        assert warning.timestamp.tzinfo == timezone.utc

    def test_serializes_to_json(self):
        """Should serialize to JSON cleanly."""
        warning = AuditWarning(
            code="LOW_CONFIDENCE",
            message="Low extraction confidence",
            severity=AuditSeverity.WARNING,
        )
        json_str = warning.model_dump_json()
        data = json.loads(json_str)
        assert data["code"] == "LOW_CONFIDENCE"
        assert data["severity"] == "warning"


class TestAuditError:
    """Tests for AuditError model."""

    def test_create_basic_error(self):
        """Should create error with required fields."""
        error = AuditError(
            code="PARSE_FAILED",
            message="Could not parse amount from text",
        )
        assert error.code == "PARSE_FAILED"
        assert error.message == "Could not parse amount from text"
        assert error.is_recoverable is False

    def test_create_recoverable_error(self):
        """Should mark error as recoverable."""
        error = AuditError(
            code="SKIP_PAGE",
            message="Page 3 was blank, skipped",
            is_recoverable=True,
            recovery_action="Skipped blank page",
        )
        assert error.is_recoverable is True
        assert error.recovery_action == "Skipped blank page"

    def test_from_exception(self):
        """Should create error from Python exception."""
        try:
            raise ValueError("Invalid amount format")
        except Exception as e:
            error = AuditError.from_exception(
                exc=e,
                code="PARSE_ERROR",
                field_name="amount",
            )

        assert error.code == "PARSE_ERROR"
        assert error.exception_type == "ValueError"
        assert error.exception_message == "Invalid amount format"
        assert error.stack_trace is not None
        assert "ValueError" in error.stack_trace

    def test_from_exception_with_source(self):
        """Should include source in exception-based error."""
        source = AuditSource(document_name="test.pdf", page_number=5)
        try:
            raise KeyError("missing_field")
        except Exception as e:
            error = AuditError.from_exception(
                exc=e,
                code="KEY_ERROR",
                source=source,
                is_recoverable=True,
            )

        assert error.source == source
        assert error.is_recoverable is True

    def test_timestamp_is_utc(self):
        """Timestamp should be UTC timezone-aware."""
        error = AuditError(code="TEST", message="test")
        assert error.timestamp.tzinfo == timezone.utc

    def test_serializes_to_json(self):
        """Should serialize to JSON cleanly."""
        error = AuditError(
            code="PARSE_FAILED",
            message="Parse error",
            is_recoverable=True,
        )
        json_str = error.model_dump_json()
        data = json.loads(json_str)
        assert data["code"] == "PARSE_FAILED"
        assert data["is_recoverable"] is True


class TestAuditTrail:
    """Tests for AuditTrail model."""

    @pytest.fixture
    def empty_trail(self) -> AuditTrail:
        """Create an empty audit trail."""
        return AuditTrail(run_id="test-run-001")

    def test_create_trail(self, empty_trail: AuditTrail):
        """Should create trail with run_id."""
        assert empty_trail.run_id == "test-run-001"
        assert empty_trail.status == "running"
        assert empty_trail.started_at is not None
        assert empty_trail.completed_at is None
        assert len(empty_trail.entries) == 0
        assert len(empty_trail.warnings) == 0
        assert len(empty_trail.errors) == 0

    def test_started_at_is_utc(self, empty_trail: AuditTrail):
        """started_at should be UTC timezone-aware."""
        assert empty_trail.started_at.tzinfo == timezone.utc

    def test_add_entry(self, empty_trail: AuditTrail):
        """Should add entry to trail."""
        entry = empty_trail.add_entry(
            step="extract_amount",
            action="Extracted monthly income",
            input_value="$5,000.00",
            output_value="5000.00",
        )
        assert len(empty_trail.entries) == 1
        assert empty_trail.entries[0] == entry
        assert entry.step == "extract_amount"

    def test_add_entry_with_source(self, empty_trail: AuditTrail):
        """Should add entry with source reference."""
        source = AuditSource(document_name="pay_stub.pdf", page_number=1)
        entry = empty_trail.add_entry(
            step="extract",
            action="Extracted field",
            source=source,
            field_name="gross_pay",
        )
        assert entry.source == source
        assert entry.field_name == "gross_pay"

    def test_add_multiple_entries(self, empty_trail: AuditTrail):
        """Should add multiple entries maintaining order."""
        empty_trail.add_entry(step="step1", action="Action 1")
        empty_trail.add_entry(step="step2", action="Action 2")
        empty_trail.add_entry(step="step3", action="Action 3")

        assert len(empty_trail.entries) == 3
        assert empty_trail.entries[0].step == "step1"
        assert empty_trail.entries[2].step == "step3"

    def test_add_warning(self, empty_trail: AuditTrail):
        """Should add warning to trail."""
        warning = empty_trail.add_warning(
            code="LOW_CONFIDENCE",
            message="Extraction confidence is low",
            field_name="amount",
        )
        assert len(empty_trail.warnings) == 1
        assert empty_trail.warnings[0] == warning
        assert empty_trail.has_warnings is True

    def test_add_warning_with_severity(self, empty_trail: AuditTrail):
        """Should add warning with custom severity."""
        warning = empty_trail.add_warning(
            code="CRITICAL_ISSUE",
            message="Critical data issue",
            severity=AuditSeverity.CRITICAL,
            requires_review=True,
        )
        assert warning.severity == AuditSeverity.CRITICAL
        assert warning.requires_review is True

    def test_add_error(self, empty_trail: AuditTrail):
        """Should add error to trail."""
        error = empty_trail.add_error(
            code="PARSE_FAILED",
            message="Could not parse document",
        )
        assert len(empty_trail.errors) == 1
        assert empty_trail.errors[0] == error
        assert empty_trail.has_errors is True

    def test_add_error_from_exception(self, empty_trail: AuditTrail):
        """Should add error from exception."""
        try:
            raise ValueError("Test error")
        except Exception as e:
            error = empty_trail.add_error(
                code="EXCEPTION",
                message="Exception occurred",
                exception=e,
                is_recoverable=True,
            )

        assert len(empty_trail.errors) == 1
        assert error.exception_type == "ValueError"
        assert error.is_recoverable is True

    def test_complete_trail(self, empty_trail: AuditTrail):
        """Should mark trail as complete."""
        empty_trail.complete()
        assert empty_trail.status == "completed"
        assert empty_trail.completed_at is not None
        assert empty_trail.completed_at.tzinfo == timezone.utc

    def test_fail_trail(self, empty_trail: AuditTrail):
        """Should mark trail as failed."""
        empty_trail.fail()
        assert empty_trail.status == "failed"
        assert empty_trail.completed_at is not None

    def test_has_errors_property(self, empty_trail: AuditTrail):
        """Should correctly report has_errors."""
        assert empty_trail.has_errors is False
        empty_trail.add_error(code="E1", message="Error 1")
        assert empty_trail.has_errors is True

    def test_has_warnings_property(self, empty_trail: AuditTrail):
        """Should correctly report has_warnings."""
        assert empty_trail.has_warnings is False
        empty_trail.add_warning(code="W1", message="Warning 1")
        assert empty_trail.has_warnings is True

    def test_requires_review_property(self, empty_trail: AuditTrail):
        """Should correctly report requires_review."""
        assert empty_trail.requires_review is False

        empty_trail.add_warning(
            code="W1",
            message="Warning",
            requires_review=False,
        )
        assert empty_trail.requires_review is False

        empty_trail.add_warning(
            code="W2",
            message="Critical warning",
            requires_review=True,
        )
        assert empty_trail.requires_review is True

    def test_duration_seconds_running(self, empty_trail: AuditTrail):
        """Duration should be None when still running."""
        assert empty_trail.duration_seconds is None

    def test_duration_seconds_completed(self, empty_trail: AuditTrail):
        """Duration should be calculated when completed."""
        empty_trail.complete()
        duration = empty_trail.duration_seconds
        assert duration is not None
        assert duration >= 0

    def test_get_entries_for_field(self, empty_trail: AuditTrail):
        """Should filter entries by field name."""
        empty_trail.add_entry(step="s1", action="A1", field_name="amount")
        empty_trail.add_entry(step="s2", action="A2", field_name="date")
        empty_trail.add_entry(step="s3", action="A3", field_name="amount")

        amount_entries = empty_trail.get_entries_for_field("amount")
        assert len(amount_entries) == 2
        assert all(e.field_name == "amount" for e in amount_entries)

    def test_get_warnings_for_field(self, empty_trail: AuditTrail):
        """Should filter warnings by field name."""
        empty_trail.add_warning(code="W1", message="M1", field_name="income")
        empty_trail.add_warning(code="W2", message="M2", field_name="expenses")
        empty_trail.add_warning(code="W3", message="M3", field_name="income")

        income_warnings = empty_trail.get_warnings_for_field("income")
        assert len(income_warnings) == 2

    def test_get_errors_for_field(self, empty_trail: AuditTrail):
        """Should filter errors by field name."""
        empty_trail.add_error(code="E1", message="M1", field_name="ssn")
        empty_trail.add_error(code="E2", message="M2", field_name="address")

        ssn_errors = empty_trail.get_errors_for_field("ssn")
        assert len(ssn_errors) == 1

    def test_summary(self, empty_trail: AuditTrail):
        """Should generate correct summary."""
        empty_trail.add_entry(step="s1", action="a1")
        empty_trail.add_entry(step="s2", action="a2")
        empty_trail.add_warning(code="W1", message="m1", requires_review=True)
        empty_trail.add_error(code="E1", message="m1")
        empty_trail.source_documents.append("doc1.pdf")
        empty_trail.complete()

        summary = empty_trail.summary()
        assert summary["run_id"] == "test-run-001"
        assert summary["status"] == "completed"
        assert summary["entry_count"] == 2
        assert summary["warning_count"] == 1
        assert summary["error_count"] == 1
        assert summary["document_count"] == 1
        assert summary["requires_review"] is True
        assert summary["started_at"] is not None
        assert summary["completed_at"] is not None

    def test_serializes_to_json(self, empty_trail: AuditTrail):
        """Should serialize entire trail to JSON cleanly."""
        source = AuditSource(document_name="test.pdf", page_number=1)
        empty_trail.add_entry(
            step="extract",
            action="Extracted data",
            source=source,
            input_value="raw",
            output_value="processed",
        )
        empty_trail.add_warning(
            code="LOW_CONFIDENCE",
            message="Low confidence",
        )
        empty_trail.add_error(
            code="PARSE_ERROR",
            message="Parse failed",
        )
        empty_trail.complete()

        json_str = empty_trail.model_dump_json()
        data = json.loads(json_str)

        assert data["run_id"] == "test-run-001"
        assert data["status"] == "completed"
        assert len(data["entries"]) == 1
        assert len(data["warnings"]) == 1
        assert len(data["errors"]) == 1
        assert data["entries"][0]["source"]["document_name"] == "test.pdf"

    def test_metadata_storage(self, empty_trail: AuditTrail):
        """Should store and retrieve metadata."""
        empty_trail.metadata["version"] = "1.0.0"
        empty_trail.metadata["processor"] = "llm_extractor"

        assert empty_trail.metadata["version"] == "1.0.0"
        assert empty_trail.metadata["processor"] == "llm_extractor"

    def test_source_documents_list(self, empty_trail: AuditTrail):
        """Should track source documents."""
        empty_trail.source_documents.append("doc1.pdf")
        empty_trail.source_documents.append("doc2.pdf")

        assert len(empty_trail.source_documents) == 2
        assert "doc1.pdf" in empty_trail.source_documents


class TestAuditSeverity:
    """Tests for AuditSeverity enum."""

    def test_severity_values(self):
        """Should have expected severity levels."""
        assert AuditSeverity.INFO.value == "info"
        assert AuditSeverity.WARNING.value == "warning"
        assert AuditSeverity.ERROR.value == "error"
        assert AuditSeverity.CRITICAL.value == "critical"

    def test_severity_is_string_enum(self):
        """Severity should be usable as string."""
        assert str(AuditSeverity.WARNING) == "AuditSeverity.WARNING"
        assert AuditSeverity.WARNING == "warning"
