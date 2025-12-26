"""IRS Collection Financial Standards for Form 433-A calculations.

This module contains the official IRS National and Local Standards for
allowable living expenses used in Offer in Compromise and installment
agreement calculations.

Sources:
- National Standards: https://www.irs.gov/businesses/small-businesses-self-employed/national-standards-food-clothing-and-other-items
- Local Standards (Housing): https://www.irs.gov/businesses/small-businesses-self-employed/local-standards-housing-and-utilities
- Local Standards (Transportation): https://www.irs.gov/businesses/small-businesses-self-employed/local-standards-transportation

Updated: 2025-Q1 (effective April 2024 - March 2025)
"""

from decimal import Decimal
from typing import Optional, NamedTuple
from dataclasses import dataclass

from .models import ExpenseCategory, USRegion, get_region_for_state


# =============================================================================
# VERSION TRACKING
# =============================================================================

IRS_STANDARDS_VERSION = "2025-Q1"
EFFECTIVE_DATE = "2024-04-01"
EXPIRATION_DATE = "2025-03-31"


def get_irs_standards_version() -> str:
    """Return current IRS standards version."""
    return IRS_STANDARDS_VERSION


# =============================================================================
# NATIONAL STANDARDS - FOOD, CLOTHING, AND OTHER ITEMS
# =============================================================================
# These amounts are for food, housekeeping supplies, apparel and services,
# personal care products and services, and miscellaneous.

NATIONAL_STANDARDS_FOOD_CLOTHING = {
    # Family size: Monthly amount
    1: Decimal("785"),
    2: Decimal("1410"),
    3: Decimal("1598"),
    4: Decimal("1921"),
    # For each additional person over 4, add $358
}

NATIONAL_STANDARDS_ADDITIONAL_PERSON = Decimal("358")


def get_national_standard_food_clothing(family_size: int) -> Decimal:
    """Get the National Standard for food, clothing, and other items.

    Args:
        family_size: Total number of people in household

    Returns:
        Monthly allowable amount
    """
    if family_size <= 0:
        return Decimal("0")
    if family_size <= 4:
        return NATIONAL_STANDARDS_FOOD_CLOTHING.get(family_size, NATIONAL_STANDARDS_FOOD_CLOTHING[4])

    # Family size > 4: Start with 4-person amount and add for each additional
    base = NATIONAL_STANDARDS_FOOD_CLOTHING[4]
    additional = NATIONAL_STANDARDS_ADDITIONAL_PERSON * (family_size - 4)
    return base + additional


# =============================================================================
# OUT-OF-POCKET HEALTHCARE COSTS
# =============================================================================
# Based on age - applied per person in household

HEALTHCARE_UNDER_65 = Decimal("75")
HEALTHCARE_65_AND_OVER = Decimal("153")


def get_healthcare_standard(ages_under_65: int, ages_65_and_over: int) -> Decimal:
    """Get the out-of-pocket healthcare standard.

    Args:
        ages_under_65: Number of household members under 65
        ages_65_and_over: Number of household members 65 and over

    Returns:
        Monthly allowable amount for out-of-pocket healthcare
    """
    return (HEALTHCARE_UNDER_65 * ages_under_65) + (HEALTHCARE_65_AND_OVER * ages_65_and_over)


# =============================================================================
# LOCAL STANDARDS - HOUSING AND UTILITIES
# =============================================================================
# These vary by state and county. The amounts include mortgage/rent, property
# taxes, insurance, maintenance, HOA fees, and utilities.

# Format: state -> {family_size: amount}
# Family sizes: 1, 2, 3, 4, 5+ (5 is used for 5 or more)

HOUSING_STANDARDS_BY_STATE = {
    "AL": {1: Decimal("1586"), 2: Decimal("1866"), 3: Decimal("1866"), 4: Decimal("1866"), 5: Decimal("1985")},
    "AK": {1: Decimal("2181"), 2: Decimal("2566"), 3: Decimal("2566"), 4: Decimal("2566"), 5: Decimal("2729")},
    "AZ": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "AR": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "CA": {1: Decimal("2873"), 2: Decimal("3380"), 3: Decimal("3380"), 4: Decimal("3380"), 5: Decimal("3595")},
    "CO": {1: Decimal("2178"), 2: Decimal("2563"), 3: Decimal("2563"), 4: Decimal("2563"), 5: Decimal("2727")},
    "CT": {1: Decimal("2551"), 2: Decimal("3001"), 3: Decimal("3001"), 4: Decimal("3001"), 5: Decimal("3193")},
    "DE": {1: Decimal("1900"), 2: Decimal("2235"), 3: Decimal("2235"), 4: Decimal("2235"), 5: Decimal("2378")},
    "DC": {1: Decimal("2873"), 2: Decimal("3380"), 3: Decimal("3380"), 4: Decimal("3380"), 5: Decimal("3595")},
    "FL": {1: Decimal("1893"), 2: Decimal("2227"), 3: Decimal("2227"), 4: Decimal("2227"), 5: Decimal("2369")},
    "GA": {1: Decimal("1700"), 2: Decimal("2000"), 3: Decimal("2000"), 4: Decimal("2000"), 5: Decimal("2128")},
    "HI": {1: Decimal("2873"), 2: Decimal("3380"), 3: Decimal("3380"), 4: Decimal("3380"), 5: Decimal("3595")},
    "ID": {1: Decimal("1556"), 2: Decimal("1831"), 3: Decimal("1831"), 4: Decimal("1831"), 5: Decimal("1948")},
    "IL": {1: Decimal("1900"), 2: Decimal("2235"), 3: Decimal("2235"), 4: Decimal("2235"), 5: Decimal("2378")},
    "IN": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "IA": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "KS": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "KY": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "LA": {1: Decimal("1520"), 2: Decimal("1788"), 3: Decimal("1788"), 4: Decimal("1788"), 5: Decimal("1902")},
    "ME": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "MD": {1: Decimal("2351"), 2: Decimal("2766"), 3: Decimal("2766"), 4: Decimal("2766"), 5: Decimal("2943")},
    "MA": {1: Decimal("2673"), 2: Decimal("3145"), 3: Decimal("3145"), 4: Decimal("3145"), 5: Decimal("3346")},
    "MI": {1: Decimal("1556"), 2: Decimal("1831"), 3: Decimal("1831"), 4: Decimal("1831"), 5: Decimal("1948")},
    "MN": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "MS": {1: Decimal("1353"), 2: Decimal("1592"), 3: Decimal("1592"), 4: Decimal("1592"), 5: Decimal("1694")},
    "MO": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "MT": {1: Decimal("1556"), 2: Decimal("1831"), 3: Decimal("1831"), 4: Decimal("1831"), 5: Decimal("1948")},
    "NE": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "NV": {1: Decimal("1823"), 2: Decimal("2145"), 3: Decimal("2145"), 4: Decimal("2145"), 5: Decimal("2282")},
    "NH": {1: Decimal("2251"), 2: Decimal("2649"), 3: Decimal("2649"), 4: Decimal("2649"), 5: Decimal("2818")},
    "NJ": {1: Decimal("2873"), 2: Decimal("3380"), 3: Decimal("3380"), 4: Decimal("3380"), 5: Decimal("3595")},
    "NM": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "NY": {1: Decimal("3297"), 2: Decimal("3879"), 3: Decimal("3879"), 4: Decimal("3879"), 5: Decimal("4131")},
    "NC": {1: Decimal("1620"), 2: Decimal("1906"), 3: Decimal("1906"), 4: Decimal("1906"), 5: Decimal("2027")},
    "ND": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "OH": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    "OK": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "OR": {1: Decimal("1956"), 2: Decimal("2301"), 3: Decimal("2301"), 4: Decimal("2301"), 5: Decimal("2448")},
    "PA": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "RI": {1: Decimal("2151"), 2: Decimal("2531"), 3: Decimal("2531"), 4: Decimal("2531"), 5: Decimal("2693")},
    "SC": {1: Decimal("1553"), 2: Decimal("1827"), 3: Decimal("1827"), 4: Decimal("1827"), 5: Decimal("1944")},
    "SD": {1: Decimal("1420"), 2: Decimal("1670"), 3: Decimal("1670"), 4: Decimal("1670"), 5: Decimal("1777")},
    "TN": {1: Decimal("1520"), 2: Decimal("1788"), 3: Decimal("1788"), 4: Decimal("1788"), 5: Decimal("1902")},
    "TX": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "UT": {1: Decimal("1756"), 2: Decimal("2066"), 3: Decimal("2066"), 4: Decimal("2066"), 5: Decimal("2198")},
    "VT": {1: Decimal("1956"), 2: Decimal("2301"), 3: Decimal("2301"), 4: Decimal("2301"), 5: Decimal("2448")},
    "VA": {1: Decimal("2078"), 2: Decimal("2445"), 3: Decimal("2445"), 4: Decimal("2445"), 5: Decimal("2601")},
    "WA": {1: Decimal("2178"), 2: Decimal("2563"), 3: Decimal("2563"), 4: Decimal("2563"), 5: Decimal("2727")},
    "WV": {1: Decimal("1353"), 2: Decimal("1592"), 3: Decimal("1592"), 4: Decimal("1592"), 5: Decimal("1694")},
    "WI": {1: Decimal("1620"), 2: Decimal("1906"), 3: Decimal("1906"), 4: Decimal("1906"), 5: Decimal("2027")},
    "WY": {1: Decimal("1486"), 2: Decimal("1748"), 3: Decimal("1748"), 4: Decimal("1748"), 5: Decimal("1860")},
    # US Territories
    "PR": {1: Decimal("1200"), 2: Decimal("1412"), 3: Decimal("1412"), 4: Decimal("1412"), 5: Decimal("1502")},
    "GU": {1: Decimal("2200"), 2: Decimal("2588"), 3: Decimal("2588"), 4: Decimal("2588"), 5: Decimal("2753")},
    "VI": {1: Decimal("1800"), 2: Decimal("2118"), 3: Decimal("2118"), 4: Decimal("2118"), 5: Decimal("2253")},
}

# Default for unknown states (use national median)
DEFAULT_HOUSING_STANDARD = {
    1: Decimal("1756"),
    2: Decimal("2066"),
    3: Decimal("2066"),
    4: Decimal("2066"),
    5: Decimal("2198"),
}


def get_housing_standard(state: str, family_size: int) -> Decimal:
    """Get the local housing and utilities standard.

    Args:
        state: Two-letter state code
        family_size: Total number of people in household

    Returns:
        Monthly allowable amount for housing and utilities
    """
    if family_size <= 0:
        return Decimal("0")

    state_upper = state.upper()
    standards = HOUSING_STANDARDS_BY_STATE.get(state_upper, DEFAULT_HOUSING_STANDARD)

    # Cap family size at 5 for lookup
    lookup_size = min(family_size, 5)
    return standards.get(lookup_size, standards[5])


# =============================================================================
# LOCAL STANDARDS - TRANSPORTATION
# =============================================================================
# Transportation standards have two components:
# 1. Vehicle Ownership (loan/lease payment) - National, per vehicle
# 2. Vehicle Operating (gas, insurance, maintenance) - Regional, per vehicle

# National ownership costs (per vehicle, max 2 vehicles)
VEHICLE_OWNERSHIP_ONE_CAR = Decimal("588")
VEHICLE_OWNERSHIP_TWO_CARS = Decimal("1176")  # $588 x 2

# Regional operating costs (per vehicle)
VEHICLE_OPERATING_BY_REGION = {
    USRegion.NORTHEAST: Decimal("341"),
    USRegion.MIDWEST: Decimal("287"),
    USRegion.SOUTH: Decimal("290"),
    USRegion.WEST: Decimal("323"),
}

# Public transportation allowance (national, if no vehicle)
PUBLIC_TRANSPORTATION_ALLOWANCE = Decimal("242")


@dataclass
class TransportationStandard:
    """Transportation allowance breakdown."""
    ownership_allowance: Decimal
    operating_allowance: Decimal
    public_transport_allowance: Decimal
    total: Decimal
    num_vehicles: int


def get_transportation_standard(
    state: str,
    num_vehicles: int = 1,
    uses_public_transport: bool = False
) -> TransportationStandard:
    """Get the local transportation standard.

    Args:
        state: Two-letter state code
        num_vehicles: Number of vehicles (0, 1, or 2)
        uses_public_transport: Whether public transportation is used

    Returns:
        TransportationStandard with breakdown
    """
    region = get_region_for_state(state)
    operating_per_vehicle = VEHICLE_OPERATING_BY_REGION.get(region, Decimal("300"))

    if num_vehicles == 0:
        # No vehicle - only public transportation
        return TransportationStandard(
            ownership_allowance=Decimal("0"),
            operating_allowance=Decimal("0"),
            public_transport_allowance=PUBLIC_TRANSPORTATION_ALLOWANCE,
            total=PUBLIC_TRANSPORTATION_ALLOWANCE,
            num_vehicles=0
        )
    elif num_vehicles == 1:
        ownership = VEHICLE_OWNERSHIP_ONE_CAR
        operating = operating_per_vehicle
        public = PUBLIC_TRANSPORTATION_ALLOWANCE if uses_public_transport else Decimal("0")
        return TransportationStandard(
            ownership_allowance=ownership,
            operating_allowance=operating,
            public_transport_allowance=public,
            total=ownership + operating + public,
            num_vehicles=1
        )
    else:  # 2 or more vehicles (max 2 allowed)
        ownership = VEHICLE_OWNERSHIP_TWO_CARS
        operating = operating_per_vehicle * 2
        public = Decimal("0")  # No public transport with 2 vehicles
        return TransportationStandard(
            ownership_allowance=ownership,
            operating_allowance=operating,
            public_transport_allowance=public,
            total=ownership + operating,
            num_vehicles=2
        )


# =============================================================================
# COMBINED STANDARDS LOOKUP
# =============================================================================

@dataclass
class AllowableExpenses:
    """Complete breakdown of IRS allowable living expenses."""
    # National Standards
    food_clothing_misc: Decimal

    # Local Standards - Housing
    housing_utilities: Decimal

    # Local Standards - Transportation
    transportation_ownership: Decimal
    transportation_operating: Decimal
    public_transportation: Decimal
    transportation_total: Decimal

    # Healthcare
    out_of_pocket_healthcare: Decimal

    # Totals
    total_national_standards: Decimal
    total_local_standards: Decimal
    total_allowable: Decimal

    # Metadata
    state: str
    family_size: int
    num_vehicles: int
    irs_version: str


def get_all_allowable_expenses(
    state: str,
    family_size: int,
    ages_under_65: int,
    ages_65_and_over: int,
    num_vehicles: int = 1,
    uses_public_transport: bool = False
) -> AllowableExpenses:
    """Get complete IRS allowable living expenses.

    Args:
        state: Two-letter state code
        family_size: Total number of people in household
        ages_under_65: Number of household members under 65
        ages_65_and_over: Number of household members 65 and over
        num_vehicles: Number of vehicles (0, 1, or 2)
        uses_public_transport: Whether public transportation is used

    Returns:
        AllowableExpenses with complete breakdown
    """
    # National Standards
    food_clothing = get_national_standard_food_clothing(family_size)

    # Housing
    housing = get_housing_standard(state, family_size)

    # Transportation
    transport = get_transportation_standard(state, num_vehicles, uses_public_transport)

    # Healthcare
    healthcare = get_healthcare_standard(ages_under_65, ages_65_and_over)

    # Calculate totals
    total_national = food_clothing + healthcare
    total_local = housing + transport.total
    total = total_national + total_local

    return AllowableExpenses(
        food_clothing_misc=food_clothing,
        housing_utilities=housing,
        transportation_ownership=transport.ownership_allowance,
        transportation_operating=transport.operating_allowance,
        public_transportation=transport.public_transport_allowance,
        transportation_total=transport.total,
        out_of_pocket_healthcare=healthcare,
        total_national_standards=total_national,
        total_local_standards=total_local,
        total_allowable=total,
        state=state,
        family_size=family_size,
        num_vehicles=num_vehicles,
        irs_version=IRS_STANDARDS_VERSION
    )


# =============================================================================
# LEGACY COMPATIBILITY
# =============================================================================

def get_allowable_expense(
    category: ExpenseCategory,
    family_size: int,
    state: str = "NY",
    version: Optional[str] = None,
) -> Optional[Decimal]:
    """Get IRS-allowed expense amount for a category.

    This is a legacy function for backwards compatibility.
    Use get_all_allowable_expenses() for new implementations.

    Args:
        category: Expense category
        family_size: Number of people in household
        state: Two-letter state code
        version: IRS standards version (ignored, uses current)

    Returns:
        Maximum allowable amount or None if no standard exists
    """
    # Map legacy categories to new functions
    if category in [ExpenseCategory.FOOD, ExpenseCategory.FOOD_CLOTHING_MISC]:
        return get_national_standard_food_clothing(family_size)

    if category in [ExpenseCategory.HOUSING, ExpenseCategory.HOUSING_RENT,
                    ExpenseCategory.HOUSING_MORTGAGE, ExpenseCategory.UTILITIES]:
        return get_housing_standard(state, family_size)

    if category in [ExpenseCategory.TRANSPORTATION, ExpenseCategory.VEHICLE_PAYMENT,
                    ExpenseCategory.VEHICLE_OPERATING]:
        transport = get_transportation_standard(state, num_vehicles=1)
        return transport.total

    if category in [ExpenseCategory.HEALTHCARE, ExpenseCategory.OUT_OF_POCKET_HEALTHCARE]:
        # Assume all under 65 for legacy - not ideal but backwards compatible
        return get_healthcare_standard(family_size, 0)

    # Categories without IRS standards - return None (use actual)
    return None


# =============================================================================
# MINIMUM OFFER IN COMPROMISE AMOUNTS
# =============================================================================

# The IRS requires a minimum offer of $205 (as of 2024)
MINIMUM_OIC_OFFER = Decimal("205")

# Application fee for OIC (waived for low-income taxpayers)
OIC_APPLICATION_FEE = Decimal("205")

# Low-income threshold multiplier (250% of federal poverty level)
LOW_INCOME_MULTIPLIER = Decimal("2.5")


def get_minimum_oic_offer() -> Decimal:
    """Get the minimum Offer in Compromise amount."""
    return MINIMUM_OIC_OFFER


# =============================================================================
# COLLECTION POTENTIAL CALCULATIONS
# =============================================================================

# Multipliers for RCP calculation
RCP_LUMP_SUM_MONTHS = 12  # Changed from 48 to 12 per current IRS policy (5 months + remaining 12)
RCP_PERIODIC_MONTHS = 24  # Changed from 60 to 24 per current IRS policy


def calculate_rcp_lump_sum(
    monthly_disposable_income: Decimal,
    total_asset_equity: Decimal
) -> Decimal:
    """Calculate Reasonable Collection Potential for lump sum offer.

    For offers paid in 5 or fewer months:
    RCP = (Monthly Disposable Income × 12) + Net Realizable Equity

    Args:
        monthly_disposable_income: Monthly income minus allowable expenses
        total_asset_equity: Net realizable equity in assets

    Returns:
        Minimum acceptable offer amount for lump sum
    """
    if monthly_disposable_income < 0:
        # Negative disposable income means potential CNC status
        income_portion = Decimal("0")
    else:
        income_portion = monthly_disposable_income * RCP_LUMP_SUM_MONTHS

    return max(income_portion + total_asset_equity, MINIMUM_OIC_OFFER)


def calculate_rcp_periodic(
    monthly_disposable_income: Decimal,
    total_asset_equity: Decimal
) -> Decimal:
    """Calculate Reasonable Collection Potential for periodic payment offer.

    For offers paid in 6 to 24 months:
    RCP = (Monthly Disposable Income × 24) + Net Realizable Equity

    Args:
        monthly_disposable_income: Monthly income minus allowable expenses
        total_asset_equity: Net realizable equity in assets

    Returns:
        Minimum acceptable offer amount for periodic payment
    """
    if monthly_disposable_income < 0:
        income_portion = Decimal("0")
    else:
        income_portion = monthly_disposable_income * RCP_PERIODIC_MONTHS

    return max(income_portion + total_asset_equity, MINIMUM_OIC_OFFER)
