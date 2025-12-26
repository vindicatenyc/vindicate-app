"""
LLM Fallback Extractor for Financial Document Data Extraction.

Uses Claude API to extract structured data when regex extraction fails
or returns low-confidence results.
"""

import json
import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional

from .pdf_parser import DocumentType


@dataclass
class LLMExtractionResult:
    """Result from LLM extraction attempt."""

    success: bool
    extracted_data: dict[str, Any]
    confidence: float  # Base confidence for LLM extraction
    raw_response: str
    tokens_used: int
    error: Optional[str] = None


# Field definitions by document type for LLM extraction
EXTRACTION_SCHEMAS: dict[DocumentType, dict[str, str]] = {
    DocumentType.W2: {
        "employee_name": "Full name of the employee (Box e)",
        "employer_name": "Employer name (Box c)",
        "employer_ein": "Employer Identification Number (Box b)",
        "wages": "Wages, tips, other compensation (Box 1) as a number",
        "federal_tax_withheld": "Federal income tax withheld (Box 2) as a number",
        "social_security_wages": "Social security wages (Box 3) as a number",
        "social_security_tax": "Social security tax withheld (Box 4) as a number",
        "medicare_wages": "Medicare wages and tips (Box 5) as a number",
        "medicare_tax": "Medicare tax withheld (Box 6) as a number",
        "state": "State (Box 15)",
        "state_wages": "State wages (Box 16) as a number",
        "state_tax": "State income tax (Box 17) as a number",
        "tax_year": "Tax year (4-digit year)",
    },
    DocumentType.FORM_1099: {
        "recipient_name": "Recipient's name",
        "payer_name": "Payer's name",
        "income_amount": "Total income/payment amount as a number",
        "federal_tax_withheld": "Federal income tax withheld as a number",
        "form_type": "Type of 1099 (e.g., 1099-INT, 1099-DIV, 1099-MISC, 1099-NEC)",
        "tax_year": "Tax year (4-digit year)",
    },
    DocumentType.PAY_STUB: {
        "employee_name": "Employee's full name",
        "employer_name": "Employer/company name",
        "gross_pay": "Gross pay for this period as a number",
        "net_pay": "Net pay (take-home) for this period as a number",
        "federal_tax": "Federal tax withheld this period as a number",
        "state_tax": "State tax withheld this period as a number",
        "pay_period_start": "Pay period start date (YYYY-MM-DD)",
        "pay_period_end": "Pay period end date (YYYY-MM-DD)",
        "pay_date": "Payment date (YYYY-MM-DD)",
        "ytd_gross": "Year-to-date gross earnings as a number",
        "ytd_federal_tax": "Year-to-date federal tax withheld as a number",
    },
    DocumentType.BANK_STATEMENT: {
        "account_holder_name": "Account holder's full name",
        "bank_name": "Bank/financial institution name",
        "account_type": "Account type (checking, savings, money market)",
        "account_number_last4": "Last 4 digits of account number",
        "statement_start_date": "Statement period start date (YYYY-MM-DD)",
        "statement_end_date": "Statement period end date (YYYY-MM-DD)",
        "beginning_balance": "Beginning balance as a number",
        "ending_balance": "Ending balance as a number",
        "total_deposits": "Total deposits/credits as a number",
        "total_withdrawals": "Total withdrawals/debits as a number",
    },
    DocumentType.RETIREMENT_STATEMENT: {
        "account_holder_name": "Account holder's full name",
        "institution_name": "Financial institution name",
        "account_type": "Account type (401k, IRA, Roth IRA, 403b, pension)",
        "account_number_last4": "Last 4 digits of account number",
        "statement_date": "Statement date (YYYY-MM-DD)",
        "total_balance": "Total account balance as a number",
        "vested_balance": "Vested balance as a number (if different from total)",
        "employer_name": "Employer name (for employer-sponsored plans)",
        "contributions_ytd": "Year-to-date contributions as a number",
        "earnings_ytd": "Year-to-date earnings/gains as a number",
    },
    DocumentType.MORTGAGE_STATEMENT: {
        "borrower_name": "Borrower's full name",
        "lender_name": "Lender/servicer name",
        "property_address": "Property address",
        "loan_number": "Loan number (can be partial)",
        "original_loan_amount": "Original loan amount as a number",
        "current_balance": "Current principal balance as a number",
        "monthly_payment": "Monthly payment amount as a number",
        "interest_rate": "Interest rate as a percentage number",
        "payment_due_date": "Next payment due date (YYYY-MM-DD)",
        "escrow_balance": "Escrow account balance as a number",
    },
    DocumentType.UTILITY_BILL: {
        "account_holder_name": "Account holder's full name",
        "utility_company": "Utility company name",
        "utility_type": "Type of utility (electric, gas, water, internet, phone)",
        "service_address": "Service address",
        "billing_period_start": "Billing period start date (YYYY-MM-DD)",
        "billing_period_end": "Billing period end date (YYYY-MM-DD)",
        "amount_due": "Total amount due as a number",
        "due_date": "Payment due date (YYYY-MM-DD)",
    },
    DocumentType.PROPERTY_TAX: {
        "property_owner_name": "Property owner's full name",
        "property_address": "Property address",
        "parcel_number": "Parcel/tax ID number",
        "assessed_value": "Assessed property value as a number",
        "annual_tax_amount": "Annual property tax amount as a number",
        "tax_year": "Tax year",
        "payment_due_date": "Payment due date (YYYY-MM-DD)",
    },
    DocumentType.INSURANCE_STATEMENT: {
        "policyholder_name": "Policyholder's full name",
        "insurance_company": "Insurance company name",
        "policy_type": "Type of insurance (health, auto, home, life)",
        "policy_number": "Policy number",
        "premium_amount": "Premium amount as a number",
        "premium_frequency": "Premium frequency (monthly, quarterly, annual)",
        "coverage_amount": "Coverage amount/limit as a number",
        "effective_date": "Policy effective date (YYYY-MM-DD)",
        "expiration_date": "Policy expiration date (YYYY-MM-DD)",
    },
    DocumentType.IRS_TRANSCRIPT: {
        "taxpayer_name": "Taxpayer's full name",
        "spouse_name": "Spouse's full name (if joint return)",
        "tax_year": "Tax year",
        "filing_status": "Filing status",
        "adjusted_gross_income": "Adjusted gross income as a number",
        "taxable_income": "Taxable income as a number",
        "total_tax": "Total tax as a number",
        "total_payments": "Total payments/credits as a number",
        "balance_due": "Balance due (if any) as a number",
        "refund_amount": "Refund amount (if any) as a number",
    },
}


class LLMExtractor:
    """
    Use Claude API to extract structured data from financial documents
    when regex extraction fails or returns incomplete results.
    """

    # Base confidence for LLM extractions (can be adjusted based on response quality)
    BASE_CONFIDENCE = 0.7

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the LLM extractor.

        Args:
            api_key: Anthropic API key. If not provided, will use ANTHROPIC_API_KEY env var.

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

    def extract_from_document(
        self,
        document_text: str,
        document_type: DocumentType,
        fields_needed: Optional[list[str]] = None,
        existing_extractions: Optional[dict[str, Any]] = None,
    ) -> LLMExtractionResult:
        """
        Extract structured data from a document using Claude.

        Args:
            document_text: The raw text content of the document.
            document_type: The type of document being processed.
            fields_needed: Specific fields to extract. If None, extracts all fields for doc type.
            existing_extractions: Already extracted data (from regex) to provide context.

        Returns:
            LLMExtractionResult with extracted data and metadata.
        """
        # Get the schema for this document type
        schema = EXTRACTION_SCHEMAS.get(document_type, {})
        if not schema:
            return LLMExtractionResult(
                success=False,
                extracted_data={},
                confidence=0.0,
                raw_response="",
                tokens_used=0,
                error=f"No extraction schema defined for document type: {document_type.value}",
            )

        # Filter to requested fields if specified
        if fields_needed:
            schema = {k: v for k, v in schema.items() if k in fields_needed}

        if not schema:
            return LLMExtractionResult(
                success=False,
                extracted_data={},
                confidence=0.0,
                raw_response="",
                tokens_used=0,
                error="No valid fields to extract",
            )

        # Build the prompt
        prompt = self._build_extraction_prompt(
            document_text=document_text,
            document_type=document_type,
            schema=schema,
            existing_extractions=existing_extractions,
        )

        try:
            # Call Claude API
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            # Parse the response
            raw_response = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens

            # Extract JSON from response
            extracted_data = self._parse_json_response(raw_response)

            if extracted_data is None:
                return LLMExtractionResult(
                    success=False,
                    extracted_data={},
                    confidence=0.0,
                    raw_response=raw_response,
                    tokens_used=tokens_used,
                    error="Failed to parse JSON from LLM response",
                )

            # Calculate confidence based on extraction quality
            confidence = self._calculate_confidence(
                extracted_data=extracted_data,
                schema=schema,
                existing_extractions=existing_extractions,
            )

            return LLMExtractionResult(
                success=True,
                extracted_data=extracted_data,
                confidence=confidence,
                raw_response=raw_response,
                tokens_used=tokens_used,
            )

        except Exception as e:
            return LLMExtractionResult(
                success=False,
                extracted_data={},
                confidence=0.0,
                raw_response="",
                tokens_used=0,
                error=f"API call failed: {str(e)}",
            )

    def _build_extraction_prompt(
        self,
        document_text: str,
        document_type: DocumentType,
        schema: dict[str, str],
        existing_extractions: Optional[dict[str, Any]],
    ) -> str:
        """Build the extraction prompt for Claude."""

        # Format the schema as field descriptions
        field_descriptions = "\n".join(
            f"- {field}: {description}"
            for field, description in schema.items()
        )

        # Add context from existing extractions if available
        context_section = ""
        if existing_extractions:
            context_section = f"""
Some fields have already been extracted (verify or fill in missing):
{json.dumps(existing_extractions, indent=2, default=str)}
"""

        prompt = f"""You are a financial document data extraction assistant. Extract structured data from the following {document_type.value} document.

DOCUMENT TEXT:
---
{document_text[:8000]}
---

FIELDS TO EXTRACT:
{field_descriptions}
{context_section}
INSTRUCTIONS:
1. Extract ONLY the requested fields from the document
2. For monetary amounts, return just the number (no $ signs or commas)
3. For dates, use YYYY-MM-DD format
4. If a field cannot be found, set it to null
5. Be precise - extract exact values as they appear in the document
6. For names, extract the full name as shown

Return ONLY a JSON object with the extracted fields. No explanation or additional text.

Example format:
{{"field_name": "extracted_value", "another_field": 12345.67}}

JSON:"""

        return prompt

    def _parse_json_response(self, response: str) -> Optional[dict[str, Any]]:
        """Parse JSON from LLM response, handling common formatting issues."""

        # Try direct parsing first
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            pass

        # Try to find JSON in response (may have markdown code blocks)
        import re

        # Look for JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Look for standalone JSON object
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        return None

    def _calculate_confidence(
        self,
        extracted_data: dict[str, Any],
        schema: dict[str, str],
        existing_extractions: Optional[dict[str, Any]],
    ) -> float:
        """
        Calculate confidence score for LLM extraction.

        Confidence adjustments:
        - Base: 0.7
        - +0.1 if matches existing regex extraction
        - +0.05 for each field successfully extracted
        - -0.1 for each expected field that is null
        - Capped at 0.95 (never fully confident in LLM)
        """
        confidence = self.BASE_CONFIDENCE

        fields_extracted = 0
        fields_null = 0
        fields_matching = 0

        for field in schema:
            value = extracted_data.get(field)
            if value is not None:
                fields_extracted += 1

                # Check if matches existing extraction
                if existing_extractions and field in existing_extractions:
                    existing_value = existing_extractions[field]
                    if self._values_match(value, existing_value):
                        fields_matching += 1
            else:
                fields_null += 1

        # Adjust confidence
        if fields_extracted > 0:
            extraction_rate = fields_extracted / len(schema)
            confidence += extraction_rate * 0.1  # Up to +0.1 for complete extraction

        if fields_matching > 0 and existing_extractions:
            match_rate = fields_matching / len(existing_extractions)
            confidence += match_rate * 0.1  # Up to +0.1 for matching regex

        if fields_null > 0:
            null_rate = fields_null / len(schema)
            confidence -= null_rate * 0.1  # Up to -0.1 for missing fields

        # Cap at reasonable bounds
        return max(0.3, min(0.95, confidence))

    def _values_match(self, llm_value: Any, regex_value: Any) -> bool:
        """Check if LLM and regex extracted values match (with tolerance for numbers)."""

        # Handle None cases
        if llm_value is None or regex_value is None:
            return llm_value == regex_value

        # Try numeric comparison
        try:
            llm_num = Decimal(str(llm_value))
            regex_num = Decimal(str(regex_value))
            # Allow 1% tolerance for rounding differences
            if regex_num != 0:
                diff = abs((llm_num - regex_num) / regex_num)
                return diff < Decimal("0.01")
            return llm_num == regex_num
        except (ValueError, TypeError, InvalidOperation):
            pass

        # String comparison (case-insensitive, normalized)
        llm_str = str(llm_value).lower().strip()
        regex_str = str(regex_value).lower().strip()
        return llm_str == regex_str


# Import for Decimal comparison
from decimal import InvalidOperation


def create_llm_extractor(api_key: Optional[str] = None) -> Optional[LLMExtractor]:
    """
    Factory function to create LLMExtractor if available.

    Returns None if anthropic package is not installed or no API key is available.
    This allows graceful degradation when LLM is not configured.
    """
    try:
        return LLMExtractor(api_key=api_key)
    except (ImportError, ValueError):
        return None
