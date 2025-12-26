"""Core data models for IRS Form 433-A financial calculations.

This module implements the complete data structures required for
IRS Form 433-A (Collection Information Statement for Wage Earners
and Self-Employed Individuals).

Reference: https://www.irs.gov/pub/irs-pdf/f433a.pdf
"""

from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, Annotated
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# ENUMERATIONS
# =============================================================================

class FilingStatus(str, Enum):
    """IRS filing status options."""
    SINGLE = "single"
    MARRIED_FILING_JOINTLY = "married_filing_jointly"
    MARRIED_FILING_SEPARATELY = "married_filing_separately"
    HEAD_OF_HOUSEHOLD = "head_of_household"
    QUALIFYING_WIDOW = "qualifying_widow"


class EmploymentType(str, Enum):
    """Type of employment."""
    W2_EMPLOYEE = "w2_employee"
    SELF_EMPLOYED = "self_employed"
    CONTRACTOR_1099 = "contractor_1099"
    UNEMPLOYED = "unemployed"
    RETIRED = "retired"
    DISABLED = "disabled"


class IncomeFrequency(str, Enum):
    """Frequency of income payments."""
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    SEMI_MONTHLY = "semi_monthly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    ONE_TIME = "one_time"


class IncomeType(str, Enum):
    """Types of income per Form 433-A."""
    WAGES = "wages"
    SELF_EMPLOYMENT = "self_employment"
    SOCIAL_SECURITY = "social_security"
    PENSION = "pension"
    CHILD_SUPPORT_RECEIVED = "child_support_received"
    ALIMONY_RECEIVED = "alimony_received"
    RENTAL_INCOME = "rental_income"
    INTEREST_DIVIDENDS = "interest_dividends"
    UNEMPLOYMENT = "unemployment"
    DISABILITY = "disability"
    OTHER = "other"


class ExpenseCategory(str, Enum):
    """IRS expense categories for OIC calculations.

    These map to the allowable living expenses on Form 433-A.
    """
    # National Standards
    FOOD_CLOTHING_MISC = "food_clothing_misc"  # Food, clothing, housekeeping, personal care

    # Local Standards - Housing
    HOUSING_RENT = "housing_rent"
    HOUSING_MORTGAGE = "housing_mortgage"
    PROPERTY_TAX = "property_tax"
    HOMEOWNERS_INSURANCE = "homeowners_insurance"
    HOA_FEES = "hoa_fees"
    UTILITIES = "utilities"  # Gas, electric, water, heating oil, trash, cable, internet, phone

    # Local Standards - Transportation
    VEHICLE_PAYMENT = "vehicle_payment"
    VEHICLE_OPERATING = "vehicle_operating"  # Gas, insurance, maintenance, registration
    PUBLIC_TRANSPORTATION = "public_transportation"
    PARKING = "parking"
    TOLLS = "tolls"

    # Out-of-Pocket Healthcare
    HEALTH_INSURANCE = "health_insurance"
    OUT_OF_POCKET_HEALTHCARE = "out_of_pocket_healthcare"
    PRESCRIPTION_MEDICATIONS = "prescription_medications"

    # Court-Ordered Payments
    CHILD_SUPPORT_PAID = "child_support_paid"
    ALIMONY_PAID = "alimony_paid"

    # Other Necessary Expenses
    CHILDCARE = "childcare"
    DEPENDENT_CARE = "dependent_care"
    LIFE_INSURANCE = "life_insurance"
    CURRENT_TAX_PAYMENTS = "current_tax_payments"  # Estimated taxes, withholding
    SECURED_DEBT = "secured_debt"  # Court-ordered or IRS-approved
    PROFESSIONAL_DUES = "professional_dues"
    UNION_DUES = "union_dues"
    STUDENT_LOANS_FEDERAL = "student_loans_federal"  # IBR/PAYE payments

    # Other (require justification)
    OTHER_NECESSARY = "other_necessary"

    # Legacy categories for backwards compatibility
    HOUSING = "housing"
    FOOD = "food"
    TRANSPORTATION = "transportation"
    HEALTHCARE = "healthcare"
    TAXES = "taxes"
    COURT_ORDERED = "court_ordered"


class AssetType(str, Enum):
    """Types of assets per Form 433-A."""
    # Cash and Investments
    CASH = "cash"
    CHECKING_ACCOUNT = "checking_account"
    SAVINGS_ACCOUNT = "savings_account"
    MONEY_MARKET = "money_market"
    INVESTMENT_ACCOUNT = "investment_account"
    STOCKS = "stocks"
    BONDS = "bonds"
    MUTUAL_FUNDS = "mutual_funds"
    CRYPTOCURRENCY = "cryptocurrency"

    # Retirement (generally exempt)
    IRA = "ira"
    ROTH_IRA = "roth_ira"
    RETIREMENT_401K = "retirement_401k"
    PENSION = "pension"

    # Real Property
    PRIMARY_RESIDENCE = "primary_residence"
    RENTAL_PROPERTY = "rental_property"
    VACANT_LAND = "vacant_land"
    COMMERCIAL_PROPERTY = "commercial_property"

    # Personal Property
    VEHICLE = "vehicle"
    RECREATIONAL_VEHICLE = "recreational_vehicle"
    BOAT = "boat"
    JEWELRY = "jewelry"
    ART_COLLECTIBLES = "art_collectibles"
    FURNITURE = "furniture"
    ELECTRONICS = "electronics"

    # Business Assets
    BUSINESS_EQUIPMENT = "business_equipment"
    BUSINESS_INVENTORY = "business_inventory"
    ACCOUNTS_RECEIVABLE = "accounts_receivable"

    # Life Insurance
    LIFE_INSURANCE_CASH_VALUE = "life_insurance_cash_value"

    # Other
    OTHER = "other"


class DebtType(str, Enum):
    """Types of debt/liability."""
    MORTGAGE = "mortgage"
    HOME_EQUITY = "home_equity"
    AUTO_LOAN = "auto_loan"
    CREDIT_CARD = "credit_card"
    PERSONAL_LOAN = "personal_loan"
    STUDENT_LOAN_FEDERAL = "student_loan_federal"
    STUDENT_LOAN_PRIVATE = "student_loan_private"
    MEDICAL_DEBT = "medical_debt"
    COLLECTION_ACCOUNT = "collection_account"
    JUDGMENT = "judgment"
    TAX_DEBT_FEDERAL = "tax_debt_federal"
    TAX_DEBT_STATE = "tax_debt_state"
    CHILD_SUPPORT_ARREARS = "child_support_arrears"
    ALIMONY_ARREARS = "alimony_arrears"
    BUSINESS_DEBT = "business_debt"
    OTHER = "other"


class USRegion(str, Enum):
    """IRS regions for transportation standards."""
    NORTHEAST = "northeast"
    MIDWEST = "midwest"
    SOUTH = "south"
    WEST = "west"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_region_for_state(state: str) -> USRegion:
    """Get the IRS region for a state (for transportation standards)."""
    northeast = {"CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"}
    midwest = {"IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"}
    south = {"AL", "AR", "DE", "DC", "FL", "GA", "KY", "LA", "MD", "MS", "NC", "OK", "SC", "TN", "TX", "VA", "WV"}
    # West is everything else

    if state in northeast:
        return USRegion.NORTHEAST
    elif state in midwest:
        return USRegion.MIDWEST
    elif state in south:
        return USRegion.SOUTH
    else:
        return USRegion.WEST


# =============================================================================
# PERSONAL INFORMATION MODELS
# =============================================================================

class Dependent(BaseModel):
    """A dependent for tax purposes."""
    name: str
    relationship: str  # child, parent, other
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    ssn_last_four: Optional[str] = None
    is_disabled: bool = False
    lives_with_taxpayer: bool = True


class PersonalInfo(BaseModel):
    """Personal information section of Form 433-A."""
    first_name: str
    last_name: str
    ssn_last_four: Optional[str] = None  # We only store last 4 for security
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    filing_status: FilingStatus = FilingStatus.SINGLE

    # Spouse info if married
    spouse_first_name: Optional[str] = None
    spouse_last_name: Optional[str] = None
    spouse_ssn_last_four: Optional[str] = None
    spouse_date_of_birth: Optional[date] = None
    spouse_age: Optional[int] = None

    # Address
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: str = Field(default="NY", pattern="^[A-Z]{2}$")
    zip_code: Optional[str] = None
    county: Optional[str] = None  # Needed for some local standards

    # Contact
    phone: Optional[str] = None
    email: Optional[str] = None

    # Household
    dependents: list[Dependent] = Field(default_factory=list)

    @property
    def family_size(self) -> int:
        """Total household size for IRS standards."""
        size = 1  # Taxpayer
        if self.filing_status in [FilingStatus.MARRIED_FILING_JOINTLY, FilingStatus.MARRIED_FILING_SEPARATELY]:
            size += 1
        size += len(self.dependents)
        return size

    @property
    def ages_65_or_over(self) -> int:
        """Count of household members 65 or over (for healthcare standards)."""
        count = 0
        if self.age and self.age >= 65:
            count += 1
        if self.spouse_age and self.spouse_age >= 65:
            count += 1
        for dep in self.dependents:
            if dep.age and dep.age >= 65:
                count += 1
        return count


# =============================================================================
# INCOME MODELS
# =============================================================================

class IncomeSource(BaseModel):
    """A source of income."""
    income_type: IncomeType
    source_name: str  # Employer name, payer name, etc.
    gross_amount: Decimal = Field(ge=0)
    frequency: IncomeFrequency = IncomeFrequency.MONTHLY

    # Deductions (for wages)
    federal_tax_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    state_tax_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    local_tax_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    social_security_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    medicare_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    health_insurance_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    retirement_contribution: Decimal = Field(default=Decimal("0"), ge=0)
    union_dues_withheld: Decimal = Field(default=Decimal("0"), ge=0)
    other_deductions: Decimal = Field(default=Decimal("0"), ge=0)

    # For self-employment
    business_expenses: Decimal = Field(default=Decimal("0"), ge=0)

    # Documentation
    documentation_type: Optional[str] = None  # pay_stub, 1099, w2, etc.

    @property
    def net_amount(self) -> Decimal:
        """Net amount after deductions."""
        total_deductions = (
            self.federal_tax_withheld + self.state_tax_withheld +
            self.local_tax_withheld + self.social_security_withheld +
            self.medicare_withheld + self.health_insurance_withheld +
            self.retirement_contribution + self.union_dues_withheld +
            self.other_deductions
        )
        return self.gross_amount - total_deductions - self.business_expenses

    @property
    def monthly_gross(self) -> Decimal:
        """Convert to monthly gross amount."""
        multipliers = {
            IncomeFrequency.WEEKLY: Decimal("4.333"),
            IncomeFrequency.BI_WEEKLY: Decimal("2.167"),
            IncomeFrequency.SEMI_MONTHLY: Decimal("2"),
            IncomeFrequency.MONTHLY: Decimal("1"),
            IncomeFrequency.QUARTERLY: Decimal("0.333"),
            IncomeFrequency.ANNUALLY: Decimal("0.0833"),
            IncomeFrequency.ONE_TIME: Decimal("0"),  # Excluded from monthly
        }
        return self.gross_amount * multipliers.get(self.frequency, Decimal("1"))

    @property
    def monthly_net(self) -> Decimal:
        """Convert to monthly net amount."""
        multipliers = {
            IncomeFrequency.WEEKLY: Decimal("4.333"),
            IncomeFrequency.BI_WEEKLY: Decimal("2.167"),
            IncomeFrequency.SEMI_MONTHLY: Decimal("2"),
            IncomeFrequency.MONTHLY: Decimal("1"),
            IncomeFrequency.QUARTERLY: Decimal("0.333"),
            IncomeFrequency.ANNUALLY: Decimal("0.0833"),
            IncomeFrequency.ONE_TIME: Decimal("0"),
        }
        return self.net_amount * multipliers.get(self.frequency, Decimal("1"))


class Employment(BaseModel):
    """Employment information."""
    employer_name: str
    employer_address: Optional[str] = None
    employer_phone: Optional[str] = None
    employment_type: EmploymentType
    occupation: Optional[str] = None
    years_employed: Optional[Decimal] = None

    # Income details
    income: IncomeSource


# =============================================================================
# EXPENSE MODELS
# =============================================================================

class Expense(BaseModel):
    """A monthly expense item."""
    category: ExpenseCategory
    amount: Decimal = Field(ge=0)
    description: str
    is_necessary: bool = True
    documentation_type: Optional[str] = None

    # For IRS comparison
    irs_standard_amount: Optional[Decimal] = None
    allowed_amount: Optional[Decimal] = None
    variance_notes: Optional[str] = None


class LivingExpenses(BaseModel):
    """Complete living expenses breakdown per Form 433-A Section 5."""

    # National Standards (Food, Clothing, Misc)
    food: Decimal = Field(default=Decimal("0"), ge=0)
    housekeeping_supplies: Decimal = Field(default=Decimal("0"), ge=0)
    clothing: Decimal = Field(default=Decimal("0"), ge=0)
    personal_care: Decimal = Field(default=Decimal("0"), ge=0)
    miscellaneous: Decimal = Field(default=Decimal("0"), ge=0)

    # Housing and Utilities
    rent: Decimal = Field(default=Decimal("0"), ge=0)
    mortgage_payment: Decimal = Field(default=Decimal("0"), ge=0)
    property_taxes: Decimal = Field(default=Decimal("0"), ge=0)
    homeowners_insurance: Decimal = Field(default=Decimal("0"), ge=0)
    hoa_condo_fees: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_electric: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_gas: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_water: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_trash: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_phone: Decimal = Field(default=Decimal("0"), ge=0)  # Landline
    utilities_cell: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_internet: Decimal = Field(default=Decimal("0"), ge=0)
    utilities_cable: Decimal = Field(default=Decimal("0"), ge=0)

    # Transportation
    vehicle_payment_1: Decimal = Field(default=Decimal("0"), ge=0)
    vehicle_payment_2: Decimal = Field(default=Decimal("0"), ge=0)
    vehicle_insurance: Decimal = Field(default=Decimal("0"), ge=0)
    vehicle_gas: Decimal = Field(default=Decimal("0"), ge=0)
    vehicle_maintenance: Decimal = Field(default=Decimal("0"), ge=0)
    vehicle_registration: Decimal = Field(default=Decimal("0"), ge=0)
    public_transportation: Decimal = Field(default=Decimal("0"), ge=0)
    parking_tolls: Decimal = Field(default=Decimal("0"), ge=0)

    # Healthcare
    health_insurance_premium: Decimal = Field(default=Decimal("0"), ge=0)
    out_of_pocket_medical: Decimal = Field(default=Decimal("0"), ge=0)
    prescriptions: Decimal = Field(default=Decimal("0"), ge=0)
    dental_vision: Decimal = Field(default=Decimal("0"), ge=0)

    # Court-Ordered Payments
    child_support_paid: Decimal = Field(default=Decimal("0"), ge=0)
    alimony_paid: Decimal = Field(default=Decimal("0"), ge=0)

    # Childcare/Dependent Care
    childcare: Decimal = Field(default=Decimal("0"), ge=0)
    dependent_care: Decimal = Field(default=Decimal("0"), ge=0)

    # Other Necessary
    life_insurance: Decimal = Field(default=Decimal("0"), ge=0)
    estimated_tax_payments: Decimal = Field(default=Decimal("0"), ge=0)
    student_loan_payment: Decimal = Field(default=Decimal("0"), ge=0)
    professional_dues: Decimal = Field(default=Decimal("0"), ge=0)
    union_dues: Decimal = Field(default=Decimal("0"), ge=0)

    # Other expenses (require documentation/justification)
    other_expenses: list[Expense] = Field(default_factory=list)

    @property
    def total_national_standards(self) -> Decimal:
        """Total for food/clothing/misc (National Standards)."""
        return (self.food + self.housekeeping_supplies + self.clothing +
                self.personal_care + self.miscellaneous)

    @property
    def total_housing(self) -> Decimal:
        """Total housing and utilities expenses."""
        return (self.rent + self.mortgage_payment + self.property_taxes +
                self.homeowners_insurance + self.hoa_condo_fees +
                self.utilities_electric + self.utilities_gas + self.utilities_water +
                self.utilities_trash + self.utilities_phone + self.utilities_cell +
                self.utilities_internet + self.utilities_cable)

    @property
    def total_transportation(self) -> Decimal:
        """Total transportation expenses."""
        return (self.vehicle_payment_1 + self.vehicle_payment_2 +
                self.vehicle_insurance + self.vehicle_gas + self.vehicle_maintenance +
                self.vehicle_registration + self.public_transportation + self.parking_tolls)

    @property
    def total_healthcare(self) -> Decimal:
        """Total healthcare expenses."""
        return (self.health_insurance_premium + self.out_of_pocket_medical +
                self.prescriptions + self.dental_vision)

    @property
    def total_court_ordered(self) -> Decimal:
        """Total court-ordered payments."""
        return self.child_support_paid + self.alimony_paid

    @property
    def total_other_necessary(self) -> Decimal:
        """Total other necessary expenses."""
        base = (self.childcare + self.dependent_care + self.life_insurance +
                self.estimated_tax_payments + self.student_loan_payment +
                self.professional_dues + self.union_dues)
        other = sum(e.amount for e in self.other_expenses)
        return base + other

    @property
    def total_monthly_expenses(self) -> Decimal:
        """Total of all monthly living expenses."""
        return (self.total_national_standards + self.total_housing +
                self.total_transportation + self.total_healthcare +
                self.total_court_ordered + self.total_other_necessary)


# =============================================================================
# ASSET MODELS
# =============================================================================

class BankAccount(BaseModel):
    """Bank or financial account."""
    institution_name: str
    account_type: AssetType
    account_number_last_four: Optional[str] = None
    current_balance: Decimal = Field(ge=0)
    is_joint: bool = False

    # For investment accounts
    is_retirement: bool = False
    early_withdrawal_penalty: Optional[Decimal] = None


class RealProperty(BaseModel):
    """Real property (real estate)."""
    property_type: AssetType
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

    # Values
    current_market_value: Decimal = Field(ge=0)
    mortgage_balance: Decimal = Field(default=Decimal("0"), ge=0)
    other_liens: Decimal = Field(default=Decimal("0"), ge=0)

    # Costs to sell (typically 20% for IRS quick sale value)
    estimated_selling_costs: Optional[Decimal] = None

    # Monthly expenses
    monthly_payment: Decimal = Field(default=Decimal("0"), ge=0)
    monthly_rental_income: Decimal = Field(default=Decimal("0"), ge=0)

    # Ownership
    ownership_percentage: Decimal = Field(default=Decimal("100"), ge=0, le=100)
    is_primary_residence: bool = False
    date_purchased: Optional[date] = None
    purchase_price: Optional[Decimal] = None

    @property
    def gross_equity(self) -> Decimal:
        """Gross equity before selling costs."""
        return self.current_market_value - self.mortgage_balance - self.other_liens

    @property
    def quick_sale_value(self) -> Decimal:
        """IRS Quick Sale Value (80% of FMV)."""
        return self.current_market_value * Decimal("0.80")

    @property
    def net_realizable_equity(self) -> Decimal:
        """Net equity after quick sale value and costs."""
        qsv = self.quick_sale_value
        selling_costs = self.estimated_selling_costs or (qsv * Decimal("0.10"))
        equity = qsv - self.mortgage_balance - self.other_liens - selling_costs
        # Apply ownership percentage
        equity = equity * (self.ownership_percentage / Decimal("100"))
        return max(Decimal("0"), equity)


class Vehicle(BaseModel):
    """Vehicle asset."""
    year: int
    make: str
    model: str
    mileage: Optional[int] = None
    vin_last_six: Optional[str] = None

    # Values
    current_market_value: Decimal = Field(ge=0)
    loan_balance: Decimal = Field(default=Decimal("0"), ge=0)

    # Ownership
    ownership_percentage: Decimal = Field(default=Decimal("100"), ge=0, le=100)
    is_leased: bool = False
    monthly_payment: Decimal = Field(default=Decimal("0"), ge=0)

    # Usage
    is_business_use: bool = False
    business_use_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    @property
    def description(self) -> str:
        return f"{self.year} {self.make} {self.model}"

    @property
    def quick_sale_value(self) -> Decimal:
        """IRS Quick Sale Value (80% of FMV)."""
        return self.current_market_value * Decimal("0.80")

    @property
    def net_realizable_equity(self) -> Decimal:
        """Net equity in vehicle."""
        equity = self.quick_sale_value - self.loan_balance
        equity = equity * (self.ownership_percentage / Decimal("100"))
        return max(Decimal("0"), equity)


class OtherAsset(BaseModel):
    """Other personal property or asset."""
    asset_type: AssetType
    description: str
    current_market_value: Decimal = Field(ge=0)
    loan_balance: Decimal = Field(default=Decimal("0"), ge=0)

    # For life insurance
    cash_surrender_value: Optional[Decimal] = None
    policy_loan_balance: Optional[Decimal] = None

    ownership_percentage: Decimal = Field(default=Decimal("100"), ge=0, le=100)

    @property
    def quick_sale_value(self) -> Decimal:
        """IRS Quick Sale Value (80% of FMV)."""
        return self.current_market_value * Decimal("0.80")

    @property
    def net_realizable_equity(self) -> Decimal:
        """Net realizable equity."""
        if self.cash_surrender_value is not None:
            # Life insurance uses cash surrender value
            equity = self.cash_surrender_value - (self.policy_loan_balance or Decimal("0"))
        else:
            equity = self.quick_sale_value - self.loan_balance
        equity = equity * (self.ownership_percentage / Decimal("100"))
        return max(Decimal("0"), equity)


# =============================================================================
# DEBT/LIABILITY MODELS
# =============================================================================

class Debt(BaseModel):
    """A debt or liability."""
    debt_type: DebtType = DebtType.OTHER
    creditor_name: str
    account_number_last_four: Optional[str] = None

    original_balance: Optional[Decimal] = None
    current_balance: Decimal = Field(default=Decimal("0"), ge=0)
    total_balance: Optional[Decimal] = Field(default=None, ge=0)  # Legacy alias
    monthly_payment: Decimal = Field(default=Decimal("0"), ge=0)
    interest_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    def model_post_init(self, __context) -> None:
        """Handle legacy total_balance field."""
        if self.total_balance is not None and self.current_balance == Decimal("0"):
            object.__setattr__(self, 'current_balance', self.total_balance)

    # Status
    is_delinquent: bool = False
    months_delinquent: int = 0
    is_in_collection: bool = False

    # Secured debt info
    is_secured: bool = False
    collateral_description: Optional[str] = None
    collateral_value: Optional[Decimal] = None

    # Court judgments
    is_judgment: bool = False
    judgment_date: Optional[date] = None
    judgment_creditor: Optional[str] = None

    # For IRS calculations
    is_priority_debt: bool = False  # Student loans, child support, etc.
    is_irs_approved_payment: bool = False


# =============================================================================
# TAX LIABILITY MODELS
# =============================================================================

class TaxPeriod(BaseModel):
    """A tax period with liability."""
    tax_year: int
    tax_type: str  # "income", "payroll", "business"
    form_type: str  # "1040", "941", etc.

    original_balance: Decimal = Field(ge=0)
    current_balance: Decimal = Field(ge=0)
    penalties: Decimal = Field(default=Decimal("0"), ge=0)
    interest: Decimal = Field(default=Decimal("0"), ge=0)

    # Status
    return_filed: bool = True
    is_assessed: bool = True
    collection_statute_expiration: Optional[date] = None  # CSED

    # Payments/Credits
    withholding_credits: Decimal = Field(default=Decimal("0"), ge=0)
    estimated_payments: Decimal = Field(default=Decimal("0"), ge=0)
    other_credits: Decimal = Field(default=Decimal("0"), ge=0)


# =============================================================================
# MAIN FORM 433-A MODEL
# =============================================================================

class Form433A(BaseModel):
    """Complete IRS Form 433-A data structure.

    This represents all information collected on Form 433-A,
    Collection Information Statement for Wage Earners and Self-Employed Individuals.
    """

    # Metadata
    form_version: str = "433-A (Rev. 4-2024)"
    prepared_date: datetime = Field(default_factory=datetime.utcnow)

    # Section 1: Personal Information
    personal_info: PersonalInfo

    # Section 2: Employment Information
    employment: list[Employment] = Field(default_factory=list)
    spouse_employment: list[Employment] = Field(default_factory=list)

    # Section 3: Other Income
    other_income: list[IncomeSource] = Field(default_factory=list)
    spouse_other_income: list[IncomeSource] = Field(default_factory=list)

    # Section 4: Assets
    bank_accounts: list[BankAccount] = Field(default_factory=list)
    real_property: list[RealProperty] = Field(default_factory=list)
    vehicles: list[Vehicle] = Field(default_factory=list)
    other_assets: list[OtherAsset] = Field(default_factory=list)

    # Section 5: Living Expenses
    living_expenses: LivingExpenses = Field(default_factory=LivingExpenses)

    # Section 6: Other Liabilities
    debts: list[Debt] = Field(default_factory=list)

    # Tax Liabilities (what they owe)
    tax_periods: list[TaxPeriod] = Field(default_factory=list)

    # Notes and documentation
    notes: Optional[str] = None

    @property
    def total_monthly_gross_income(self) -> Decimal:
        """Total monthly gross income from all sources."""
        total = Decimal("0")

        # Employment income
        for emp in self.employment:
            total += emp.income.monthly_gross
        for emp in self.spouse_employment:
            total += emp.income.monthly_gross

        # Other income
        for inc in self.other_income:
            total += inc.monthly_gross
        for inc in self.spouse_other_income:
            total += inc.monthly_gross

        return total

    @property
    def total_monthly_net_income(self) -> Decimal:
        """Total monthly net income after deductions."""
        total = Decimal("0")

        for emp in self.employment:
            total += emp.income.monthly_net
        for emp in self.spouse_employment:
            total += emp.income.monthly_net

        for inc in self.other_income:
            total += inc.monthly_net
        for inc in self.spouse_other_income:
            total += inc.monthly_net

        return total

    @property
    def total_liquid_assets(self) -> Decimal:
        """Total liquid assets (cash, bank accounts)."""
        total = Decimal("0")
        for account in self.bank_accounts:
            if not account.is_retirement:
                total += account.current_balance
        return total

    @property
    def total_asset_equity(self) -> Decimal:
        """Total net realizable equity in all assets."""
        total = Decimal("0")

        # Real property
        for prop in self.real_property:
            total += prop.net_realizable_equity

        # Vehicles
        for vehicle in self.vehicles:
            total += vehicle.net_realizable_equity

        # Other assets
        for asset in self.other_assets:
            total += asset.net_realizable_equity

        return total

    @property
    def total_debt_payments(self) -> Decimal:
        """Total monthly debt payments (excluding mortgage/rent)."""
        return sum(d.monthly_payment for d in self.debts)

    @property
    def total_tax_liability(self) -> Decimal:
        """Total tax liability across all periods."""
        return sum(tp.current_balance for tp in self.tax_periods)


# =============================================================================
# CALCULATION RESULT MODELS
# =============================================================================

class ExpenseAllowance(BaseModel):
    """Comparison of actual expense to IRS allowance."""
    category: str
    actual_amount: Decimal
    irs_standard: Optional[Decimal]
    allowed_amount: Decimal
    variance: Decimal
    notes: Optional[str] = None


class AuditEntry(BaseModel):
    """Audit log entry for calculation transparency."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    step: str
    input_value: str
    output_value: str
    source: str
    notes: Optional[str] = None
    line_number: Optional[str] = None  # Form 433-A line reference


class Form433AResult(BaseModel):
    """Complete calculation result for Form 433-A analysis."""

    # Income Summary
    total_gross_monthly_income: Decimal
    total_net_monthly_income: Decimal

    # Expense Analysis
    actual_total_expenses: Decimal
    irs_allowed_total_expenses: Decimal
    expense_allowances: list[ExpenseAllowance]

    # Monthly Disposable Income
    monthly_disposable_income: Decimal

    # Asset Summary
    total_liquid_assets: Decimal
    total_asset_equity: Decimal
    total_net_realizable_equity: Decimal

    # Reasonable Collection Potential
    rcp_lump_sum: Decimal  # 48-month multiplier + assets
    rcp_periodic: Decimal  # 60-month multiplier + assets

    # Minimum Offer Amount
    minimum_offer_lump_sum: Decimal
    minimum_offer_periodic: Decimal

    # CNC Analysis
    qualifies_for_cnc: bool
    cnc_reason: Optional[str] = None

    # Full Audit Trail
    audit_log: list[AuditEntry]

    # Methodology
    methodology_version: str
    irs_standards_version: str
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

    # Warnings and Recommendations
    warnings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    # Confidence
    confidence_level: float = Field(ge=0, le=1)


# =============================================================================
# FORM 433-A WORKSHEET MODELS
# =============================================================================

class Form433ALineItem(BaseModel):
    """Single line item for Form 433-A worksheet.

    Maps to specific IRS form line numbers for professional presentation.
    """
    section: str  # e.g., "Section 4 - Bank Accounts"
    line_number: str  # e.g., "13a", "24"
    description: str  # e.g., "Checking Account - Chase ****3387"
    actual_value: Decimal = Field(ge=0)
    irs_standard: Optional[Decimal] = None  # For expense items
    allowed_value: Optional[Decimal] = None  # min(actual, standard)
    source_documents: list[str] = Field(default_factory=list)
    notes: str = ""
    is_exempt: bool = False  # e.g., retirement accounts


class Form433AWorksheet(BaseModel):
    """Complete Form 433-A worksheet with IRS line-item breakdown.

    Provides a detailed view matching the actual IRS form structure,
    with actual values compared against IRS standards.
    """
    # Header information
    taxpayer_name: str
    spouse_name: Optional[str] = None
    filing_status: FilingStatus
    state: str = "NY"
    prepared_date: datetime = Field(default_factory=datetime.utcnow)

    # Section-organized line items (matching Form 433-A structure)
    section_1_personal: list[Form433ALineItem] = Field(default_factory=list)  # Personal info
    section_2_employment: list[Form433ALineItem] = Field(default_factory=list)  # Employment income
    section_3_other_income: list[Form433ALineItem] = Field(default_factory=list)  # Other income
    section_4_assets: list[Form433ALineItem] = Field(default_factory=list)  # Bank accounts, investments
    section_5_real_property: list[Form433ALineItem] = Field(default_factory=list)  # Real estate
    section_6_vehicles: list[Form433ALineItem] = Field(default_factory=list)  # Vehicles
    section_7_other_assets: list[Form433ALineItem] = Field(default_factory=list)  # Other assets
    section_8_expenses: list[Form433ALineItem] = Field(default_factory=list)  # Living expenses

    # Summary totals
    total_monthly_income: Decimal = Decimal("0")
    total_actual_expenses: Decimal = Decimal("0")
    total_allowed_expenses: Decimal = Decimal("0")
    monthly_disposable: Decimal = Decimal("0")
    total_liquid_assets: Decimal = Decimal("0")
    total_asset_equity: Decimal = Decimal("0")

    @property
    def all_line_items(self) -> list[Form433ALineItem]:
        """Get all line items across all sections."""
        return (
            self.section_1_personal +
            self.section_2_employment +
            self.section_3_other_income +
            self.section_4_assets +
            self.section_5_real_property +
            self.section_6_vehicles +
            self.section_7_other_assets +
            self.section_8_expenses
        )


# =============================================================================
# MONTHLY BUDGET MODELS (Bank Statement Transaction Analysis)
# =============================================================================

class TransactionCategory(str, Enum):
    """Categories for bank transaction classification."""
    # Income
    INCOME = "income"
    PAYCHECK = "paycheck"
    TRANSFER_IN = "transfer_in"

    # Housing
    RENT = "rent"
    MORTGAGE = "mortgage"
    UTILITIES = "utilities"

    # Food & Dining
    GROCERIES = "groceries"
    RESTAURANTS = "restaurants"
    COFFEE_SHOPS = "coffee_shops"

    # Transportation
    GAS = "gas"
    AUTO_PAYMENT = "auto_payment"
    RIDESHARE = "rideshare"
    PUBLIC_TRANSIT = "public_transit"
    PARKING = "parking"

    # Healthcare
    HEALTHCARE = "healthcare"
    PHARMACY = "pharmacy"
    INSURANCE_HEALTH = "insurance_health"

    # Shopping
    SHOPPING = "shopping"
    AMAZON = "amazon"
    CLOTHING = "clothing"

    # Entertainment
    ENTERTAINMENT = "entertainment"
    SUBSCRIPTIONS = "subscriptions"
    STREAMING = "streaming"

    # Financial
    INSURANCE = "insurance"
    DEBT_PAYMENT = "debt_payment"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    TRANSFER_OUT = "transfer_out"

    # Other
    FEES = "fees"
    ATM = "atm"
    OTHER = "other"


class BankTransaction(BaseModel):
    """Individual bank transaction from statement."""
    date: date
    description: str
    amount: Decimal  # Negative for debits, positive for credits
    category: TransactionCategory = TransactionCategory.OTHER
    is_debit: bool = True
    merchant: Optional[str] = None
    source_file: str = ""
    confidence: float = Field(default=0.7, ge=0, le=1)

    @property
    def abs_amount(self) -> Decimal:
        """Absolute value of transaction amount."""
        return abs(self.amount)


class CategorySummary(BaseModel):
    """Summary of transactions for a single category."""
    category: TransactionCategory
    total: Decimal = Decimal("0")
    count: int = 0
    transactions: list[BankTransaction] = Field(default_factory=list)

    @property
    def average(self) -> Decimal:
        """Average transaction amount."""
        if self.count == 0:
            return Decimal("0")
        return self.total / self.count


class MonthlyBudget(BaseModel):
    """Aggregated monthly budget from bank transactions.

    Provides spending analysis by category for a single month.
    """
    month: str  # "2025-01" format
    year: int
    month_number: int  # 1-12

    # Aggregated by category
    categories: dict[TransactionCategory, Decimal] = Field(default_factory=dict)
    category_details: list[CategorySummary] = Field(default_factory=list)

    # Totals
    total_income: Decimal = Decimal("0")
    total_expenses: Decimal = Decimal("0")
    net_cashflow: Decimal = Decimal("0")

    # Stats
    transaction_count: int = 0
    source_files: list[str] = Field(default_factory=list)

    @property
    def savings_rate(self) -> Decimal:
        """Savings rate as percentage."""
        if self.total_income == 0:
            return Decimal("0")
        return (self.net_cashflow / self.total_income) * 100


class BudgetAnalysis(BaseModel):
    """Complete budget analysis across multiple months.

    Provides trends and averages for financial planning.
    """
    months: list[MonthlyBudget] = Field(default_factory=list)
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None

    # Averages across all months
    avg_monthly_income: Decimal = Decimal("0")
    avg_monthly_expenses: Decimal = Decimal("0")
    avg_net_cashflow: Decimal = Decimal("0")

    # Category averages
    avg_by_category: dict[TransactionCategory, Decimal] = Field(default_factory=dict)

    # Insights
    top_expense_categories: list[tuple[TransactionCategory, Decimal]] = Field(default_factory=list)
    spending_trends: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# =============================================================================
# LEGACY COMPATIBILITY
# =============================================================================

class FinancialSnapshot(BaseModel):
    """Legacy model for backwards compatibility.

    Use Form433A for new implementations.
    """
    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    gross_monthly_income: Decimal
    business_income: Decimal = Decimal("0")
    other_income: Decimal = Decimal("0")
    expenses: list[Expense] = Field(default_factory=list)
    debts: list[Debt] = Field(default_factory=list)
    liquid_assets: Decimal = Decimal("0")
    family_size: int = Field(ge=1, default=1)
    state: str = Field(default="NY", pattern="^[A-Z]{2}$")

    @property
    def total_monthly_income(self) -> Decimal:
        """Calculate total monthly income from all sources."""
        return self.gross_monthly_income + self.business_income + self.other_income


class CalculationResult(BaseModel):
    """Legacy calculation result for backwards compatibility.

    Use Form433AResult for new implementations.
    """
    gross_income: Decimal
    allowed_expenses: Decimal
    debt_obligations: Decimal
    disposable_income: Decimal
    rcp_48_months: Decimal
    rcp_60_months: Decimal
    audit_log: list[AuditEntry]
    methodology_version: str
    confidence_level: float = Field(ge=0, le=1)
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    warnings: list[str] = Field(default_factory=list)
