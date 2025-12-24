# Vindicate Core

Core financial calculations and document generation for Vindicate NYC.

## Features

- IRS Form 433-A disposable income calculator
- Reasonable Collection Potential (RCP) calculations
- IRS National Standards integration
- Full audit trail for legal defensibility

## Installation

```bash
pip install -e ".[dev,test]"
```

## Usage

```python
from vindicate_core import DisposableIncomeCalculator, FinancialSnapshot
from decimal import Decimal

snapshot = FinancialSnapshot(
    gross_monthly_income=Decimal("5000"),
    family_size=2,
    state="NY",
)

calculator = DisposableIncomeCalculator()
result = calculator.calculate(snapshot)

print(f"Disposable Income: ${result.disposable_income}")
print(f"RCP (48 months): ${result.rcp_48_months}")
```

## Testing

```bash
pytest tests/ -v
```

## License

AGPL-3.0
