#!/usr/bin/env python3
"""
Form 433-A Analysis Demonstration

This script demonstrates the complete Form 433-A analysis workflow:
1. Create financial data models
2. Calculate OIC (Offer in Compromise) eligibility
3. Generate a comprehensive report

Run: python examples/form_433a_demo.py
"""

from decimal import Decimal

from vindicate_core import (
    Form433ACalculator,
    Form433AReportGenerator,
    Form433A,
    PersonalInfo,
    Dependent,
    Employment,
    IncomeSource,
    LivingExpenses,
    BankAccount,
    RealProperty,
    Vehicle,
    TaxPeriod,
    FilingStatus,
    EmploymentType,
    IncomeFrequency,
    IncomeType,
    AssetType,
)


def create_sample_form() -> Form433A:
    """Create a sample Form 433-A with realistic data."""

    # Personal Information
    personal_info = PersonalInfo(
        first_name="John",
        last_name="Smith",
        age=42,
        filing_status=FilingStatus.MARRIED_FILING_JOINTLY,
        spouse_first_name="Jane",
        spouse_last_name="Smith",
        spouse_age=40,
        street_address="456 Oak Avenue",
        city="Brooklyn",
        state="NY",
        zip_code="11201",
        dependents=[
            Dependent(name="Emily Smith", relationship="daughter", age=16),
            Dependent(name="Michael Smith", relationship="son", age=13),
        ],
    )

    # Employment (Primary)
    employment = Employment(
        employer_name="ABC Technology Inc.",
        employer_address="100 Tech Plaza, Manhattan, NY",
        employment_type=EmploymentType.W2_EMPLOYEE,
        occupation="Software Developer",
        years_employed=Decimal("5.5"),
        income=IncomeSource(
            income_type=IncomeType.WAGES,
            source_name="ABC Technology Inc.",
            gross_amount=Decimal("7500"),
            frequency=IncomeFrequency.MONTHLY,
            federal_tax_withheld=Decimal("1125"),
            state_tax_withheld=Decimal("500"),
            local_tax_withheld=Decimal("100"),
            social_security_withheld=Decimal("465"),
            medicare_withheld=Decimal("108.75"),
            health_insurance_withheld=Decimal("350"),
            retirement_contribution=Decimal("375"),
        ),
    )

    # Spouse Employment
    spouse_employment = Employment(
        employer_name="City School District",
        employment_type=EmploymentType.W2_EMPLOYEE,
        occupation="Teacher",
        income=IncomeSource(
            income_type=IncomeType.WAGES,
            source_name="City School District",
            gross_amount=Decimal("5000"),
            frequency=IncomeFrequency.MONTHLY,
            federal_tax_withheld=Decimal("500"),
            state_tax_withheld=Decimal("300"),
            social_security_withheld=Decimal("310"),
            medicare_withheld=Decimal("72.50"),
            retirement_contribution=Decimal("250"),
        ),
    )

    # Living Expenses
    living_expenses = LivingExpenses(
        # National Standards (Food, Clothing, Misc)
        food=Decimal("1200"),
        housekeeping_supplies=Decimal("150"),
        clothing=Decimal("250"),
        personal_care=Decimal("100"),
        miscellaneous=Decimal("100"),

        # Housing
        mortgage_payment=Decimal("2800"),
        property_taxes=Decimal("600"),
        homeowners_insurance=Decimal("150"),
        utilities_electric=Decimal("180"),
        utilities_gas=Decimal("80"),
        utilities_water=Decimal("50"),
        utilities_phone=Decimal("100"),
        utilities_cell=Decimal("200"),
        utilities_internet=Decimal("100"),

        # Transportation
        vehicle_payment_1=Decimal("450"),
        vehicle_payment_2=Decimal("350"),
        vehicle_insurance=Decimal("250"),
        vehicle_gas=Decimal("400"),
        vehicle_maintenance=Decimal("100"),

        # Healthcare
        health_insurance_premium=Decimal("0"),  # Covered by employer
        out_of_pocket_medical=Decimal("150"),
        prescriptions=Decimal("75"),

        # Childcare
        childcare=Decimal("0"),  # Kids are older

        # Other
        life_insurance=Decimal("100"),
        estimated_tax_payments=Decimal("0"),
    )

    # Bank Accounts
    bank_accounts = [
        BankAccount(
            institution_name="Chase Bank",
            account_type=AssetType.CHECKING_ACCOUNT,
            current_balance=Decimal("4500"),
        ),
        BankAccount(
            institution_name="Chase Bank",
            account_type=AssetType.SAVINGS_ACCOUNT,
            current_balance=Decimal("8000"),
        ),
        BankAccount(
            institution_name="Fidelity",
            account_type=AssetType.RETIREMENT_401K,
            current_balance=Decimal("185000"),
            is_retirement=True,
        ),
    ]

    # Real Property
    real_property = [
        RealProperty(
            property_type=AssetType.PRIMARY_RESIDENCE,
            address="456 Oak Avenue, Brooklyn, NY 11201",
            current_market_value=Decimal("650000"),
            mortgage_balance=Decimal("380000"),
            monthly_payment=Decimal("2800"),
            is_primary_residence=True,
            purchase_price=Decimal("425000"),
        ),
    ]

    # Vehicles
    vehicles = [
        Vehicle(
            year=2021,
            make="Honda",
            model="Accord",
            mileage=35000,
            current_market_value=Decimal("24000"),
            loan_balance=Decimal("12000"),
            monthly_payment=Decimal("450"),
        ),
        Vehicle(
            year=2019,
            make="Toyota",
            model="RAV4",
            mileage=52000,
            current_market_value=Decimal("22000"),
            loan_balance=Decimal("8000"),
            monthly_payment=Decimal("350"),
        ),
    ]

    # Tax Liability (what they owe)
    tax_periods = [
        TaxPeriod(
            tax_year=2020,
            tax_type="income",
            form_type="1040",
            original_balance=Decimal("18000"),
            current_balance=Decimal("25000"),
            penalties=Decimal("3500"),
            interest=Decimal("3500"),
        ),
        TaxPeriod(
            tax_year=2021,
            tax_type="income",
            form_type="1040",
            original_balance=Decimal("12000"),
            current_balance=Decimal("15000"),
            penalties=Decimal("1500"),
            interest=Decimal("1500"),
        ),
    ]

    return Form433A(
        personal_info=personal_info,
        employment=[employment],
        spouse_employment=[spouse_employment],
        living_expenses=living_expenses,
        bank_accounts=bank_accounts,
        real_property=real_property,
        vehicles=vehicles,
        tax_periods=tax_periods,
        notes="Client seeking resolution for 2020-2021 tax liabilities after financial hardship during COVID.",
    )


def main():
    """Run the Form 433-A analysis demonstration."""
    print("=" * 70)
    print("VINDICATE CORE - Form 433-A Analysis Demo")
    print("=" * 70)
    print()

    # Step 1: Create sample data
    print("Step 1: Creating sample Form 433-A data...")
    form = create_sample_form()
    print(f"  - Taxpayer: {form.personal_info.first_name} {form.personal_info.last_name}")
    print(f"  - State: {form.personal_info.state}")
    print(f"  - Family Size: {form.personal_info.family_size}")
    print(f"  - Total Tax Liability: ${form.total_tax_liability:,.2f}")
    print()

    # Step 2: Run calculations
    print("Step 2: Running Form 433-A calculations...")
    calculator = Form433ACalculator()
    result = calculator.calculate(form)
    print(f"  - Monthly Gross Income: ${result.total_gross_monthly_income:,.2f}")
    print(f"  - IRS Allowed Expenses: ${result.irs_allowed_total_expenses:,.2f}")
    print(f"  - Monthly Disposable: ${result.monthly_disposable_income:,.2f}")
    print(f"  - Net Realizable Equity: ${result.total_net_realizable_equity:,.2f}")
    print(f"  - RCP (Lump Sum): ${result.rcp_lump_sum:,.2f}")
    print(f"  - RCP (Periodic): ${result.rcp_periodic:,.2f}")
    print(f"  - Qualifies for CNC: {result.qualifies_for_cnc}")
    print(f"  - Confidence Level: {result.confidence_level:.0%}")
    print()

    # Step 3: Generate report
    print("Step 3: Generating analysis report...")
    report_gen = Form433AReportGenerator()

    # Generate text report
    report_text = report_gen.generate(form, result, format="text")
    print()
    print(report_text)

    # Save reports
    print()
    print("-" * 70)
    print("Saving reports...")

    # Save text report
    with open("form_433a_report.txt", "w") as f:
        f.write(report_text)
    print("  - Saved: form_433a_report.txt")

    # Save markdown report
    report_md = report_gen.generate(form, result, format="markdown")
    with open("form_433a_report.md", "w") as f:
        f.write(report_md)
    print("  - Saved: form_433a_report.md")

    # Save HTML report
    report_html = report_gen.generate(form, result, format="html")
    with open("form_433a_report.html", "w") as f:
        f.write(report_html)
    print("  - Saved: form_433a_report.html")

    # Save PDF report
    try:
        report_pdf = report_gen.generate(form, result, format="pdf")
        with open("form_433a_report.pdf", "wb") as f:
            f.write(report_pdf)
        print("  - Saved: form_433a_report.pdf")
    except ValueError as e:
        print(f"  - PDF skipped: {e}")

    print()
    print("=" * 70)
    print("Demo complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
