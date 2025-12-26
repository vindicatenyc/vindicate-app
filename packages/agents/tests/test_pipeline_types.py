"""Tests for pipeline data types.

Verifies that all pipeline stage types:
- Have required audit trail fields
- Have confidence scores
- Have warnings lists
- Properly serialize/deserialize
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from vindicate_agents.interfaces.types import (
    # Enums
    ClassificationCategory,
    DocumentType,
    TransactionType,
    ValidationStatus,
    # Base types
    AuditTrailEntry,
    Confidence,
    PipelineWarning,
    # Pipeline stages
    ClassifiedTransaction,
    ClassifiedTransactions,
    ExtractedTransaction,
    ExtractedTransactions,
    FinancialModel,
    RawDocument,
    ValidatedTransaction,
    ValidatedTransactions,
)


class TestBaseTypes:
    """Tests for base types used across pipeline stages."""

    def test_audit_trail_entry_creation(self):
        """AuditTrailEntry can be created with required fields."""
        entry = AuditTrailEntry(
            agent_name="test_agent",
            action="test_action",
            input_summary="test input",
            output_summary="test output",
        )
        assert entry.agent_name == "test_agent"
        assert entry.action == "test_action"
        assert entry.timestamp is not None
        assert entry.duration_ms is None

    def test_audit_trail_entry_with_optional_fields(self):
        """AuditTrailEntry accepts optional fields."""
        entry = AuditTrailEntry(
            agent_name="test_agent",
            action="test_action",
            input_summary="test input",
            output_summary="test output",
            duration_ms=150,
            model_used="claude-3-5-sonnet",
            tokens_used=1000,
            notes="Test notes",
        )
        assert entry.duration_ms == 150
        assert entry.model_used == "claude-3-5-sonnet"
        assert entry.tokens_used == 1000

    def test_pipeline_warning_creation(self):
        """PipelineWarning can be created with required fields."""
        warning = PipelineWarning(
            code="TEST_001",
            message="Test warning message",
            source_agent="test_agent",
        )
        assert warning.code == "TEST_001"
        assert warning.severity == "warning"
        assert warning.source_field is None

    def test_confidence_creation(self):
        """Confidence can be created with overall score."""
        conf = Confidence(overall=0.95)
        assert conf.overall == 0.95
        assert conf.extraction is None
        assert conf.reasoning is None

    def test_confidence_with_breakdown(self):
        """Confidence accepts breakdown scores."""
        conf = Confidence(
            overall=0.90,
            extraction=0.95,
            classification=0.85,
            validation=0.92,
            reasoning="High confidence due to clear formatting",
        )
        assert conf.extraction == 0.95
        assert conf.classification == 0.85

    def test_confidence_validation(self):
        """Confidence enforces 0-1 range."""
        with pytest.raises(ValueError):
            Confidence(overall=1.5)
        with pytest.raises(ValueError):
            Confidence(overall=-0.1)


class TestRawDocument:
    """Tests for Stage 1: RawDocument (Agent 1 output)."""

    def test_raw_document_creation(self):
        """RawDocument can be created with required fields."""
        doc = RawDocument(
            document_type=DocumentType.BANK_STATEMENT,
            source_filename="statement.pdf",
            raw_text="Test document content",
            confidence=Confidence(overall=0.95),
        )
        assert doc.document_type == DocumentType.BANK_STATEMENT
        assert doc.id is not None
        assert doc.raw_text == "Test document content"
        assert doc.page_count == 1

    def test_raw_document_has_audit_trail(self):
        """RawDocument includes audit trail."""
        doc = RawDocument(
            document_type=DocumentType.PAY_STUB,
            source_filename="paystub.pdf",
            raw_text="Content",
            confidence=Confidence(overall=0.9),
            audit_trail=[
                AuditTrailEntry(
                    agent_name="document_intake",
                    action="extract",
                    input_summary="paystub.pdf",
                    output_summary="Extracted 1 page",
                )
            ],
        )
        assert len(doc.audit_trail) == 1
        assert doc.audit_trail[0].agent_name == "document_intake"

    def test_raw_document_has_warnings(self):
        """RawDocument includes warnings list."""
        doc = RawDocument(
            document_type=DocumentType.UNKNOWN,
            source_filename="unclear.pdf",
            raw_text="Unclear content",
            confidence=Confidence(overall=0.5),
            warnings=[
                PipelineWarning(
                    code="DOC_001",
                    message="Document type could not be determined",
                    source_agent="document_intake",
                )
            ],
        )
        assert len(doc.warnings) == 1
        assert doc.warnings[0].code == "DOC_001"

    def test_raw_document_has_confidence(self):
        """RawDocument includes confidence score."""
        doc = RawDocument(
            document_type=DocumentType.BANK_STATEMENT,
            source_filename="statement.pdf",
            raw_text="Content",
            confidence=Confidence(overall=0.85, extraction=0.90),
        )
        assert doc.confidence.overall == 0.85
        assert doc.confidence.extraction == 0.90


class TestExtractedTransactions:
    """Tests for Stage 2: ExtractedTransactions (Agent 2 output)."""

    def test_extracted_transaction_creation(self):
        """ExtractedTransaction can be created."""
        source_id = uuid4()
        txn = ExtractedTransaction(
            source_document_id=source_id,
            date=date(2025, 1, 15),
            description="DIRECT DEPOSIT ACME INC",
            amount=Decimal("5000.00"),
            transaction_type=TransactionType.CREDIT,
            raw_text="01/15 DIRECT DEPOSIT ACME INC 5,000.00",
            confidence=0.95,
        )
        assert txn.amount == Decimal("5000.00")
        assert txn.transaction_type == TransactionType.CREDIT

    def test_extracted_transactions_collection(self):
        """ExtractedTransactions holds multiple transactions."""
        source_id = uuid4()
        txns = ExtractedTransactions(
            source_document_id=source_id,
            transactions=[
                ExtractedTransaction(
                    source_document_id=source_id,
                    date=date(2025, 1, 15),
                    description="Deposit",
                    amount=Decimal("1000"),
                    transaction_type=TransactionType.CREDIT,
                    raw_text="Deposit 1000",
                    confidence=0.9,
                ),
                ExtractedTransaction(
                    source_document_id=source_id,
                    date=date(2025, 1, 16),
                    description="Rent",
                    amount=Decimal("500"),
                    transaction_type=TransactionType.DEBIT,
                    raw_text="Rent 500",
                    confidence=0.9,
                ),
            ],
            total_credits=Decimal("1000"),
            total_debits=Decimal("500"),
            transaction_count=2,
            confidence=Confidence(overall=0.9),
        )
        assert len(txns.transactions) == 2
        assert txns.net_cashflow == Decimal("500")

    def test_extracted_transactions_has_audit_trail(self):
        """ExtractedTransactions includes audit trail."""
        txns = ExtractedTransactions(
            source_document_id=uuid4(),
            confidence=Confidence(overall=0.9),
            audit_trail=[
                AuditTrailEntry(
                    agent_name="transaction_extractor",
                    action="extract",
                    input_summary="1 page document",
                    output_summary="Found 10 transactions",
                )
            ],
        )
        assert len(txns.audit_trail) == 1


class TestClassifiedTransactions:
    """Tests for Stage 3: ClassifiedTransactions (Agent 3 output)."""

    def test_classified_transaction_creation(self):
        """ClassifiedTransaction can be created."""
        txn = ClassifiedTransaction(
            source_transaction_id=uuid4(),
            date=date(2025, 1, 1),
            description="RENT PAYMENT",
            amount=Decimal("2000"),
            transaction_type=TransactionType.DEBIT,
            category=ClassificationCategory.HOUSING_RENT,
            is_necessary=True,
            classification_confidence=0.95,
        )
        assert txn.category == ClassificationCategory.HOUSING_RENT
        assert txn.is_necessary is True

    def test_classified_transactions_collection(self):
        """ClassifiedTransactions holds classified transactions."""
        source_id = uuid4()
        classified = ClassifiedTransactions(
            source_extraction_id=source_id,
            transactions=[
                ClassifiedTransaction(
                    source_transaction_id=uuid4(),
                    date=date(2025, 1, 1),
                    description="RENT",
                    amount=Decimal("2000"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.HOUSING_RENT,
                    classification_confidence=0.9,
                )
            ],
            category_totals={"housing_rent": Decimal("2000")},
            confidence=Confidence(overall=0.9, classification=0.9),
        )
        assert len(classified.transactions) == 1
        assert classified.category_totals["housing_rent"] == Decimal("2000")

    def test_classified_transaction_alternative_categories(self):
        """ClassifiedTransaction can store alternative classifications."""
        txn = ClassifiedTransaction(
            source_transaction_id=uuid4(),
            date=date(2025, 1, 1),
            description="AMAZON PRIME",
            amount=Decimal("15"),
            transaction_type=TransactionType.DEBIT,
            category=ClassificationCategory.SUBSCRIPTIONS,
            classification_confidence=0.7,
            alternative_categories=[
                (ClassificationCategory.SHOPPING, 0.2),
                (ClassificationCategory.ENTERTAINMENT, 0.1),
            ],
        )
        assert len(txn.alternative_categories) == 2
        assert txn.alternative_categories[0][0] == ClassificationCategory.SHOPPING


class TestValidatedTransactions:
    """Tests for Stage 4: ValidatedTransactions (Agent 4 output)."""

    def test_validated_transaction_creation(self):
        """ValidatedTransaction can be created."""
        txn = ValidatedTransaction(
            source_classification_id=uuid4(),
            date=date(2025, 1, 1),
            description="Test",
            amount=Decimal("100"),
            transaction_type=TransactionType.DEBIT,
            category=ClassificationCategory.FOOD,
            validation_status=ValidationStatus.VALID,
        )
        assert txn.validation_status == ValidationStatus.VALID
        assert txn.is_anomaly is False

    def test_validated_transaction_with_anomaly(self):
        """ValidatedTransaction can flag anomalies."""
        txn = ValidatedTransaction(
            source_classification_id=uuid4(),
            date=date(2025, 1, 1),
            description="UNUSUAL LARGE TRANSFER",
            amount=Decimal("50000"),
            transaction_type=TransactionType.DEBIT,
            category=ClassificationCategory.TRANSFER,
            validation_status=ValidationStatus.REQUIRES_REVIEW,
            is_anomaly=True,
            anomaly_reason="Amount exceeds typical threshold",
            anomaly_score=0.85,
        )
        assert txn.is_anomaly is True
        assert txn.anomaly_score == 0.85

    def test_validated_transactions_pass_rate(self):
        """ValidatedTransactions calculates pass rate."""
        validated = ValidatedTransactions(
            source_classification_id=uuid4(),
            transactions=[
                ValidatedTransaction(
                    source_classification_id=uuid4(),
                    date=date(2025, 1, i),
                    description=f"Txn {i}",
                    amount=Decimal("100"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.OTHER,
                    validation_status=ValidationStatus.VALID,
                )
                for i in range(1, 11)
            ],
            total_valid=8,
            total_with_warnings=1,
            total_requires_review=1,
            confidence=Confidence(overall=0.9),
        )
        assert validated.validation_pass_rate == 0.9  # 9/10

    def test_validated_transactions_duplicate_detection(self):
        """ValidatedTransactions tracks duplicates."""
        dup_id = uuid4()
        validated = ValidatedTransactions(
            source_classification_id=uuid4(),
            transactions=[
                ValidatedTransaction(
                    source_classification_id=uuid4(),
                    date=date(2025, 1, 1),
                    description="Original",
                    amount=Decimal("100"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.OTHER,
                    validation_status=ValidationStatus.VALID,
                    id=dup_id,
                ),
                ValidatedTransaction(
                    source_classification_id=uuid4(),
                    date=date(2025, 1, 1),
                    description="Duplicate",
                    amount=Decimal("100"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.OTHER,
                    validation_status=ValidationStatus.DUPLICATE,
                    is_duplicate=True,
                    duplicate_of=dup_id,
                ),
            ],
            total_valid=1,
            total_duplicates=1,
            confidence=Confidence(overall=0.85),
        )
        assert validated.total_duplicates == 1


class TestFinancialModel:
    """Tests for Stage 5: FinancialModel (Final output)."""

    def test_financial_model_creation(self):
        """FinancialModel can be created with required fields."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            gross_monthly_income=Decimal("5000"),
            total_monthly_expenses=Decimal("4000"),
            confidence=Confidence(overall=0.9),
        )
        assert model.gross_monthly_income == Decimal("5000")
        assert model.months_analyzed == 3

    def test_financial_model_net_cashflow(self):
        """FinancialModel calculates net cashflow."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            gross_monthly_income=Decimal("5000"),
            total_monthly_expenses=Decimal("4000"),
            confidence=Confidence(overall=0.9),
        )
        assert model.net_monthly_cashflow == Decimal("1000")

    def test_financial_model_expense_ratio(self):
        """FinancialModel calculates expense ratio."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            gross_monthly_income=Decimal("5000"),
            total_monthly_expenses=Decimal("4000"),
            confidence=Confidence(overall=0.9),
        )
        assert model.expense_to_income_ratio == 0.8

    def test_financial_model_cnc_qualification(self):
        """FinancialModel determines CNC qualification."""
        # Positive disposable income - does not qualify
        model1 = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            monthly_disposable_income=Decimal("500"),
            confidence=Confidence(overall=0.9),
        )
        assert model1.qualifies_for_cnc is False

        # Zero or negative disposable income - qualifies
        model2 = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            monthly_disposable_income=Decimal("0"),
            confidence=Confidence(overall=0.9),
        )
        assert model2.qualifies_for_cnc is True

    def test_financial_model_has_full_audit_trail(self):
        """FinancialModel includes complete audit trail."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            confidence=Confidence(overall=0.9),
            audit_trail=[
                AuditTrailEntry(
                    agent_name="document_intake",
                    action="extract",
                    input_summary="3 documents",
                    output_summary="Extracted text",
                ),
                AuditTrailEntry(
                    agent_name="transaction_extractor",
                    action="extract",
                    input_summary="Extracted text",
                    output_summary="150 transactions",
                ),
                AuditTrailEntry(
                    agent_name="classifier",
                    action="classify",
                    input_summary="150 transactions",
                    output_summary="Classified into 12 categories",
                ),
                AuditTrailEntry(
                    agent_name="validator",
                    action="validate",
                    input_summary="150 transactions",
                    output_summary="145 valid, 5 flagged",
                ),
                AuditTrailEntry(
                    agent_name="model_generator",
                    action="generate",
                    input_summary="Validated transactions",
                    output_summary="Financial model generated",
                ),
            ],
        )
        assert len(model.audit_trail) == 5
        agent_names = [e.agent_name for e in model.audit_trail]
        assert "document_intake" in agent_names
        assert "model_generator" in agent_names

    def test_financial_model_source_tracking(self):
        """FinancialModel tracks source documents."""
        doc_ids = [uuid4(), uuid4(), uuid4()]
        model = FinancialModel(
            source_document_ids=doc_ids,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            confidence=Confidence(overall=0.9),
        )
        assert len(model.source_document_ids) == 3

    def test_financial_model_recommendations(self):
        """FinancialModel includes recommendations."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            confidence=Confidence(overall=0.8),
            recommendations=[
                "Consider reducing dining out expenses",
                "Review subscription services for potential savings",
            ],
            additional_docs_needed=[
                "Most recent pay stub",
                "Property tax statement",
            ],
        )
        assert len(model.recommendations) == 2
        assert len(model.additional_docs_needed) == 2


class TestDataProgression:
    """Tests verifying clear data flow from raw to final."""

    def test_pipeline_stage_progression(self):
        """Verify data flows correctly through pipeline stages."""
        # Stage 1: Raw Document
        raw_doc = RawDocument(
            document_type=DocumentType.BANK_STATEMENT,
            source_filename="statement.pdf",
            raw_text="01/15/2025 DEPOSIT 5000.00\n01/16/2025 RENT -2000.00",
            confidence=Confidence(overall=0.95, extraction=0.95),
        )
        assert raw_doc.id is not None
        doc_id = raw_doc.id

        # Stage 2: Extracted Transactions (references doc_id)
        extracted = ExtractedTransactions(
            source_document_id=doc_id,
            transactions=[
                ExtractedTransaction(
                    source_document_id=doc_id,
                    date=date(2025, 1, 15),
                    description="DEPOSIT",
                    amount=Decimal("5000"),
                    transaction_type=TransactionType.CREDIT,
                    raw_text="01/15/2025 DEPOSIT 5000.00",
                    confidence=0.9,
                ),
                ExtractedTransaction(
                    source_document_id=doc_id,
                    date=date(2025, 1, 16),
                    description="RENT",
                    amount=Decimal("2000"),
                    transaction_type=TransactionType.DEBIT,
                    raw_text="01/16/2025 RENT -2000.00",
                    confidence=0.9,
                ),
            ],
            total_credits=Decimal("5000"),
            total_debits=Decimal("2000"),
            transaction_count=2,
            confidence=Confidence(overall=0.9, extraction=0.9),
        )
        assert extracted.source_document_id == doc_id
        extraction_id = extracted.id
        txn_ids = [t.id for t in extracted.transactions]

        # Stage 3: Classified Transactions (references extraction)
        classified = ClassifiedTransactions(
            source_extraction_id=extraction_id,
            transactions=[
                ClassifiedTransaction(
                    source_transaction_id=txn_ids[0],
                    date=date(2025, 1, 15),
                    description="DEPOSIT",
                    amount=Decimal("5000"),
                    transaction_type=TransactionType.CREDIT,
                    category=ClassificationCategory.INCOME_WAGES,
                    classification_confidence=0.95,
                ),
                ClassifiedTransaction(
                    source_transaction_id=txn_ids[1],
                    date=date(2025, 1, 16),
                    description="RENT",
                    amount=Decimal("2000"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.HOUSING_RENT,
                    is_necessary=True,
                    classification_confidence=0.98,
                ),
            ],
            confidence=Confidence(overall=0.9, classification=0.95),
        )
        assert classified.source_extraction_id == extraction_id
        classification_id = classified.id
        classified_ids = [t.id for t in classified.transactions]

        # Stage 4: Validated Transactions (references classification)
        validated = ValidatedTransactions(
            source_classification_id=classification_id,
            transactions=[
                ValidatedTransaction(
                    source_classification_id=classified_ids[0],
                    date=date(2025, 1, 15),
                    description="DEPOSIT",
                    amount=Decimal("5000"),
                    transaction_type=TransactionType.CREDIT,
                    category=ClassificationCategory.INCOME_WAGES,
                    validation_status=ValidationStatus.VALID,
                ),
                ValidatedTransaction(
                    source_classification_id=classified_ids[1],
                    date=date(2025, 1, 16),
                    description="RENT",
                    amount=Decimal("2000"),
                    transaction_type=TransactionType.DEBIT,
                    category=ClassificationCategory.HOUSING_RENT,
                    validation_status=ValidationStatus.VALID,
                    is_irs_allowable=True,
                ),
            ],
            total_valid=2,
            total_irs_allowable=Decimal("2000"),
            confidence=Confidence(overall=0.95, validation=0.95),
        )
        assert validated.source_classification_id == classification_id

        # Stage 5: Financial Model (references all source documents)
        final_model = FinancialModel(
            source_document_ids=[doc_id],
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31),
            months_analyzed=1,
            gross_monthly_income=Decimal("5000"),
            income_by_category={"income_wages": Decimal("5000")},
            total_monthly_expenses=Decimal("2000"),
            expenses_by_category={"housing_rent": Decimal("2000")},
            irs_allowed_expenses=Decimal("2000"),
            monthly_disposable_income=Decimal("3000"),
            confidence=Confidence(
                overall=0.92,
                extraction=0.9,
                classification=0.95,
                validation=0.95,
            ),
        )

        # Verify full pipeline linkage
        assert doc_id in final_model.source_document_ids
        assert final_model.gross_monthly_income == Decimal("5000")
        assert final_model.total_monthly_expenses == Decimal("2000")
        assert final_model.net_monthly_cashflow == Decimal("3000")
        assert final_model.qualifies_for_cnc is False  # Positive disposable income


class TestSerialization:
    """Tests for JSON serialization/deserialization."""

    def test_raw_document_serialization(self):
        """RawDocument serializes to/from JSON."""
        doc = RawDocument(
            document_type=DocumentType.BANK_STATEMENT,
            source_filename="test.pdf",
            raw_text="Test content",
            confidence=Confidence(overall=0.95),
        )
        json_str = doc.model_dump_json()
        restored = RawDocument.model_validate_json(json_str)
        assert restored.document_type == doc.document_type
        assert restored.source_filename == doc.source_filename

    def test_financial_model_serialization(self):
        """FinancialModel serializes to/from JSON."""
        model = FinancialModel(
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 3, 31),
            months_analyzed=3,
            gross_monthly_income=Decimal("5000"),
            total_monthly_expenses=Decimal("4000"),
            confidence=Confidence(overall=0.9),
            recommendations=["Test recommendation"],
        )
        json_str = model.model_dump_json()
        restored = FinancialModel.model_validate_json(json_str)
        assert restored.gross_monthly_income == Decimal("5000")
        assert len(restored.recommendations) == 1


class TestEnums:
    """Tests for enum types."""

    def test_document_type_values(self):
        """DocumentType has expected values."""
        assert DocumentType.BANK_STATEMENT.value == "bank_statement"
        assert DocumentType.PAY_STUB.value == "pay_stub"
        assert DocumentType.TAX_RETURN.value == "tax_return"

    def test_transaction_type_values(self):
        """TransactionType has expected values."""
        assert TransactionType.CREDIT.value == "credit"
        assert TransactionType.DEBIT.value == "debit"
        assert TransactionType.TRANSFER.value == "transfer"

    def test_classification_category_coverage(self):
        """ClassificationCategory covers IRS categories."""
        # Income categories
        assert ClassificationCategory.INCOME_WAGES
        assert ClassificationCategory.INCOME_SELF_EMPLOYMENT

        # Housing
        assert ClassificationCategory.HOUSING_RENT
        assert ClassificationCategory.HOUSING_MORTGAGE

        # Transportation
        assert ClassificationCategory.VEHICLE_PAYMENT
        assert ClassificationCategory.PUBLIC_TRANSPORTATION

        # Healthcare
        assert ClassificationCategory.HEALTH_INSURANCE
        assert ClassificationCategory.OUT_OF_POCKET_HEALTHCARE

    def test_validation_status_values(self):
        """ValidationStatus has expected values."""
        assert ValidationStatus.VALID.value == "valid"
        assert ValidationStatus.VALID_WITH_WARNINGS.value == "valid_with_warnings"
        assert ValidationStatus.REQUIRES_REVIEW.value == "requires_review"
        assert ValidationStatus.INVALID.value == "invalid"
        assert ValidationStatus.DUPLICATE.value == "duplicate"
