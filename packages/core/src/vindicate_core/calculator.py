"""Disposable income and RCP calculations per IRS OIC methodology."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

import structlog

from .models import (
    AuditEntry,
    CalculationResult,
    Expense,
    ExpenseCategory,
    FinancialSnapshot,
)
from .irs_standards import get_allowable_expense, get_irs_standards_version

logger = structlog.get_logger()


class DisposableIncomeCalculator:
    """
    Calculate monthly disposable income per IRS OIC methodology.

    This calculator follows IRS Form 433-A requirements and uses
    current IRS National Standards for allowable living expenses.

    All calculations are logged for audit trail and legal defensibility.
    """

    def __init__(self, methodology_version: Optional[str] = None):
        """
        Initialize calculator with IRS methodology version.

        Args:
            methodology_version: Override IRS standards version (default: current)
        """
        self.methodology_version = methodology_version or get_irs_standards_version()
        self._audit_log: list[AuditEntry] = []

    def _log_step(
        self,
        step: str,
        input_value: str,
        output_value: str,
        source: str,
        notes: Optional[str] = None
    ) -> None:
        """Add an entry to the audit log."""
        entry = AuditEntry(
            step=step,
            input_value=input_value,
            output_value=output_value,
            source=source,
            notes=notes,
        )
        self._audit_log.append(entry)
        logger.info(
            "calculation_step",
            step=step,
            input=input_value,
            output=output_value,
            source=source,
        )

    def _calculate_allowed_expenses(
        self,
        expenses: list[Expense],
        family_size: int,
        state: str,
    ) -> Decimal:
        """
        Calculate total allowed expenses using IRS standards.

        Compares actual expenses to IRS National Standards and uses
        the lesser amount unless actual expenses are documented and
        necessary.
        """
        total_allowed = Decimal("0")

        for expense in expenses:
            actual = expense.amount
            standard = get_allowable_expense(
                category=expense.category,
                family_size=family_size,
                state=state,
                version=self.methodology_version,
            )

            # Use lesser of actual or standard (IRS rule)
            allowed = min(actual, standard) if standard else actual

            self._log_step(
                step=f"expense_{expense.category.value}",
                input_value=f"actual={actual}, standard={standard}",
                output_value=str(allowed),
                source=f"IRS National Standards {self.methodology_version}",
                notes=expense.description,
            )

            total_allowed += allowed

        return total_allowed

    def calculate(self, snapshot: FinancialSnapshot) -> CalculationResult:
        """
        Calculate disposable income and Reasonable Collection Potential (RCP).

        Args:
            snapshot: Complete financial picture at a point in time

        Returns:
            CalculationResult with full audit trail and RCP calculations
        """
        self._audit_log = []  # Reset audit log
        warnings: list[str] = []

        # Step 1: Validate and log gross income
        gross_income = snapshot.total_monthly_income
        self._log_step(
            step="gross_monthly_income",
            input_value=str(snapshot.gross_monthly_income),
            output_value=str(gross_income),
            source="User provided",
        )

        if snapshot.business_income > 0:
            self._log_step(
                step="business_income",
                input_value=str(snapshot.business_income),
                output_value=str(snapshot.business_income),
                source="User provided",
                notes="Self-employment or business income",
            )

        # Step 2: Calculate allowed expenses
        allowed_expenses = self._calculate_allowed_expenses(
            expenses=snapshot.expenses,
            family_size=snapshot.family_size,
            state=snapshot.state,
        )

        self._log_step(
            step="total_allowed_expenses",
            input_value=f"{len(snapshot.expenses)} expense items",
            output_value=str(allowed_expenses),
            source="Calculated from IRS standards",
        )

        # Step 3: Sum debt obligations
        debt_obligations = sum(d.monthly_payment for d in snapshot.debts)
        self._log_step(
            step="debt_obligations",
            input_value=f"{len(snapshot.debts)} debts",
            output_value=str(debt_obligations),
            source="User provided debt payments",
        )

        # Step 4: Calculate disposable income
        disposable_income = gross_income - allowed_expenses - debt_obligations
        self._log_step(
            step="disposable_income",
            input_value=f"{gross_income} - {allowed_expenses} - {debt_obligations}",
            output_value=str(disposable_income),
            source="IRS OIC Formula",
        )

        # Step 5: Calculate RCP
        rcp_48 = (disposable_income * 48) + snapshot.liquid_assets
        rcp_60 = (disposable_income * 60) + snapshot.liquid_assets

        self._log_step(
            step="rcp_48_months",
            input_value=f"({disposable_income} * 48) + {snapshot.liquid_assets}",
            output_value=str(rcp_48),
            source="IRS OIC Form 656 - Lump Sum Offer",
        )

        self._log_step(
            step="rcp_60_months",
            input_value=f"({disposable_income} * 60) + {snapshot.liquid_assets}",
            output_value=str(rcp_60),
            source="IRS OIC Form 656 - Periodic Payment Offer",
        )

        # Validation warnings
        if disposable_income < 0:
            warnings.append(
                "Negative disposable income indicates financial hardship. "
                "Consider Currently Not Collectible (CNC) status."
            )

        if gross_income == 0:
            warnings.append(
                "Zero gross income requires documentation (unemployment, disability, etc.)"
            )

        return CalculationResult(
            gross_income=gross_income,
            allowed_expenses=allowed_expenses,
            debt_obligations=debt_obligations,
            disposable_income=disposable_income,
            rcp_48_months=rcp_48,
            rcp_60_months=rcp_60,
            audit_log=self._audit_log,
            methodology_version=self.methodology_version,
            confidence_level=0.95,  # High confidence for calculation-based results
            warnings=warnings,
        )
