"""Tests for the disposable income calculator."""

from decimal import Decimal

import pytest

from vindicate_core import (
    CalculationResult,
    DisposableIncomeCalculator,
    FinancialSnapshot,
)
from vindicate_core.models import Debt, Expense, ExpenseCategory


@pytest.fixture
def basic_snapshot() -> FinancialSnapshot:
    """Create a basic financial snapshot for testing."""
    return FinancialSnapshot(
        gross_monthly_income=Decimal("5000"),
        expenses=[
            Expense(
                category=ExpenseCategory.HOUSING,
                amount=Decimal("2000"),
                description="Rent",
            ),
            Expense(
                category=ExpenseCategory.FOOD,
                amount=Decimal("600"),
                description="Groceries",
            ),
        ],
        debts=[
            Debt(
                creditor_name="Credit Card Co",
                account_number_last_four="1234",
                total_balance=Decimal("10000"),
                monthly_payment=Decimal("300"),
                interest_rate=Decimal("24.99"),
            ),
        ],
        liquid_assets=Decimal("1000"),
        family_size=2,
        state="NY",
    )


class TestDisposableIncomeCalculator:
    """Test suite for DisposableIncomeCalculator."""

    def test_calculate_returns_result(self, basic_snapshot: FinancialSnapshot):
        """Calculator should return a CalculationResult."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        assert isinstance(result, CalculationResult)
        assert result.gross_income == Decimal("5000")

    def test_disposable_income_calculation(self, basic_snapshot: FinancialSnapshot):
        """Disposable income should be income minus expenses minus debt payments."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        # Gross income: 5000
        # Allowed expenses will be min(actual, IRS standard)
        # Debt payments: 300
        assert result.disposable_income == (
            result.gross_income - result.allowed_expenses - result.debt_obligations
        )

    def test_rcp_48_calculation(self, basic_snapshot: FinancialSnapshot):
        """RCP 48 should be (disposable * 48) + liquid assets."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        expected_rcp_48 = (result.disposable_income * 48) + Decimal("1000")
        assert result.rcp_48_months == expected_rcp_48

    def test_rcp_60_calculation(self, basic_snapshot: FinancialSnapshot):
        """RCP 60 should be (disposable * 60) + liquid assets."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        expected_rcp_60 = (result.disposable_income * 60) + Decimal("1000")
        assert result.rcp_60_months == expected_rcp_60

    def test_audit_log_populated(self, basic_snapshot: FinancialSnapshot):
        """Calculator should populate audit log with all steps."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        assert len(result.audit_log) > 0

        # Check for key steps
        step_names = [entry.step for entry in result.audit_log]
        assert "gross_monthly_income" in step_names
        assert "total_allowed_expenses" in step_names
        assert "disposable_income" in step_names
        assert "rcp_48_months" in step_names

    def test_methodology_version_included(self, basic_snapshot: FinancialSnapshot):
        """Result should include methodology version."""
        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(basic_snapshot)

        assert result.methodology_version is not None
        assert "2025" in result.methodology_version

    def test_negative_disposable_income_warning(self):
        """Should warn when disposable income is negative."""
        snapshot = FinancialSnapshot(
            gross_monthly_income=Decimal("2000"),
            expenses=[
                Expense(
                    category=ExpenseCategory.HOUSING,
                    amount=Decimal("3000"),
                    description="Rent",
                ),
            ],
            debts=[],
            liquid_assets=Decimal("0"),
            family_size=1,
            state="NY",
        )

        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(snapshot)

        assert result.disposable_income < 0
        assert any("hardship" in w.lower() for w in result.warnings)

    def test_zero_income_warning(self):
        """Should warn when gross income is zero."""
        snapshot = FinancialSnapshot(
            gross_monthly_income=Decimal("0"),
            expenses=[],
            debts=[],
            liquid_assets=Decimal("500"),
            family_size=1,
            state="NY",
        )

        calculator = DisposableIncomeCalculator()
        result = calculator.calculate(snapshot)

        assert result.gross_income == 0
        assert any("zero" in w.lower() for w in result.warnings)
