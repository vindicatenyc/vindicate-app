# Vindicate Core

Core financial calculations and document generation for Vindicate NYC.

## Features

- **Complete IRS Form 433-A Implementation** - Full data models for all sections
- **IRS National Standards** - Food, clothing, and other items for all family sizes
- **IRS Local Standards** - Housing for all 50 states + DC and territories
- **Transportation Standards** - Regional operating costs and ownership allowances
- **Asset Equity Calculations** - Quick Sale Value (80% FMV) methodology
- **RCP Calculations** - Lump sum (12 months) and periodic (24 months) offers
- **CNC Analysis** - Currently Not Collectible eligibility determination
- **PDF Parsing** - Extract data from bank statements, pay stubs, and tax forms
- **Report Generation** - Comprehensive analysis reports in text, markdown, and HTML
- **Full Audit Trail** - Complete calculation logging for legal defensibility

## Installation

```bash
pip install -e ".[dev,test]"
```

## Quick Start

```python
from decimal import Decimal
from vindicate_core import (
    Form433ACalculator,
    Form433AReportGenerator,
    Form433A,
    PersonalInfo,
    Employment,
    IncomeSource,
    LivingExpenses,
    BankAccount,
    Vehicle,
    TaxPeriod,
    FilingStatus,
    EmploymentType,
    IncomeFrequency,
    IncomeType,
    AssetType,
)

# Create Form 433-A data
form = Form433A(
    personal_info=PersonalInfo(
        first_name="John",
        last_name="Doe",
        state="NY",
        filing_status=FilingStatus.SINGLE,
    ),
    employment=[
        Employment(
            employer_name="Acme Corp",
            employment_type=EmploymentType.W2_EMPLOYEE,
            income=IncomeSource(
                income_type=IncomeType.WAGES,
                source_name="Acme Corp",
                gross_amount=Decimal("5000"),
                frequency=IncomeFrequency.MONTHLY,
                federal_tax_withheld=Decimal("500"),
                state_tax_withheld=Decimal("250"),
            ),
        ),
    ],
    living_expenses=LivingExpenses(
        food=Decimal("600"),
        rent=Decimal("2000"),
        utilities_electric=Decimal("150"),
        vehicle_payment_1=Decimal("400"),
        vehicle_gas=Decimal("200"),
        health_insurance_premium=Decimal("300"),
    ),
    bank_accounts=[
        BankAccount(
            institution_name="Chase",
            account_type=AssetType.CHECKING_ACCOUNT,
            current_balance=Decimal("3000"),
        ),
    ],
    vehicles=[
        Vehicle(
            year=2020,
            make="Honda",
            model="Civic",
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
            current_balance=Decimal("18000"),
        ),
    ],
)

# Calculate OIC eligibility
calculator = Form433ACalculator()
result = calculator.calculate(form)

print(f"Monthly Disposable Income: ${result.monthly_disposable_income:,.2f}")
print(f"Total Asset Equity: ${result.total_net_realizable_equity:,.2f}")
print(f"RCP (Lump Sum): ${result.rcp_lump_sum:,.2f}")
print(f"RCP (Periodic): ${result.rcp_periodic:,.2f}")
print(f"Qualifies for CNC: {result.qualifies_for_cnc}")

# Generate report
report_gen = Form433AReportGenerator()
report = report_gen.generate(form, result, format="text")
print(report)
```

## IRS Standards Lookup

```python
from vindicate_core import (
    get_national_standard_food_clothing,
    get_housing_standard,
    get_transportation_standard,
    get_healthcare_standard,
    get_all_allowable_expenses,
)

# National Standards for food, clothing, etc.
food_standard = get_national_standard_food_clothing(family_size=4)
print(f"Food/Clothing Standard (family of 4): ${food_standard}")

# Local Standards for housing by state
housing_ny = get_housing_standard("NY", family_size=2)
housing_tx = get_housing_standard("TX", family_size=2)
print(f"Housing (NY, family of 2): ${housing_ny}")
print(f"Housing (TX, family of 2): ${housing_tx}")

# Transportation by region
transport = get_transportation_standard("NY", num_vehicles=1)
print(f"Transportation (1 vehicle): ${transport.total}")

# Healthcare by age
healthcare = get_healthcare_standard(ages_under_65=2, ages_65_and_over=1)
print(f"Healthcare Standard: ${healthcare}")

# Get complete breakdown
all_expenses = get_all_allowable_expenses(
    state="NY",
    family_size=4,
    ages_under_65=3,
    ages_65_and_over=1,
    num_vehicles=2,
)
print(f"Total IRS Allowable: ${all_expenses.total_allowable}")
```

## PDF Document Parsing

```python
from vindicate_core import PDFParser, DocumentAnalyzer

# Parse a PDF document
parser = PDFParser()
result = parser.parse("bank_statement.pdf")

print(f"Document Type: {result.document_type.value}")
print(f"Pages: {result.page_count}")

# Extract amounts
for amount in result.amounts[:5]:
    print(f"  {amount.label}: ${amount.amount}")

# Use specialized parsers
from vindicate_core import PayStubParser, BankStatementParser

paystub_parser = PayStubParser()
paystub = paystub_parser.parse_paystub("pay_stub.pdf")
print(f"Gross Pay: ${paystub_parser.get_gross_pay(paystub)}")
print(f"Net Pay: ${paystub_parser.get_net_pay(paystub)}")
```

## RCP Calculations

```python
from decimal import Decimal
from vindicate_core import calculate_rcp_lump_sum, calculate_rcp_periodic, MINIMUM_OIC_OFFER

monthly_disposable = Decimal("500")
asset_equity = Decimal("10000")

# Lump sum (5 months or less): 12 × disposable + assets
rcp_lump = calculate_rcp_lump_sum(monthly_disposable, asset_equity)
print(f"RCP Lump Sum: ${rcp_lump}")  # (500 × 12) + 10000 = $16,000

# Periodic (6-24 months): 24 × disposable + assets
rcp_periodic = calculate_rcp_periodic(monthly_disposable, asset_equity)
print(f"RCP Periodic: ${rcp_periodic}")  # (500 × 24) + 10000 = $22,000

# Minimum offer is always $205
print(f"Minimum OIC Offer: ${MINIMUM_OIC_OFFER}")
```

## Running the Demo

```bash
cd packages/core
python examples/form_433a_demo.py
```

## Testing

```bash
pytest tests/ -v
```

## API Reference

### Calculators
- `Form433ACalculator` - Complete Form 433-A analysis
- `DisposableIncomeCalculator` - Legacy simple calculator

### Models
- `Form433A` - Complete Form 433-A data structure
- `Form433AResult` - Calculation results with recommendations
- `PersonalInfo`, `Employment`, `IncomeSource`, `LivingExpenses`
- `BankAccount`, `RealProperty`, `Vehicle`, `OtherAsset`
- `Debt`, `TaxPeriod`

### IRS Standards
- `get_national_standard_food_clothing(family_size)`
- `get_housing_standard(state, family_size)`
- `get_transportation_standard(state, num_vehicles)`
- `get_healthcare_standard(ages_under_65, ages_65_and_over)`
- `get_all_allowable_expenses(...)`

### PDF Parsing
- `PDFParser` - General PDF extraction
- `BankStatementParser` - Bank statement specific
- `PayStubParser` - Pay stub specific
- `DocumentAnalyzer` - Auto-detect document type

### Report Generation
- `Form433AReportGenerator` - Generate analysis reports

## License

AGPL-3.0
