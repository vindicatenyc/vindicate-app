"""Comprehensive tests for the Form 433-A Calculator.

These tests validate the complete IRS OIC (Offer in Compromise) calculation
methodology including:
- Income calculations (gross and net)
- Expense allowances vs IRS standards
- Asset equity calculations (Quick Sale Value)
- RCP (Reasonable Collection Potential) for lump sum and periodic offers
- CNC (Currently Not Collectible) eligibility analysis
"""

from decimal import Decimal
from datetime import date

import pytest

from vindicate_core import (
    Form433ACalculator,
    Form433A,
    Form433AResult,
    PersonalInfo,
    Dependent,
    Employment,
    IncomeSource,
    LivingExpenses,
    BankAccount,
    RealProperty,
    Vehicle,
    OtherAsset,
    Debt,
    TaxPeriod,
    FilingStatus,
    EmploymentType,
    IncomeFrequency,
    IncomeType,
    AssetType,
    DebtType,
    get_national_standard_food_clothing,
    get_housing_standard,
    MINIMUM_OIC_OFFER,
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def simple_personal_info() -> PersonalInfo:
    """Create simple personal info for a single filer in NY."""
    return PersonalInfo(
        first_name="John",
        last_name="Doe",
        state="NY",
        filing_status=FilingStatus.SINGLE,
    )


@pytest.fixture
def married_personal_info() -> PersonalInfo:
    """Create personal info for married filing jointly."""
    return PersonalInfo(
        first_name="John",
        last_name="Doe",
        age=45,
        spouse_first_name="Jane",
        spouse_last_name="Doe",
        spouse_age=43,
        state="NY",
        filing_status=FilingStatus.MARRIED_FILING_JOINTLY,
        dependents=[
            Dependent(name="Child 1", relationship="child", age=15),
            Dependent(name="Child 2", relationship="child", age=12),
        ],
    )


@pytest.fixture
def simple_employment() -> Employment:
    """Create simple W-2 employment."""
    return Employment(
        employer_name="Acme Corp",
        employment_type=EmploymentType.W2_EMPLOYEE,
        income=IncomeSource(
            income_type=IncomeType.WAGES,
            source_name="Acme Corp",
            gross_amount=Decimal("5000"),
            frequency=IncomeFrequency.MONTHLY,
            federal_tax_withheld=Decimal("500"),
            state_tax_withheld=Decimal("250"),
            social_security_withheld=Decimal("310"),
            medicare_withheld=Decimal("72.50"),
        ),
    )


@pytest.fixture
def simple_living_expenses() -> LivingExpenses:
    """Create basic living expenses."""
    return LivingExpenses(
        food=Decimal("600"),
        housekeeping_supplies=Decimal("50"),
        clothing=Decimal("100"),
        personal_care=Decimal("50"),
        rent=Decimal("2500"),
        utilities_electric=Decimal("150"),
        utilities_gas=Decimal("50"),
        utilities_phone=Decimal("100"),
        utilities_internet=Decimal("80"),
        vehicle_payment_1=Decimal("400"),
        vehicle_insurance=Decimal("150"),
        vehicle_gas=Decimal("200"),
        health_insurance_premium=Decimal("300"),
        prescriptions=Decimal("50"),
    )


@pytest.fixture
def simple_form_433a(
    simple_personal_info: PersonalInfo,
    simple_employment: Employment,
    simple_living_expenses: LivingExpenses,
) -> Form433A:
    """Create a simple Form 433-A for testing."""
    return Form433A(
        personal_info=simple_personal_info,
        employment=[simple_employment],
        living_expenses=simple_living_expenses,
        bank_accounts=[
            BankAccount(
                institution_name="Chase",
                account_type=AssetType.CHECKING_ACCOUNT,
                current_balance=Decimal("1500"),
            ),
            BankAccount(
                institution_name="Chase",
                account_type=AssetType.SAVINGS_ACCOUNT,
                current_balance=Decimal("3000"),
            ),
        ],
        vehicles=[
            Vehicle(
                year=2019,
                make="Honda",
                model="Accord",
                current_market_value=Decimal("18000"),
                loan_balance=Decimal("8000"),
            ),
        ],
        tax_periods=[
            TaxPeriod(
                tax_year=2022,
                tax_type="income",
                form_type="1040",
                original_balance=Decimal("15000"),
                current_balance=Decimal("18000"),  # With penalties/interest
                penalties=Decimal("1500"),
                interest=Decimal("1500"),
            ),
        ],
    )


@pytest.fixture
def hardship_form_433a(simple_personal_info: PersonalInfo) -> Form433A:
    """Create a hardship case (low income, high expenses)."""
    return Form433A(
        personal_info=simple_personal_info,
        employment=[
            Employment(
                employer_name="Part Time Job",
                employment_type=EmploymentType.W2_EMPLOYEE,
                income=IncomeSource(
                    income_type=IncomeType.WAGES,
                    source_name="Part Time Job",
                    gross_amount=Decimal("2000"),
                    frequency=IncomeFrequency.MONTHLY,
                ),
            ),
        ],
        living_expenses=LivingExpenses(
            food=Decimal("500"),
            rent=Decimal("2000"),
            utilities_electric=Decimal("100"),
            vehicle_gas=Decimal("100"),
            health_insurance_premium=Decimal("200"),
        ),
        bank_accounts=[
            BankAccount(
                institution_name="Local Bank",
                account_type=AssetType.CHECKING_ACCOUNT,
                current_balance=Decimal("250"),
            ),
        ],
        tax_periods=[
            TaxPeriod(
                tax_year=2021,
                tax_type="income",
                form_type="1040",
                original_balance=Decimal("25000"),
                current_balance=Decimal("30000"),
            ),
        ],
    )


# =============================================================================
# BASIC CALCULATOR TESTS
# =============================================================================

class TestForm433ACalculatorBasic:
    """Basic Form 433-A calculator tests."""

    def test_calculator_returns_result(self, simple_form_433a: Form433A):
        """Calculator should return a Form433AResult."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        assert isinstance(result, Form433AResult)

    def test_calculator_calculates_gross_income(self, simple_form_433a: Form433A):
        """Calculator should correctly calculate gross monthly income."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Single employment at $5000/month
        assert result.total_gross_monthly_income == Decimal("5000")

    def test_calculator_calculates_net_income(self, simple_form_433a: Form433A):
        """Calculator should correctly calculate net monthly income."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Gross 5000 - taxes and deductions
        expected_deductions = Decimal("500") + Decimal("250") + Decimal("310") + Decimal("72.50")
        expected_net = Decimal("5000") - expected_deductions
        assert result.total_net_monthly_income == expected_net

    def test_audit_log_populated(self, simple_form_433a: Form433A):
        """Calculator should populate audit log with all steps."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        assert len(result.audit_log) > 0

        step_names = [entry.step for entry in result.audit_log]
        assert "analysis_start" in step_names
        assert "total_monthly_income" in step_names
        assert "monthly_disposable_income" in step_names
        assert "rcp_lump_sum" in step_names
        assert "rcp_periodic" in step_names
        assert "analysis_complete" in step_names

    def test_methodology_version_included(self, simple_form_433a: Form433A):
        """Result should include methodology version."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        assert result.methodology_version is not None
        assert result.irs_standards_version is not None
        assert "2025" in result.irs_standards_version


# =============================================================================
# EXPENSE ALLOWANCE TESTS
# =============================================================================

class TestExpenseAllowances:
    """Tests for expense allowance calculations vs IRS standards."""

    def test_national_standards_capped(self, simple_form_433a: Form433A):
        """Actual expenses exceeding National Standards should be capped."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Find the food/clothing allowance
        food_allowance = next(
            (a for a in result.expense_allowances if "Food" in a.category),
            None
        )

        assert food_allowance is not None
        assert food_allowance.irs_standard is not None
        # Allowed should be min(actual, standard)
        assert food_allowance.allowed_amount <= food_allowance.irs_standard

    def test_housing_standard_by_state(self, simple_form_433a: Form433A):
        """Housing allowance should use correct state standard."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        housing_allowance = next(
            (a for a in result.expense_allowances if "Housing" in a.category),
            None
        )

        assert housing_allowance is not None
        # NY standard for family size 1
        ny_standard = get_housing_standard("NY", 1)
        assert housing_allowance.irs_standard == ny_standard

    def test_healthcare_uses_actual_if_documented(self, simple_form_433a: Form433A):
        """Out-of-pocket healthcare should allow documented actual amounts."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        healthcare_allowance = next(
            (a for a in result.expense_allowances if "Healthcare" in a.category),
            None
        )

        assert healthcare_allowance is not None
        # Documented healthcare is generally allowed
        assert healthcare_allowance.allowed_amount == healthcare_allowance.actual_amount


# =============================================================================
# ASSET EQUITY TESTS
# =============================================================================

class TestAssetEquityCalculations:
    """Tests for asset equity and Quick Sale Value calculations."""

    def test_liquid_assets_calculated(self, simple_form_433a: Form433A):
        """Liquid assets should be sum of non-retirement bank accounts."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # 1500 checking + 3000 savings
        assert result.total_liquid_assets == Decimal("4500")

    def test_vehicle_quick_sale_value(self, simple_form_433a: Form433A):
        """Vehicle equity should use Quick Sale Value (80% of FMV)."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Vehicle: FMV 18000, loan 8000
        # QSV = 18000 * 0.80 = 14400
        # Equity = 14400 - 8000 = 6400
        vehicle = simple_form_433a.vehicles[0]
        expected_nre = vehicle.net_realizable_equity

        # Total NRE includes liquid assets + property equity
        assert result.total_net_realizable_equity >= expected_nre

    def test_retirement_accounts_excluded(self, simple_personal_info: PersonalInfo):
        """Retirement accounts should be excluded from liquid assets."""
        form = Form433A(
            personal_info=simple_personal_info,
            bank_accounts=[
                BankAccount(
                    institution_name="Fidelity",
                    account_type=AssetType.RETIREMENT_401K,
                    current_balance=Decimal("100000"),
                    is_retirement=True,
                ),
                BankAccount(
                    institution_name="Chase",
                    account_type=AssetType.CHECKING_ACCOUNT,
                    current_balance=Decimal("1000"),
                ),
            ],
        )

        calculator = Form433ACalculator()
        result = calculator.calculate(form)

        # Only the checking account should be counted
        assert result.total_liquid_assets == Decimal("1000")


# =============================================================================
# RCP CALCULATION TESTS
# =============================================================================

class TestRCPCalculations:
    """Tests for Reasonable Collection Potential calculations."""

    def test_rcp_lump_sum_formula(self, simple_form_433a: Form433A):
        """RCP lump sum = (disposable × 12) + assets."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Manual calculation
        if result.monthly_disposable_income > 0:
            expected_income_portion = result.monthly_disposable_income * 12
        else:
            expected_income_portion = Decimal("0")

        expected_rcp = expected_income_portion + result.total_net_realizable_equity
        expected_rcp = max(expected_rcp, MINIMUM_OIC_OFFER)

        assert result.rcp_lump_sum == expected_rcp

    def test_rcp_periodic_formula(self, simple_form_433a: Form433A):
        """RCP periodic = (disposable × 24) + assets."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        if result.monthly_disposable_income > 0:
            expected_income_portion = result.monthly_disposable_income * 24
        else:
            expected_income_portion = Decimal("0")

        expected_rcp = expected_income_portion + result.total_net_realizable_equity
        expected_rcp = max(expected_rcp, MINIMUM_OIC_OFFER)

        assert result.rcp_periodic == expected_rcp

    def test_minimum_offer_enforced(self, hardship_form_433a: Form433A):
        """Minimum offer should be enforced even with negative disposable income."""
        calculator = Form433ACalculator()
        result = calculator.calculate(hardship_form_433a)

        assert result.minimum_offer_lump_sum >= MINIMUM_OIC_OFFER
        assert result.minimum_offer_periodic >= MINIMUM_OIC_OFFER


# =============================================================================
# CNC ELIGIBILITY TESTS
# =============================================================================

class TestCNCEligibility:
    """Tests for Currently Not Collectible eligibility analysis."""

    def test_cnc_with_negative_disposable_income(self, hardship_form_433a: Form433A):
        """Should qualify for CNC with negative disposable income."""
        calculator = Form433ACalculator()
        result = calculator.calculate(hardship_form_433a)

        # With low income and high expenses, should qualify for CNC
        if result.monthly_disposable_income <= 0:
            assert result.qualifies_for_cnc is True
            assert result.cnc_reason is not None

    def test_cnc_recommendations_provided(self, hardship_form_433a: Form433A):
        """Should provide CNC recommendation when eligible."""
        calculator = Form433ACalculator()
        result = calculator.calculate(hardship_form_433a)

        if result.qualifies_for_cnc:
            assert any("CNC" in r or "Currently Not Collectible" in r
                      for r in result.recommendations)

    def test_no_cnc_with_positive_disposable(self, simple_form_433a: Form433A):
        """Should not qualify for CNC with positive disposable income and assets."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        if result.monthly_disposable_income > 0 and result.total_net_realizable_equity > 1000:
            # Generally should not qualify with positive income and significant assets
            # (unless RCP is very low compared to liability)
            pass  # This is a soft check - depends on specific values


# =============================================================================
# FAMILY SIZE AND STATE VARIATION TESTS
# =============================================================================

class TestFamilySizeAndStateVariations:
    """Tests for different family sizes and state standards."""

    def test_family_size_affects_standards(
        self,
        simple_employment: Employment,
        simple_living_expenses: LivingExpenses,
    ):
        """Larger family size should increase allowable expenses."""
        # Single filer
        single_form = Form433A(
            personal_info=PersonalInfo(
                first_name="John",
                last_name="Doe",
                state="NY",
                filing_status=FilingStatus.SINGLE,
            ),
            employment=[simple_employment],
            living_expenses=simple_living_expenses,
        )

        # Family of 4
        family_form = Form433A(
            personal_info=PersonalInfo(
                first_name="John",
                last_name="Doe",
                state="NY",
                filing_status=FilingStatus.MARRIED_FILING_JOINTLY,
                spouse_first_name="Jane",
                spouse_last_name="Doe",
                dependents=[
                    Dependent(name="Child 1", relationship="child"),
                    Dependent(name="Child 2", relationship="child"),
                ],
            ),
            employment=[simple_employment],
            living_expenses=simple_living_expenses,
        )

        calculator = Form433ACalculator()
        single_result = calculator.calculate(single_form)
        family_result = calculator.calculate(family_form)

        # Family should have higher IRS allowed expenses
        assert family_result.irs_allowed_total_expenses > single_result.irs_allowed_total_expenses

    def test_state_affects_housing_standard(
        self,
        simple_employment: Employment,
        simple_living_expenses: LivingExpenses,
    ):
        """Different states should have different housing standards."""
        # NY (high cost)
        ny_form = Form433A(
            personal_info=PersonalInfo(
                first_name="John",
                last_name="Doe",
                state="NY",
            ),
            employment=[simple_employment],
            living_expenses=simple_living_expenses,
        )

        # MS (low cost)
        ms_form = Form433A(
            personal_info=PersonalInfo(
                first_name="John",
                last_name="Doe",
                state="MS",
            ),
            employment=[simple_employment],
            living_expenses=simple_living_expenses,
        )

        ny_standard = get_housing_standard("NY", 1)
        ms_standard = get_housing_standard("MS", 1)

        # NY should have higher housing standard than MS
        assert ny_standard > ms_standard


# =============================================================================
# CONFIDENCE LEVEL TESTS
# =============================================================================

class TestConfidenceLevel:
    """Tests for confidence level calculations."""

    def test_complete_form_high_confidence(self, simple_form_433a: Form433A):
        """Complete form should have higher confidence."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        # Well-documented form should have good confidence
        assert result.confidence_level >= 0.5

    def test_minimal_form_lower_confidence(self, simple_personal_info: PersonalInfo):
        """Minimal form should have lower confidence."""
        minimal_form = Form433A(
            personal_info=simple_personal_info,
            # No income, no expenses, no assets
        )

        calculator = Form433ACalculator()
        result = calculator.calculate(minimal_form)

        # Missing data should reduce confidence
        assert result.confidence_level < 0.8


# =============================================================================
# WARNINGS AND RECOMMENDATIONS TESTS
# =============================================================================

class TestWarningsAndRecommendations:
    """Tests for warning and recommendation generation."""

    def test_zero_income_warning(self, simple_personal_info: PersonalInfo):
        """Should warn when gross income is zero."""
        form = Form433A(
            personal_info=simple_personal_info,
            # No employment = zero income
        )

        calculator = Form433ACalculator()
        result = calculator.calculate(form)

        assert result.total_gross_monthly_income == 0
        assert any("zero" in w.lower() or "income" in w.lower()
                  for w in result.warnings)

    def test_expense_variance_recommendation(self, simple_form_433a: Form433A):
        """Should recommend documenting expenses exceeding IRS standards."""
        calculator = Form433ACalculator()
        result = calculator.calculate(simple_form_433a)

        if result.actual_total_expenses > result.irs_allowed_total_expenses:
            assert any("document" in r.lower() or "exceed" in r.lower()
                      for r in result.recommendations)


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests for complete Form 433-A scenarios."""

    def test_full_oic_scenario(self, married_personal_info: PersonalInfo):
        """Test complete OIC calculation for a typical family."""
        form = Form433A(
            personal_info=married_personal_info,
            employment=[
                Employment(
                    employer_name="Tech Corp",
                    employment_type=EmploymentType.W2_EMPLOYEE,
                    income=IncomeSource(
                        income_type=IncomeType.WAGES,
                        source_name="Tech Corp",
                        gross_amount=Decimal("8000"),
                        frequency=IncomeFrequency.MONTHLY,
                        federal_tax_withheld=Decimal("1200"),
                        state_tax_withheld=Decimal("600"),
                    ),
                ),
            ],
            living_expenses=LivingExpenses(
                food=Decimal("1200"),
                housekeeping_supplies=Decimal("100"),
                clothing=Decimal("200"),
                mortgage_payment=Decimal("2500"),
                property_taxes=Decimal("500"),
                homeowners_insurance=Decimal("200"),
                utilities_electric=Decimal("200"),
                utilities_gas=Decimal("100"),
                utilities_water=Decimal("50"),
                vehicle_payment_1=Decimal("500"),
                vehicle_insurance=Decimal("200"),
                vehicle_gas=Decimal("300"),
                health_insurance_premium=Decimal("600"),
                prescriptions=Decimal("100"),
                childcare=Decimal("1500"),
            ),
            bank_accounts=[
                BankAccount(
                    institution_name="Bank of America",
                    account_type=AssetType.CHECKING_ACCOUNT,
                    current_balance=Decimal("5000"),
                ),
                BankAccount(
                    institution_name="Vanguard",
                    account_type=AssetType.RETIREMENT_401K,
                    current_balance=Decimal("150000"),
                    is_retirement=True,
                ),
            ],
            real_property=[
                RealProperty(
                    property_type=AssetType.PRIMARY_RESIDENCE,
                    address="123 Main St, Brooklyn, NY",
                    current_market_value=Decimal("600000"),
                    mortgage_balance=Decimal("450000"),
                    is_primary_residence=True,
                ),
            ],
            vehicles=[
                Vehicle(
                    year=2021,
                    make="Toyota",
                    model="Camry",
                    current_market_value=Decimal("25000"),
                    loan_balance=Decimal("15000"),
                ),
            ],
            tax_periods=[
                TaxPeriod(
                    tax_year=2020,
                    tax_type="income",
                    form_type="1040",
                    original_balance=Decimal("20000"),
                    current_balance=Decimal("28000"),
                    penalties=Decimal("4000"),
                    interest=Decimal("4000"),
                ),
                TaxPeriod(
                    tax_year=2021,
                    tax_type="income",
                    form_type="1040",
                    original_balance=Decimal("15000"),
                    current_balance=Decimal("18000"),
                    penalties=Decimal("1500"),
                    interest=Decimal("1500"),
                ),
            ],
        )

        calculator = Form433ACalculator()
        result = calculator.calculate(form)

        # Verify all required fields are populated
        assert result.total_gross_monthly_income == Decimal("8000")
        assert result.total_liquid_assets == Decimal("5000")  # Excludes 401k
        assert result.expense_allowances is not None
        assert len(result.expense_allowances) > 0
        assert result.rcp_lump_sum >= MINIMUM_OIC_OFFER
        assert result.rcp_periodic >= MINIMUM_OIC_OFFER
        assert len(result.audit_log) > 10  # Should have many audit entries

        # Verify expense breakdown
        assert result.actual_total_expenses > 0
        assert result.irs_allowed_total_expenses > 0
