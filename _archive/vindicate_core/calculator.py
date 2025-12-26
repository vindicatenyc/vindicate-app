"""Disposable income and RCP calculations per IRS OIC methodology.

This module provides two calculators:
1. DisposableIncomeCalculator - Legacy calculator for simple use cases
2. Form433ACalculator - Full Form 433-A analysis with complete IRS standards
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

import structlog

from .models import (
    AuditEntry,
    CalculationResult,
    Expense,
    ExpenseCategory,
    ExpenseAllowance,
    FinancialSnapshot,
    Form433A,
    Form433AResult,
)
from .irs_standards import (
    get_allowable_expense,
    get_irs_standards_version,
    get_all_allowable_expenses,
    get_national_standard_food_clothing,
    get_housing_standard,
    get_transportation_standard,
    get_healthcare_standard,
    calculate_rcp_lump_sum,
    calculate_rcp_periodic,
    MINIMUM_OIC_OFFER,
    IRS_STANDARDS_VERSION,
)

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


class Form433ACalculator:
    """
    Complete IRS Form 433-A analysis calculator.

    This calculator implements the full IRS OIC (Offer in Compromise)
    methodology including:
    - National Standards for food, clothing, and other items
    - Local Standards for housing and utilities (all 50 states)
    - Local Standards for transportation (regional)
    - Out-of-pocket healthcare standards
    - Asset equity calculations (Quick Sale Value methodology)
    - RCP calculations for lump sum and periodic payment offers
    - CNC (Currently Not Collectible) eligibility analysis

    All calculations are fully audited for legal defensibility.
    """

    def __init__(self):
        """Initialize the Form 433-A calculator."""
        self._audit_log: list[AuditEntry] = []
        self._warnings: list[str] = []
        self._recommendations: list[str] = []

    def _log_step(
        self,
        step: str,
        input_value: str,
        output_value: str,
        source: str,
        notes: Optional[str] = None,
        line_number: Optional[str] = None,
    ) -> None:
        """Add an entry to the audit log."""
        entry = AuditEntry(
            step=step,
            input_value=input_value,
            output_value=output_value,
            source=source,
            notes=notes,
            line_number=line_number,
        )
        self._audit_log.append(entry)
        logger.info(
            "form_433a_calculation_step",
            step=step,
            input=input_value,
            output=output_value,
            source=source,
        )

    def _calculate_income(self, form: Form433A) -> tuple[Decimal, Decimal]:
        """Calculate total gross and net monthly income.

        Returns:
            Tuple of (gross_monthly_income, net_monthly_income)
        """
        gross = Decimal("0")
        net = Decimal("0")

        # Primary taxpayer employment
        for i, emp in enumerate(form.employment):
            emp_gross = emp.income.monthly_gross
            emp_net = emp.income.monthly_net
            gross += emp_gross
            net += emp_net
            self._log_step(
                step=f"employment_{i+1}_income",
                input_value=f"{emp.employer_name}: gross={emp.income.gross_amount}/{emp.income.frequency.value}",
                output_value=f"monthly_gross={emp_gross}, monthly_net={emp_net}",
                source="Form 433-A Section 2",
                line_number="Line 10-14",
            )

        # Spouse employment
        for i, emp in enumerate(form.spouse_employment):
            emp_gross = emp.income.monthly_gross
            emp_net = emp.income.monthly_net
            gross += emp_gross
            net += emp_net
            self._log_step(
                step=f"spouse_employment_{i+1}_income",
                input_value=f"{emp.employer_name}: gross={emp.income.gross_amount}/{emp.income.frequency.value}",
                output_value=f"monthly_gross={emp_gross}, monthly_net={emp_net}",
                source="Form 433-A Section 2 (Spouse)",
                line_number="Line 15-19",
            )

        # Other income - primary
        for i, inc in enumerate(form.other_income):
            inc_gross = inc.monthly_gross
            inc_net = inc.monthly_net
            gross += inc_gross
            net += inc_net
            self._log_step(
                step=f"other_income_{i+1}",
                input_value=f"{inc.income_type.value}: {inc.gross_amount}/{inc.frequency.value}",
                output_value=f"monthly_gross={inc_gross}, monthly_net={inc_net}",
                source="Form 433-A Section 3",
                line_number="Line 20-27",
            )

        # Other income - spouse
        for i, inc in enumerate(form.spouse_other_income):
            inc_gross = inc.monthly_gross
            inc_net = inc.monthly_net
            gross += inc_gross
            net += inc_net
            self._log_step(
                step=f"spouse_other_income_{i+1}",
                input_value=f"{inc.income_type.value}: {inc.gross_amount}/{inc.frequency.value}",
                output_value=f"monthly_gross={inc_gross}, monthly_net={inc_net}",
                source="Form 433-A Section 3 (Spouse)",
            )

        self._log_step(
            step="total_monthly_income",
            input_value=f"{len(form.employment) + len(form.spouse_employment)} employment + {len(form.other_income) + len(form.spouse_other_income)} other sources",
            output_value=f"gross={gross}, net={net}",
            source="Calculated",
            line_number="Line 28",
        )

        return gross, net

    def _calculate_expense_allowances(
        self,
        form: Form433A,
    ) -> tuple[Decimal, Decimal, list[ExpenseAllowance]]:
        """Compare actual expenses to IRS allowable amounts.

        Returns:
            Tuple of (actual_total, allowed_total, allowances_list)
        """
        expenses = form.living_expenses
        personal = form.personal_info
        state = personal.state
        family_size = personal.family_size

        # Age breakdown for healthcare
        ages_under_65 = family_size - personal.ages_65_or_over
        ages_65_and_over = personal.ages_65_or_over

        # Count vehicles
        num_vehicles = len(form.vehicles)

        allowances: list[ExpenseAllowance] = []
        actual_total = Decimal("0")
        allowed_total = Decimal("0")

        # 1. National Standards - Food, Clothing, Misc
        actual_national = expenses.total_national_standards
        irs_national = get_national_standard_food_clothing(family_size)
        allowed_national = min(actual_national, irs_national)

        allowances.append(ExpenseAllowance(
            category="Food, Clothing, & Other Items",
            actual_amount=actual_national,
            irs_standard=irs_national,
            allowed_amount=allowed_national,
            variance=actual_national - allowed_national,
            notes=f"National Standard for family of {family_size}",
        ))

        self._log_step(
            step="national_standards_expense",
            input_value=f"actual={actual_national}, standard={irs_national}",
            output_value=f"allowed={allowed_national}",
            source=f"IRS National Standards {IRS_STANDARDS_VERSION}",
            line_number="Line 29",
        )

        actual_total += actual_national
        allowed_total += allowed_national

        # 2. Local Standards - Housing and Utilities
        actual_housing = expenses.total_housing
        irs_housing = get_housing_standard(state, family_size)
        allowed_housing = min(actual_housing, irs_housing)

        allowances.append(ExpenseAllowance(
            category="Housing and Utilities",
            actual_amount=actual_housing,
            irs_standard=irs_housing,
            allowed_amount=allowed_housing,
            variance=actual_housing - allowed_housing,
            notes=f"Local Standard for {state}, family of {family_size}",
        ))

        self._log_step(
            step="housing_utilities_expense",
            input_value=f"actual={actual_housing}, standard={irs_housing}",
            output_value=f"allowed={allowed_housing}",
            source=f"IRS Local Standards (Housing) {IRS_STANDARDS_VERSION}",
            line_number="Line 30-32",
        )

        actual_total += actual_housing
        allowed_total += allowed_housing

        # 3. Local Standards - Transportation
        actual_transport = expenses.total_transportation
        transport_std = get_transportation_standard(state, num_vehicles)
        irs_transport = transport_std.total
        allowed_transport = min(actual_transport, irs_transport)

        allowances.append(ExpenseAllowance(
            category="Transportation",
            actual_amount=actual_transport,
            irs_standard=irs_transport,
            allowed_amount=allowed_transport,
            variance=actual_transport - allowed_transport,
            notes=f"Local Standard: {num_vehicles} vehicle(s), ownership={transport_std.ownership_allowance}, operating={transport_std.operating_allowance}",
        ))

        self._log_step(
            step="transportation_expense",
            input_value=f"actual={actual_transport}, standard={irs_transport} ({num_vehicles} vehicles)",
            output_value=f"allowed={allowed_transport}",
            source=f"IRS Local Standards (Transportation) {IRS_STANDARDS_VERSION}",
            line_number="Line 33-34",
        )

        actual_total += actual_transport
        allowed_total += allowed_transport

        # 4. Out-of-Pocket Healthcare
        actual_healthcare = expenses.total_healthcare
        irs_healthcare = get_healthcare_standard(ages_under_65, ages_65_and_over)
        # Healthcare: use actual if greater and documented as necessary
        allowed_healthcare = actual_healthcare  # Healthcare actual is generally allowed if documented

        allowances.append(ExpenseAllowance(
            category="Out-of-Pocket Healthcare",
            actual_amount=actual_healthcare,
            irs_standard=irs_healthcare,
            allowed_amount=allowed_healthcare,
            variance=actual_healthcare - irs_healthcare,
            notes=f"Standard: ${irs_healthcare} ({ages_under_65} under 65, {ages_65_and_over} 65+). Actual documented expenses allowed.",
        ))

        self._log_step(
            step="healthcare_expense",
            input_value=f"actual={actual_healthcare}, standard={irs_healthcare}",
            output_value=f"allowed={allowed_healthcare}",
            source="IRS Out-of-Pocket Healthcare Standards",
            notes="Documented healthcare expenses generally allowed",
            line_number="Line 35",
        )

        actual_total += actual_healthcare
        allowed_total += allowed_healthcare

        # 5. Court-Ordered Payments (actual allowed)
        actual_court = expenses.total_court_ordered
        allowed_court = actual_court  # Court-ordered payments are always allowed

        if actual_court > 0:
            allowances.append(ExpenseAllowance(
                category="Court-Ordered Payments",
                actual_amount=actual_court,
                irs_standard=None,  # No cap
                allowed_amount=allowed_court,
                variance=Decimal("0"),
                notes="Court-ordered payments allowed in full",
            ))

            self._log_step(
                step="court_ordered_expense",
                input_value=f"child_support={expenses.child_support_paid}, alimony={expenses.alimony_paid}",
                output_value=f"allowed={allowed_court}",
                source="Court Order Documentation",
                line_number="Line 36",
            )

        actual_total += actual_court
        allowed_total += allowed_court

        # 6. Other Necessary Expenses
        actual_other = expenses.total_other_necessary
        allowed_other = actual_other  # Assume documented and necessary

        if actual_other > 0:
            allowances.append(ExpenseAllowance(
                category="Other Necessary Expenses",
                actual_amount=actual_other,
                irs_standard=None,
                allowed_amount=allowed_other,
                variance=Decimal("0"),
                notes="Includes childcare, life insurance, current taxes, student loans, professional dues",
            ))

            self._log_step(
                step="other_necessary_expense",
                input_value=f"childcare={expenses.childcare}, life_ins={expenses.life_insurance}, student_loans={expenses.student_loan_payment}",
                output_value=f"allowed={allowed_other}",
                source="Documentation Required",
                line_number="Line 37-40",
            )

        actual_total += actual_other
        allowed_total += allowed_other

        self._log_step(
            step="total_living_expenses",
            input_value=f"6 expense categories analyzed",
            output_value=f"actual={actual_total}, allowed={allowed_total}",
            source="Calculated",
            line_number="Line 41",
        )

        return actual_total, allowed_total, allowances

    def _calculate_asset_equity(self, form: Form433A) -> tuple[Decimal, Decimal, Decimal]:
        """Calculate liquid assets and net realizable equity.

        Returns:
            Tuple of (liquid_assets, total_equity, net_realizable_equity)
        """
        liquid = Decimal("0")
        total_equity = Decimal("0")
        net_equity = Decimal("0")

        # Bank accounts (liquid assets)
        for i, account in enumerate(form.bank_accounts):
            if not account.is_retirement:
                liquid += account.current_balance
                self._log_step(
                    step=f"bank_account_{i+1}",
                    input_value=f"{account.institution_name} {account.account_type.value}",
                    output_value=f"balance={account.current_balance}",
                    source="Form 433-A Section 4",
                    line_number="Line 42-45",
                )

        self._log_step(
            step="total_liquid_assets",
            input_value=f"{len(form.bank_accounts)} accounts",
            output_value=f"liquid={liquid}",
            source="Calculated",
            notes="Excludes retirement accounts",
        )

        # Real property
        for i, prop in enumerate(form.real_property):
            prop_equity = prop.net_realizable_equity
            total_equity += prop.gross_equity
            net_equity += prop_equity

            self._log_step(
                step=f"real_property_{i+1}",
                input_value=f"FMV={prop.current_market_value}, mortgage={prop.mortgage_balance}, liens={prop.other_liens}",
                output_value=f"QSV={prop.quick_sale_value}, net_equity={prop_equity}",
                source="IRS Quick Sale Value (80% of FMV)",
                notes=f"{prop.property_type.value}: {prop.address}",
                line_number="Line 46-51",
            )

        # Vehicles
        for i, vehicle in enumerate(form.vehicles):
            veh_equity = vehicle.net_realizable_equity
            total_equity += (vehicle.current_market_value - vehicle.loan_balance)
            net_equity += veh_equity

            self._log_step(
                step=f"vehicle_{i+1}",
                input_value=f"FMV={vehicle.current_market_value}, loan={vehicle.loan_balance}",
                output_value=f"QSV={vehicle.quick_sale_value}, net_equity={veh_equity}",
                source="IRS Quick Sale Value (80% of FMV)",
                notes=vehicle.description,
                line_number="Line 52-55",
            )

        # Other assets
        for i, asset in enumerate(form.other_assets):
            asset_equity = asset.net_realizable_equity
            total_equity += (asset.current_market_value - asset.loan_balance)
            net_equity += asset_equity

            self._log_step(
                step=f"other_asset_{i+1}",
                input_value=f"type={asset.asset_type.value}, FMV={asset.current_market_value}",
                output_value=f"net_equity={asset_equity}",
                source="IRS Asset Valuation",
                notes=asset.description,
                line_number="Line 56-60",
            )

        # Add liquid assets to net equity (full value, no QSV discount)
        total_net_equity = liquid + net_equity

        self._log_step(
            step="total_asset_equity",
            input_value=f"liquid={liquid}, property_equity={net_equity}",
            output_value=f"total_net_realizable_equity={total_net_equity}",
            source="IRS OIC Asset Calculation",
            line_number="Line 61",
        )

        return liquid, total_equity, total_net_equity

    def _determine_cnc_eligibility(
        self,
        monthly_disposable: Decimal,
        total_assets: Decimal,
        total_tax_liability: Decimal,
    ) -> tuple[bool, Optional[str]]:
        """Determine if taxpayer qualifies for Currently Not Collectible status.

        Returns:
            Tuple of (qualifies, reason)
        """
        # CNC criteria:
        # 1. Negative or zero disposable income
        # 2. Minimal assets
        # 3. Tax liability would be uncollectible within CSED

        if monthly_disposable <= 0 and total_assets < Decimal("1000"):
            return True, "Negative disposable income with minimal assets - collection would cause hardship"

        if monthly_disposable <= 0:
            return True, "Negative disposable income indicates inability to pay"

        # If RCP is less than tax liability by significant margin
        rcp_periodic = calculate_rcp_periodic(monthly_disposable, total_assets)
        if total_tax_liability > 0 and rcp_periodic < (total_tax_liability * Decimal("0.1")):
            return True, f"RCP ({rcp_periodic}) is less than 10% of total liability ({total_tax_liability})"

        return False, None

    def calculate(self, form: Form433A) -> Form433AResult:
        """
        Perform complete Form 433-A analysis.

        Args:
            form: Complete Form 433-A data

        Returns:
            Form433AResult with full analysis and audit trail
        """
        # Reset state
        self._audit_log = []
        self._warnings = []
        self._recommendations = []

        self._log_step(
            step="analysis_start",
            input_value=f"Form 433-A for {form.personal_info.first_name} {form.personal_info.last_name}",
            output_value=f"state={form.personal_info.state}, family_size={form.personal_info.family_size}",
            source="User Input",
        )

        # Step 1: Calculate Income
        gross_income, net_income = self._calculate_income(form)

        if gross_income == 0:
            self._warnings.append(
                "Zero gross income reported. Documentation required (unemployment, disability, etc.)"
            )

        # Step 2: Calculate Expense Allowances
        actual_expenses, allowed_expenses, expense_allowances = self._calculate_expense_allowances(form)

        # Step 3: Calculate Monthly Disposable Income
        # Using gross income per IRS OIC methodology
        monthly_disposable = gross_income - allowed_expenses

        self._log_step(
            step="monthly_disposable_income",
            input_value=f"gross_income={gross_income} - allowed_expenses={allowed_expenses}",
            output_value=f"disposable={monthly_disposable}",
            source="IRS OIC Form 656 Calculation",
            line_number="Line 62",
        )

        if monthly_disposable < 0:
            self._warnings.append(
                "Negative monthly disposable income. Consider Currently Not Collectible (CNC) status or hardship OIC."
            )
            self._recommendations.append(
                "Document all expenses exceeding IRS standards with receipts and necessity statements."
            )

        # Step 4: Calculate Asset Equity
        liquid_assets, total_equity, net_realizable_equity = self._calculate_asset_equity(form)

        # Step 5: Calculate RCP
        rcp_lump_sum = calculate_rcp_lump_sum(monthly_disposable, net_realizable_equity)
        rcp_periodic = calculate_rcp_periodic(monthly_disposable, net_realizable_equity)

        self._log_step(
            step="rcp_lump_sum",
            input_value=f"(disposable={monthly_disposable} × 12) + assets={net_realizable_equity}",
            output_value=f"RCP={rcp_lump_sum}",
            source="IRS OIC Form 656 - Lump Sum Offer",
            notes="Offer paid in 5 months or less",
        )

        self._log_step(
            step="rcp_periodic",
            input_value=f"(disposable={monthly_disposable} × 24) + assets={net_realizable_equity}",
            output_value=f"RCP={rcp_periodic}",
            source="IRS OIC Form 656 - Periodic Payment Offer",
            notes="Offer paid in 6-24 months",
        )

        # Step 6: Calculate Minimum Offer
        minimum_lump = max(rcp_lump_sum, MINIMUM_OIC_OFFER)
        minimum_periodic = max(rcp_periodic, MINIMUM_OIC_OFFER)

        # Step 7: CNC Analysis
        total_tax_liability = form.total_tax_liability
        qualifies_cnc, cnc_reason = self._determine_cnc_eligibility(
            monthly_disposable, net_realizable_equity, total_tax_liability
        )

        if qualifies_cnc:
            self._recommendations.append(
                f"Consider requesting Currently Not Collectible status: {cnc_reason}"
            )

        # Step 8: Generate recommendations
        if rcp_lump_sum < total_tax_liability * Decimal("0.5"):
            self._recommendations.append(
                "Lump sum offer may be significantly below total liability - strong OIC candidate."
            )

        if actual_expenses > allowed_expenses:
            variance = actual_expenses - allowed_expenses
            self._recommendations.append(
                f"Actual expenses exceed IRS standards by ${variance}. Document necessity to request allowance."
            )

        # Calculate confidence based on data completeness
        confidence = self._calculate_confidence(form)

        self._log_step(
            step="analysis_complete",
            input_value=f"Form 433-A analysis",
            output_value=f"RCP_lump={rcp_lump_sum}, RCP_periodic={rcp_periodic}, CNC={qualifies_cnc}",
            source="Vindicate Core Calculator",
        )

        return Form433AResult(
            total_gross_monthly_income=gross_income,
            total_net_monthly_income=net_income,
            actual_total_expenses=actual_expenses,
            irs_allowed_total_expenses=allowed_expenses,
            expense_allowances=expense_allowances,
            monthly_disposable_income=monthly_disposable,
            total_liquid_assets=liquid_assets,
            total_asset_equity=total_equity,
            total_net_realizable_equity=net_realizable_equity,
            rcp_lump_sum=rcp_lump_sum,
            rcp_periodic=rcp_periodic,
            minimum_offer_lump_sum=minimum_lump,
            minimum_offer_periodic=minimum_periodic,
            qualifies_for_cnc=qualifies_cnc,
            cnc_reason=cnc_reason,
            audit_log=self._audit_log,
            methodology_version="vindicate-core-1.0",
            irs_standards_version=IRS_STANDARDS_VERSION,
            warnings=self._warnings,
            recommendations=self._recommendations,
            confidence_level=confidence,
        )

    def _calculate_confidence(self, form: Form433A) -> float:
        """Calculate confidence level based on data completeness."""
        score = 0.0
        max_score = 0.0

        # Personal info completeness
        max_score += 10
        if form.personal_info.first_name and form.personal_info.last_name:
            score += 5
        if form.personal_info.state:
            score += 5

        # Income completeness
        max_score += 20
        if len(form.employment) > 0 or len(form.other_income) > 0:
            score += 10
        if form.total_monthly_gross_income > 0:
            score += 10

        # Expenses completeness
        max_score += 20
        if form.living_expenses.total_monthly_expenses > 0:
            score += 10
        if form.living_expenses.total_housing > 0:
            score += 5
        if form.living_expenses.total_transportation > 0:
            score += 5

        # Assets documented
        max_score += 20
        if len(form.bank_accounts) > 0:
            score += 10
        if len(form.vehicles) > 0 or len(form.real_property) > 0:
            score += 10

        # Tax liability documented
        max_score += 10
        if len(form.tax_periods) > 0:
            score += 10

        # Calculate percentage
        if max_score > 0:
            return round(score / max_score, 2)
        return 0.5  # Default moderate confidence
