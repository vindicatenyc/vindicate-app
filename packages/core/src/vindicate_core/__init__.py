"""Vindicate Core - Financial calculations and document generation."""

__version__ = "0.1.0"

from .calculator import DisposableIncomeCalculator
from .models import FinancialSnapshot, CalculationResult

__all__ = [
    "DisposableIncomeCalculator",
    "FinancialSnapshot",
    "CalculationResult",
]
