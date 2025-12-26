"""
LLM-Based Transaction Extractor for Bank Statement Processing.

Uses Claude API to extract individual transactions from bank statements
with proper debit/credit classification - replacing brittle regex patterns.
"""

import json
import os
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from .models import BankTransaction, TransactionCategory


@dataclass
class LLMTransactionExtractionResult:
    """Result from LLM transaction extraction."""

    success: bool
    transactions: list[BankTransaction]
    statement_period_start: Optional[date]
    statement_period_end: Optional[date]
    beginning_balance: Optional[Decimal]
    ending_balance: Optional[Decimal]
    confidence: float
    raw_response: str
    tokens_used: int
    error: Optional[str] = None


# Prompt template with explicit credit/debit rules
TRANSACTION_EXTRACTION_PROMPT = """You are a financial document extraction assistant specializing in bank statement analysis.

TASK: Extract ALL individual transactions from this bank statement.

DOCUMENT TEXT:
---
{document_text}
---

EXTRACTION RULES:

1. Extract EVERY transaction - do not skip any line item
2. CRITICAL: Correctly identify transaction TYPE:
   - "credit" = money INTO the account (deposits, income, refunds, transfers in)
   - "debit" = money OUT of the account (payments, withdrawals, purchases)

3. Common CREDIT patterns (these are ALWAYS deposits/income, NOT expenses):
   - Payroll, Direct Deposit, Salary, Wages, PPD, ACH Credit
   - Wire Transfer In, Deposit, Mobile Deposit
   - Zelle FROM someone, Venmo FROM someone
   - Transfer From, Ext Transfer IN
   - Refund, Cashback, Interest Earned, Dividend
   - Any transaction with "HOMECARE", "HHAX", "HOUSING" + deposit pattern (payroll)

4. Common DEBIT patterns (money OUT):
   - Check #, ATM Withdrawal, Cash Withdrawal
   - POS Purchase, Debit Card, Card Purchase
   - ACH Debit, Bill Pay, Autopay
   - Zelle TO someone, Venmo TO someone
   - Transfer To, Ext Transfer OUT
   - Monthly Fee, Service Charge

5. Amount formatting:
   - Return just the number (no $ signs or commas)
   - Always use positive numbers - the type field indicates direction

6. Date formatting:
   - Use YYYY-MM-DD format
   - If only MM/DD provided, infer year from statement period

7. Category hints (optional but helpful):
   - paycheck, transfer, utilities, groceries, rideshare, atm, etc.

Return ONLY valid JSON with this exact structure:
{{
  "statement_period_start": "YYYY-MM-DD or null",
  "statement_period_end": "YYYY-MM-DD or null",
  "beginning_balance": number or null,
  "ending_balance": number or null,
  "transactions": [
    {{
      "date": "YYYY-MM-DD",
      "description": "full transaction description",
      "amount": number,
      "type": "credit" or "debit",
      "category_hint": "optional category"
    }}
  ]
}}
"""


class LLMTransactionExtractor:
    """
    Extract bank transactions using Claude LLM.

    Provides more reliable extraction than regex patterns, especially
    for correctly classifying payroll deposits as credits vs debits.
    """

    # Base confidence for LLM extractions
    BASE_CONFIDENCE = 0.85

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        """
        Initialize the LLM transaction extractor.

        Args:
            api_key: Anthropic API key. If not provided, uses ANTHROPIC_API_KEY env var.
            model: Claude model to use for extraction.

        Raises:
            ImportError: If anthropic package is not installed.
            ValueError: If no API key is available.
        """
        try:
            import anthropic
            self._anthropic = anthropic
        except ImportError:
            raise ImportError(
                "The 'anthropic' package is required for LLM extraction. "
                "Install it with: pip install anthropic"
            )

        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError(
                "No Anthropic API key provided. Set ANTHROPIC_API_KEY environment variable "
                "or pass api_key parameter."
            )

        self.client = self._anthropic.Anthropic(api_key=self.api_key)
        self.model = model

    def extract_transactions(
        self,
        document_text: str,
        source_file: str = "",
        statement_date: Optional[date] = None,
    ) -> LLMTransactionExtractionResult:
        """
        Extract all transactions from a bank statement using Claude.

        Args:
            document_text: The raw text content of the bank statement.
            source_file: Path to the source file (for transaction metadata).
            statement_date: Hint for statement date (helps with year inference).

        Returns:
            LLMTransactionExtractionResult with extracted transactions.
        """
        if not document_text or len(document_text.strip()) < 50:
            return LLMTransactionExtractionResult(
                success=False,
                transactions=[],
                statement_period_start=None,
                statement_period_end=None,
                beginning_balance=None,
                ending_balance=None,
                confidence=0.0,
                raw_response="",
                tokens_used=0,
                error="Document text too short or empty",
            )

        # Truncate very long documents to fit context window
        # Claude can handle ~100k tokens, but we limit for efficiency
        max_chars = 50000
        if len(document_text) > max_chars:
            document_text = document_text[:max_chars]

        prompt = TRANSACTION_EXTRACTION_PROMPT.format(document_text=document_text)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8000,  # Allow for many transactions
                messages=[{"role": "user", "content": prompt}],
            )

            raw_response = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens

            # Parse the JSON response
            parsed_data = self._parse_json_response(raw_response)

            if parsed_data is None:
                return LLMTransactionExtractionResult(
                    success=False,
                    transactions=[],
                    statement_period_start=None,
                    statement_period_end=None,
                    beginning_balance=None,
                    ending_balance=None,
                    confidence=0.0,
                    raw_response=raw_response,
                    tokens_used=tokens_used,
                    error="Failed to parse JSON from LLM response",
                )

            # Convert to BankTransaction models
            transactions = self._convert_to_transactions(
                parsed_data.get("transactions", []),
                source_file=source_file,
            )

            # Parse dates and balances
            statement_start = self._parse_date_str(parsed_data.get("statement_period_start"))
            statement_end = self._parse_date_str(parsed_data.get("statement_period_end"))
            beginning_balance = self._parse_decimal(parsed_data.get("beginning_balance"))
            ending_balance = self._parse_decimal(parsed_data.get("ending_balance"))

            # Calculate confidence based on extraction quality
            confidence = self._calculate_confidence(
                transactions=transactions,
                beginning_balance=beginning_balance,
                ending_balance=ending_balance,
            )

            return LLMTransactionExtractionResult(
                success=True,
                transactions=transactions,
                statement_period_start=statement_start,
                statement_period_end=statement_end,
                beginning_balance=beginning_balance,
                ending_balance=ending_balance,
                confidence=confidence,
                raw_response=raw_response,
                tokens_used=tokens_used,
            )

        except Exception as e:
            return LLMTransactionExtractionResult(
                success=False,
                transactions=[],
                statement_period_start=None,
                statement_period_end=None,
                beginning_balance=None,
                ending_balance=None,
                confidence=0.0,
                raw_response="",
                tokens_used=0,
                error=f"API call failed: {str(e)}",
            )

    def _parse_json_response(self, response: str) -> Optional[dict[str, Any]]:
        """Parse JSON from LLM response, handling common formatting issues."""
        # Try direct parsing first
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            pass

        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Look for standalone JSON object (more permissive)
        json_match = re.search(r'\{[\s\S]*"transactions"[\s\S]*\}', response)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        return None

    def _convert_to_transactions(
        self,
        raw_transactions: list[dict],
        source_file: str,
    ) -> list[BankTransaction]:
        """Convert raw transaction dicts to BankTransaction models."""
        transactions = []

        for raw in raw_transactions:
            try:
                # Parse date
                txn_date = self._parse_date_str(raw.get("date"))
                if not txn_date:
                    continue  # Skip transactions without valid dates

                # Parse amount
                amount = self._parse_decimal(raw.get("amount"))
                if amount is None or amount == 0:
                    continue  # Skip zero or invalid amounts

                # Determine if debit or credit
                txn_type = str(raw.get("type", "debit")).lower()
                is_debit = txn_type == "debit"

                # Convert to signed amount (negative for debits)
                if is_debit:
                    signed_amount = -abs(amount)
                else:
                    signed_amount = abs(amount)

                # Determine category from hint
                category_hint = raw.get("category_hint", "")
                category = self._map_category(category_hint, raw.get("description", ""), is_debit)

                txn = BankTransaction(
                    date=txn_date,
                    description=str(raw.get("description", "")).strip(),
                    amount=signed_amount,
                    category=category,
                    is_debit=is_debit,
                    merchant=None,
                    source_file=source_file,
                    confidence=0.85,  # LLM extraction confidence
                )
                transactions.append(txn)

            except Exception:
                # Skip malformed transactions
                continue

        return transactions

    def _map_category(
        self,
        category_hint: str,
        description: str,
        is_debit: bool,
    ) -> TransactionCategory:
        """Map category hint and description to TransactionCategory."""
        hint_lower = category_hint.lower() if category_hint else ""
        desc_lower = description.lower()

        # Income categories (credits)
        if not is_debit:
            if any(kw in hint_lower or kw in desc_lower for kw in ["payroll", "salary", "wages", "direct dep"]):
                return TransactionCategory.PAYCHECK
            if any(kw in hint_lower or kw in desc_lower for kw in ["transfer", "xfer"]):
                return TransactionCategory.TRANSFER_IN
            return TransactionCategory.INCOME

        # Expense categories (debits)
        category_mapping = {
            # Transportation
            "rideshare": TransactionCategory.RIDESHARE,
            "uber": TransactionCategory.RIDESHARE,
            "lyft": TransactionCategory.RIDESHARE,
            "gas": TransactionCategory.GAS,
            "fuel": TransactionCategory.GAS,
            "auto": TransactionCategory.AUTO_PAYMENT,
            "car": TransactionCategory.AUTO_PAYMENT,
            "transit": TransactionCategory.PUBLIC_TRANSIT,
            "mta": TransactionCategory.PUBLIC_TRANSIT,
            "subway": TransactionCategory.PUBLIC_TRANSIT,
            "metro": TransactionCategory.PUBLIC_TRANSIT,
            "parking": TransactionCategory.PARKING,

            # Food
            "grocery": TransactionCategory.GROCERIES,
            "groceries": TransactionCategory.GROCERIES,
            "supermarket": TransactionCategory.GROCERIES,
            "restaurant": TransactionCategory.RESTAURANTS,
            "dining": TransactionCategory.RESTAURANTS,
            "food": TransactionCategory.RESTAURANTS,
            "coffee": TransactionCategory.COFFEE_SHOPS,
            "starbucks": TransactionCategory.COFFEE_SHOPS,

            # Housing
            "rent": TransactionCategory.RENT,
            "mortgage": TransactionCategory.MORTGAGE,
            "utility": TransactionCategory.UTILITIES,
            "utilities": TransactionCategory.UTILITIES,
            "electric": TransactionCategory.UTILITIES,
            "gas bill": TransactionCategory.UTILITIES,
            "water": TransactionCategory.UTILITIES,
            "internet": TransactionCategory.UTILITIES,
            "phone": TransactionCategory.UTILITIES,
            "verizon": TransactionCategory.UTILITIES,
            "att": TransactionCategory.UTILITIES,
            "tmobile": TransactionCategory.UTILITIES,

            # Shopping
            "amazon": TransactionCategory.AMAZON,
            "shopping": TransactionCategory.SHOPPING,
            "clothing": TransactionCategory.CLOTHING,

            # Healthcare
            "pharmacy": TransactionCategory.PHARMACY,
            "cvs": TransactionCategory.PHARMACY,
            "walgreens": TransactionCategory.PHARMACY,
            "healthcare": TransactionCategory.HEALTHCARE,
            "medical": TransactionCategory.HEALTHCARE,
            "doctor": TransactionCategory.HEALTHCARE,

            # Entertainment
            "entertainment": TransactionCategory.ENTERTAINMENT,
            "streaming": TransactionCategory.STREAMING,
            "netflix": TransactionCategory.STREAMING,
            "spotify": TransactionCategory.STREAMING,
            "subscription": TransactionCategory.SUBSCRIPTIONS,

            # Financial
            "atm": TransactionCategory.ATM,
            "withdrawal": TransactionCategory.ATM,
            "fee": TransactionCategory.FEES,
            "service charge": TransactionCategory.FEES,
            "transfer": TransactionCategory.TRANSFER_OUT,
            "savings": TransactionCategory.SAVINGS,
            "investment": TransactionCategory.INVESTMENT,
            "insurance": TransactionCategory.INSURANCE,
        }

        # Check hint first
        for keyword, category in category_mapping.items():
            if keyword in hint_lower:
                return category

        # Then check description
        for keyword, category in category_mapping.items():
            if keyword in desc_lower:
                return category

        return TransactionCategory.OTHER

    def _parse_date_str(self, date_str: Optional[str]) -> Optional[date]:
        """Parse a date string in various formats."""
        if not date_str:
            return None

        date_str = str(date_str).strip()
        if date_str.lower() == "null":
            return None

        # Try common formats
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%m/%d/%y",
            "%m-%d-%Y",
            "%m-%d-%y",
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        return None

    def _parse_decimal(self, value: Any) -> Optional[Decimal]:
        """Parse a numeric value to Decimal."""
        if value is None:
            return None

        if isinstance(value, (int, float)):
            return Decimal(str(value))

        if isinstance(value, str):
            # Remove currency symbols and commas
            cleaned = value.replace("$", "").replace(",", "").strip()
            if cleaned.lower() == "null" or not cleaned:
                return None
            try:
                return Decimal(cleaned)
            except Exception:
                return None

        return None

    def _calculate_confidence(
        self,
        transactions: list[BankTransaction],
        beginning_balance: Optional[Decimal],
        ending_balance: Optional[Decimal],
    ) -> float:
        """
        Calculate confidence score based on extraction quality.

        Factors:
        - Number of transactions extracted
        - Balance reconciliation (if balances provided)
        - Transaction distribution (credits vs debits)
        """
        if not transactions:
            return 0.3

        confidence = self.BASE_CONFIDENCE

        # More transactions = higher confidence (up to a point)
        txn_count = len(transactions)
        if txn_count >= 10:
            confidence += 0.05
        if txn_count >= 25:
            confidence += 0.03

        # Check for reasonable distribution
        credits = sum(1 for t in transactions if not t.is_debit)
        debits = sum(1 for t in transactions if t.is_debit)

        if credits > 0 and debits > 0:
            confidence += 0.02  # Has both income and expenses

        # Balance reconciliation
        if beginning_balance is not None and ending_balance is not None:
            net_change = sum(t.amount for t in transactions)
            expected_ending = beginning_balance + net_change

            # Check if our math matches
            diff = abs(expected_ending - ending_balance)
            if diff < Decimal("0.01"):
                confidence += 0.05  # Perfect reconciliation
            elif diff < Decimal("1.00"):
                confidence += 0.03  # Close enough (rounding)
            elif diff < Decimal("10.00"):
                pass  # Some discrepancy, no adjustment
            else:
                confidence -= 0.05  # Significant discrepancy

        return min(0.95, max(0.4, confidence))


def create_llm_transaction_extractor(api_key: Optional[str] = None) -> Optional[LLMTransactionExtractor]:
    """
    Factory function to create LLMTransactionExtractor if available.

    Returns None if anthropic package is not installed or no API key is available.
    """
    try:
        return LLMTransactionExtractor(api_key=api_key)
    except (ImportError, ValueError):
        return None
