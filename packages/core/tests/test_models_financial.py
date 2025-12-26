"""Tests for core financial data models.

This module tests the form-agnostic financial models:
- Transaction
- BankAccount
- FinancialPeriod
- MonthlyBreakdown
- TransactionCategory
"""

from datetime import date
from decimal import Decimal

import pytest

from vindicate_core.models.financial import (
    BankAccount,
    FinancialPeriod,
    MonthlyBreakdown,
    Transaction,
    TransactionCategory,
)


class TestTransactionCategory:
    """Tests for TransactionCategory enum."""

    def test_category_enum_values_exist(self):
        """All expected category values should exist."""
        # Test income categories
        assert TransactionCategory.INCOME_SALARY.value == "income_salary"
        assert TransactionCategory.INCOME_FREELANCE.value == "income_freelance"

        # Test expense categories
        assert TransactionCategory.HOUSING_RENT.value == "housing_rent"
        assert TransactionCategory.FOOD_GROCERIES.value == "food_groceries"
        assert TransactionCategory.TRANSPORTATION_GAS.value == "transportation_gas"

        # Test special categories
        assert TransactionCategory.UNCATEGORIZED.value == "uncategorized"
        assert TransactionCategory.OTHER.value == "other"

    def test_category_is_string_enum(self):
        """TransactionCategory should be a string enum."""
        cat = TransactionCategory.INCOME_SALARY
        assert isinstance(cat, str)
        assert cat == "income_salary"


class TestTransaction:
    """Tests for Transaction model."""

    def test_create_basic_transaction(self):
        """Should create a transaction with required fields."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="AMAZON.COM*1A2B3C4D",
            amount=Decimal("-49.99"),
        )

        assert txn.date == date(2025, 1, 15)
        assert txn.description == "AMAZON.COM*1A2B3C4D"
        assert txn.amount == Decimal("-49.99")
        assert txn.category == TransactionCategory.UNCATEGORIZED

    def test_create_transaction_with_all_fields(self):
        """Should create a transaction with all optional fields."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="AMAZON.COM*1A2B3C4D",
            amount=Decimal("-49.99"),
            category=TransactionCategory.SHOPPING_GENERAL,
            merchant="Amazon",
            reference_id="TXN123456",
            memo="Office supplies",
            source_file="statement_jan_2025.pdf",
            confidence=0.95,
        )

        assert txn.category == TransactionCategory.SHOPPING_GENERAL
        assert txn.merchant == "Amazon"
        assert txn.reference_id == "TXN123456"
        assert txn.memo == "Office supplies"
        assert txn.source_file == "statement_jan_2025.pdf"
        assert txn.confidence == 0.95

    def test_is_debit_for_negative_amount(self):
        """Transaction with negative amount should be debit."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="Purchase",
            amount=Decimal("-100.00"),
        )

        assert txn.is_debit is True
        assert txn.is_credit is False

    def test_is_credit_for_positive_amount(self):
        """Transaction with positive amount should be credit."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="Deposit",
            amount=Decimal("1000.00"),
        )

        assert txn.is_debit is False
        assert txn.is_credit is True

    def test_abs_amount(self):
        """abs_amount should return absolute value."""
        debit = Transaction(
            date=date(2025, 1, 15),
            description="Purchase",
            amount=Decimal("-49.99"),
        )
        credit = Transaction(
            date=date(2025, 1, 15),
            description="Deposit",
            amount=Decimal("100.00"),
        )

        assert debit.abs_amount == Decimal("49.99")
        assert credit.abs_amount == Decimal("100.00")

    def test_amount_coercion_from_string(self):
        """Should coerce string amounts to Decimal."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="Purchase",
            amount="-49.99",  # type: ignore
        )

        assert isinstance(txn.amount, Decimal)
        assert txn.amount == Decimal("-49.99")

    def test_confidence_bounds(self):
        """Confidence should be between 0 and 1."""
        # Valid confidence
        txn = Transaction(
            date=date(2025, 1, 15),
            description="Test",
            amount=Decimal("-10.00"),
            confidence=0.5,
        )
        assert txn.confidence == 0.5

        # Invalid: too high
        with pytest.raises(ValueError):
            Transaction(
                date=date(2025, 1, 15),
                description="Test",
                amount=Decimal("-10.00"),
                confidence=1.5,
            )

        # Invalid: too low
        with pytest.raises(ValueError):
            Transaction(
                date=date(2025, 1, 15),
                description="Test",
                amount=Decimal("-10.00"),
                confidence=-0.1,
            )

    def test_model_json_serialization(self):
        """Transaction should serialize to JSON properly."""
        txn = Transaction(
            date=date(2025, 1, 15),
            description="Test",
            amount=Decimal("-100.00"),
            category=TransactionCategory.FOOD_GROCERIES,
        )

        json_data = txn.model_dump_json()
        assert '"date":"2025-01-15"' in json_data
        assert '"amount":"-100.00"' in json_data
        assert '"category":"food_groceries"' in json_data


class TestBankAccount:
    """Tests for BankAccount model."""

    def test_create_basic_account(self):
        """Should create an account with required fields."""
        account = BankAccount(
            institution_name="Chase Bank",
            account_name="Primary Checking",
            account_type="checking",
        )

        assert account.institution_name == "Chase Bank"
        assert account.account_name == "Primary Checking"
        assert account.account_type == "checking"
        assert account.opening_balance == Decimal("0")
        assert account.transactions == []

    def test_create_account_with_opening_balance(self):
        """Should create an account with opening balance."""
        account = BankAccount(
            institution_name="Chase Bank",
            account_name="Savings",
            account_type="savings",
            opening_balance=Decimal("5000.00"),
            account_number_last_four="1234",
        )

        assert account.opening_balance == Decimal("5000.00")
        assert account.account_number_last_four == "1234"

    def test_current_balance_calculation(self):
        """Current balance should reflect opening balance plus transactions."""
        account = BankAccount(
            institution_name="Chase Bank",
            account_name="Checking",
            account_type="checking",
            opening_balance=Decimal("1000.00"),
            transactions=[
                Transaction(
                    date=date(2025, 1, 5),
                    description="Deposit",
                    amount=Decimal("500.00"),
                ),
                Transaction(
                    date=date(2025, 1, 10),
                    description="Purchase",
                    amount=Decimal("-200.00"),
                ),
            ],
        )

        assert account.current_balance == Decimal("1300.00")

    def test_total_credits(self):
        """Should calculate sum of all credits."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Test",
            account_type="checking",
            transactions=[
                Transaction(date=date(2025, 1, 1), description="Deposit 1", amount=Decimal("100.00")),
                Transaction(date=date(2025, 1, 2), description="Deposit 2", amount=Decimal("200.00")),
                Transaction(date=date(2025, 1, 3), description="Purchase", amount=Decimal("-50.00")),
            ],
        )

        assert account.total_credits == Decimal("300.00")

    def test_total_debits(self):
        """Should calculate sum of all debits (as positive)."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Test",
            account_type="checking",
            transactions=[
                Transaction(date=date(2025, 1, 1), description="Purchase 1", amount=Decimal("-100.00")),
                Transaction(date=date(2025, 1, 2), description="Purchase 2", amount=Decimal("-50.00")),
                Transaction(date=date(2025, 1, 3), description="Deposit", amount=Decimal("200.00")),
            ],
        )

        assert account.total_debits == Decimal("150.00")

    def test_transaction_count(self):
        """Should return correct transaction count."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Test",
            account_type="checking",
            transactions=[
                Transaction(date=date(2025, 1, 1), description="T1", amount=Decimal("100.00")),
                Transaction(date=date(2025, 1, 2), description="T2", amount=Decimal("-50.00")),
                Transaction(date=date(2025, 1, 3), description="T3", amount=Decimal("-25.00")),
            ],
        )

        assert account.transaction_count == 3

    def test_get_transactions_by_category(self):
        """Should filter transactions by category."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Test",
            account_type="checking",
            transactions=[
                Transaction(
                    date=date(2025, 1, 1),
                    description="Groceries",
                    amount=Decimal("-100.00"),
                    category=TransactionCategory.FOOD_GROCERIES,
                ),
                Transaction(
                    date=date(2025, 1, 2),
                    description="Restaurant",
                    amount=Decimal("-50.00"),
                    category=TransactionCategory.FOOD_RESTAURANTS,
                ),
                Transaction(
                    date=date(2025, 1, 3),
                    description="More groceries",
                    amount=Decimal("-75.00"),
                    category=TransactionCategory.FOOD_GROCERIES,
                ),
            ],
        )

        grocery_txns = account.get_transactions_by_category(TransactionCategory.FOOD_GROCERIES)
        assert len(grocery_txns) == 2
        assert all(t.category == TransactionCategory.FOOD_GROCERIES for t in grocery_txns)

    def test_get_transactions_in_range(self):
        """Should filter transactions by date range."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Test",
            account_type="checking",
            transactions=[
                Transaction(date=date(2025, 1, 1), description="T1", amount=Decimal("-10.00")),
                Transaction(date=date(2025, 1, 15), description="T2", amount=Decimal("-20.00")),
                Transaction(date=date(2025, 1, 31), description="T3", amount=Decimal("-30.00")),
                Transaction(date=date(2025, 2, 5), description="T4", amount=Decimal("-40.00")),
            ],
        )

        jan_txns = account.get_transactions_in_range(date(2025, 1, 1), date(2025, 1, 31))
        assert len(jan_txns) == 3

        mid_month = account.get_transactions_in_range(date(2025, 1, 10), date(2025, 1, 20))
        assert len(mid_month) == 1
        assert mid_month[0].description == "T2"


class TestFinancialPeriod:
    """Tests for FinancialPeriod model."""

    def test_create_basic_period(self):
        """Should create a period with required fields."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
        )

        assert period.start_date == date(2025, 1, 1)
        assert period.end_date == date(2025, 1, 31)
        assert period.total_income == Decimal("0")
        assert period.total_expenses == Decimal("0")

    def test_create_period_with_all_fields(self):
        """Should create a period with all fields."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            label="January 2025",
            total_income=Decimal("5000.00"),
            total_expenses=Decimal("3500.00"),
            opening_balance=Decimal("1000.00"),
            closing_balance=Decimal("2500.00"),
            transaction_count=45,
        )

        assert period.label == "January 2025"
        assert period.total_income == Decimal("5000.00")
        assert period.total_expenses == Decimal("3500.00")
        assert period.transaction_count == 45

    def test_net_cashflow(self):
        """Net cashflow should be income minus expenses."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            total_income=Decimal("5000.00"),
            total_expenses=Decimal("3500.00"),
        )

        assert period.net_cashflow == Decimal("1500.00")

    def test_negative_net_cashflow(self):
        """Net cashflow can be negative if expenses exceed income."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            total_income=Decimal("3000.00"),
            total_expenses=Decimal("4000.00"),
        )

        assert period.net_cashflow == Decimal("-1000.00")

    def test_savings_rate(self):
        """Savings rate should be net cashflow / income * 100."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            total_income=Decimal("5000.00"),
            total_expenses=Decimal("3500.00"),
        )

        # (1500 / 5000) * 100 = 30%
        assert period.savings_rate == Decimal("30")

    def test_savings_rate_zero_income(self):
        """Savings rate should be 0 when income is zero."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            total_income=Decimal("0"),
            total_expenses=Decimal("100.00"),
        )

        assert period.savings_rate == Decimal("0")

    def test_end_date_validation(self):
        """End date should not be before start date."""
        with pytest.raises(ValueError, match="end_date must be on or after start_date"):
            FinancialPeriod(
                start_date=date(2025, 1, 31),
                end_date=date(2025, 1, 1),
            )

    def test_same_start_and_end_date(self):
        """Start and end date can be the same (single day period)."""
        period = FinancialPeriod(
            start_date=date(2025, 1, 15),
            end_date=date(2025, 1, 15),
        )

        assert period.start_date == period.end_date


class TestMonthlyBreakdown:
    """Tests for MonthlyBreakdown model."""

    def test_create_basic_breakdown(self):
        """Should create a breakdown with required fields."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
        )

        assert breakdown.year == 2025
        assert breakdown.month == 1
        assert breakdown.category_totals == {}
        assert breakdown.total_income == Decimal("0")
        assert breakdown.total_expenses == Decimal("0")

    def test_create_breakdown_with_categories(self):
        """Should create a breakdown with category totals."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            category_totals={
                TransactionCategory.FOOD_GROCERIES: Decimal("450.00"),
                TransactionCategory.HOUSING_RENT: Decimal("1800.00"),
                TransactionCategory.TRANSPORTATION_GAS: Decimal("120.00"),
            },
            category_counts={
                TransactionCategory.FOOD_GROCERIES: 8,
                TransactionCategory.HOUSING_RENT: 1,
                TransactionCategory.TRANSPORTATION_GAS: 4,
            },
            total_income=Decimal("5000.00"),
            total_expenses=Decimal("3500.00"),
            transaction_count=45,
        )

        assert breakdown.category_totals[TransactionCategory.FOOD_GROCERIES] == Decimal("450.00")
        assert breakdown.category_counts[TransactionCategory.HOUSING_RENT] == 1
        assert breakdown.transaction_count == 45

    def test_net_cashflow(self):
        """Net cashflow should be income minus expenses."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            total_income=Decimal("5000.00"),
            total_expenses=Decimal("3500.00"),
        )

        assert breakdown.net_cashflow == Decimal("1500.00")

    def test_savings_rate(self):
        """Savings rate should be calculated correctly."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            total_income=Decimal("4000.00"),
            total_expenses=Decimal("3000.00"),
        )

        # (1000 / 4000) * 100 = 25%
        assert breakdown.savings_rate == Decimal("25")

    def test_savings_rate_zero_income(self):
        """Savings rate should be 0 when income is zero."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            total_income=Decimal("0"),
            total_expenses=Decimal("500.00"),
        )

        assert breakdown.savings_rate == Decimal("0")

    def test_label_generation(self):
        """Label should be generated from month and year."""
        breakdown = MonthlyBreakdown(year=2025, month=1)
        assert breakdown.label == "January 2025"

        breakdown = MonthlyBreakdown(year=2025, month=12)
        assert breakdown.label == "December 2025"

    def test_month_validation(self):
        """Month should be between 1 and 12."""
        with pytest.raises(ValueError):
            MonthlyBreakdown(year=2025, month=0)

        with pytest.raises(ValueError):
            MonthlyBreakdown(year=2025, month=13)

    def test_get_top_expense_categories(self):
        """Should return top expense categories sorted by amount."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            category_totals={
                TransactionCategory.HOUSING_RENT: Decimal("1800.00"),
                TransactionCategory.FOOD_GROCERIES: Decimal("450.00"),
                TransactionCategory.TRANSPORTATION_GAS: Decimal("120.00"),
                TransactionCategory.ENTERTAINMENT_SUBSCRIPTIONS: Decimal("50.00"),
                TransactionCategory.INCOME_SALARY: Decimal("5000.00"),  # Should be excluded
                TransactionCategory.HEALTHCARE_MEDICAL: Decimal("200.00"),
                TransactionCategory.SHOPPING_GENERAL: Decimal("300.00"),
            },
        )

        top_3 = breakdown.get_top_expense_categories(3)
        assert len(top_3) == 3
        assert top_3[0] == (TransactionCategory.HOUSING_RENT, Decimal("1800.00"))
        assert top_3[1] == (TransactionCategory.FOOD_GROCERIES, Decimal("450.00"))
        assert top_3[2] == (TransactionCategory.SHOPPING_GENERAL, Decimal("300.00"))

    def test_get_top_expense_categories_excludes_income(self):
        """Top expense categories should exclude income categories."""
        breakdown = MonthlyBreakdown(
            year=2025,
            month=1,
            category_totals={
                TransactionCategory.INCOME_SALARY: Decimal("5000.00"),
                TransactionCategory.INCOME_FREELANCE: Decimal("1000.00"),
                TransactionCategory.FOOD_GROCERIES: Decimal("450.00"),
            },
        )

        top = breakdown.get_top_expense_categories(5)
        assert len(top) == 1
        assert top[0][0] == TransactionCategory.FOOD_GROCERIES


class TestModelsIntegration:
    """Integration tests across multiple models."""

    def test_account_to_period_workflow(self):
        """Test creating a period summary from an account's transactions."""
        account = BankAccount(
            institution_name="Test Bank",
            account_name="Checking",
            account_type="checking",
            opening_balance=Decimal("1000.00"),
            transactions=[
                Transaction(
                    date=date(2025, 1, 5),
                    description="Salary",
                    amount=Decimal("5000.00"),
                    category=TransactionCategory.INCOME_SALARY,
                ),
                Transaction(
                    date=date(2025, 1, 10),
                    description="Rent",
                    amount=Decimal("-1800.00"),
                    category=TransactionCategory.HOUSING_RENT,
                ),
                Transaction(
                    date=date(2025, 1, 15),
                    description="Groceries",
                    amount=Decimal("-200.00"),
                    category=TransactionCategory.FOOD_GROCERIES,
                ),
            ],
        )

        # Create period from account data
        jan_txns = account.get_transactions_in_range(date(2025, 1, 1), date(2025, 1, 31))
        period = FinancialPeriod(
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            label="January 2025",
            total_income=sum(t.amount for t in jan_txns if t.is_credit),
            total_expenses=sum(t.abs_amount for t in jan_txns if t.is_debit),
            opening_balance=account.opening_balance,
            closing_balance=account.current_balance,
            transaction_count=len(jan_txns),
        )

        assert period.total_income == Decimal("5000.00")
        assert period.total_expenses == Decimal("2000.00")
        assert period.net_cashflow == Decimal("3000.00")

    def test_decimal_precision_maintained(self):
        """Ensure Decimal precision is maintained throughout."""
        txn = Transaction(
            date=date(2025, 1, 1),
            description="Precise amount",
            amount=Decimal("123.456789"),
        )

        account = BankAccount(
            institution_name="Test",
            account_name="Test",
            account_type="checking",
            opening_balance=Decimal("1000.123456"),
            transactions=[txn],
        )

        # Verify precision maintained
        assert account.current_balance == Decimal("1123.580245")
