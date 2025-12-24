"""IRS National Standards for allowable living expenses."""

from decimal import Decimal
from typing import Optional

from .models import ExpenseCategory


# IRS National Standards - Updated quarterly
# Source: https://www.irs.gov/businesses/small-businesses-self-employed/national-standards-food-clothing-and-other-items
IRS_STANDARDS_VERSION = "2025-Q1"

# National Standards for Food, Clothing, and Other Items (monthly)
NATIONAL_STANDARDS = {
    1: Decimal("785"),   # Single person
    2: Decimal("1410"),  # 2 person household
    3: Decimal("1598"),  # 3 person household
    4: Decimal("1921"),  # 4 person household
    # Add $358 for each additional person
}

# Housing and Utilities Standards by State (NY example)
# Source: https://www.irs.gov/businesses/small-businesses-self-employed/local-standards-housing-and-utilities
HOUSING_STANDARDS_NY = {
    1: Decimal("3297"),
    2: Decimal("3879"),
    3: Decimal("3879"),
    4: Decimal("3879"),
    5: Decimal("4131"),
}

# Transportation Standards (national)
TRANSPORTATION_OWNERSHIP = Decimal("588")  # Per vehicle
TRANSPORTATION_OPERATING = Decimal("341")  # Per vehicle

# Out-of-Pocket Healthcare (based on age)
HEALTHCARE_UNDER_65 = Decimal("75")
HEALTHCARE_65_AND_OVER = Decimal("153")


def get_irs_standards_version() -> str:
    """Return current IRS standards version."""
    return IRS_STANDARDS_VERSION


def get_allowable_expense(
    category: ExpenseCategory,
    family_size: int,
    state: str = "NY",
    version: Optional[str] = None,
) -> Optional[Decimal]:
    """
    Get IRS-allowed expense amount for a category.

    Args:
        category: Expense category
        family_size: Number of people in household
        state: Two-letter state code
        version: IRS standards version (default: current)

    Returns:
        Maximum allowable amount or None if no standard exists
    """
    # TODO: Implement version-specific standards lookup
    # For now, use current standards

    if category == ExpenseCategory.FOOD:
        base = NATIONAL_STANDARDS.get(min(family_size, 4), NATIONAL_STANDARDS[4])
        additional = Decimal("358") * max(0, family_size - 4)
        return base + additional

    if category == ExpenseCategory.HOUSING:
        if state == "NY":
            return HOUSING_STANDARDS_NY.get(min(family_size, 5), HOUSING_STANDARDS_NY[5])
        # TODO: Add other states
        return None

    if category == ExpenseCategory.TRANSPORTATION:
        return TRANSPORTATION_OWNERSHIP + TRANSPORTATION_OPERATING

    if category == ExpenseCategory.HEALTHCARE:
        return HEALTHCARE_UNDER_65  # TODO: Add age-based logic

    # No IRS standard for these categories - use actual
    return None
