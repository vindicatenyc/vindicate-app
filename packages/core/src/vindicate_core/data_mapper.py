"""Data mapper for converting PDF extraction results to Form 433-A models.

This module provides utilities to aggregate data from multiple parsed documents
and construct a complete Form 433-A for OIC analysis.

Enhanced features:
- Taxpayer/spouse document separation
- Bank account ownership tracking
- Extraction audit trail with confidence scoring
- Multiple W-2 aggregation
- Duplicate statement handling
- Non-household member exclusion
"""

import re
from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal
from difflib import SequenceMatcher
from typing import Any, Optional, Literal

import structlog

from .models import (
    Form433A,
    PersonalInfo,
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
from .pdf_parser import DocumentExtractionResult, DocumentType

logger = structlog.get_logger()


# =============================================================================
# EXTRACTION AUDIT TRAIL
# =============================================================================

@dataclass
class ExtractionAuditEntry:
    """Audit entry tracking the source of an extracted value."""
    field: str                  # e.g., "taxpayer.w2_1.wages"
    value: Any                  # The extracted value
    source_file: str            # PDF filename
    source_page: int            # Page number (0 if unknown)
    extraction_method: str      # "regex", "llm", or "aggregated"
    confidence: float           # 0.0-1.0
    raw_text: str               # Original text matched
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "field": self.field,
            "value": float(self.value) if isinstance(self.value, Decimal) else self.value,
            "source_file": self.source_file,
            "source_page": self.source_page,
            "extraction_method": self.extraction_method,
            "confidence": self.confidence,
            "raw_text": self.raw_text[:100] if self.raw_text else "",
            "timestamp": self.timestamp.isoformat(),
        }


# =============================================================================
# PERSON AND ACCOUNT DATA STRUCTURES
# =============================================================================

@dataclass
class W2Data:
    """Data from a single W-2 form."""
    employer_name: str
    wages: Decimal
    federal_tax_withheld: Decimal = Decimal("0")
    state_tax_withheld: Decimal = Decimal("0")
    social_security_withheld: Decimal = Decimal("0")
    medicare_withheld: Decimal = Decimal("0")
    source_file: str = ""


@dataclass
class PersonData:
    """Financial data for one person (taxpayer or spouse)."""
    name: str
    first_name: str = ""
    last_name: str = ""
    ssn_last4: Optional[str] = None

    # Income - list of W-2s to support multiple jobs
    w2s: list[W2Data] = field(default_factory=list)
    other_income: Decimal = Decimal("0")  # 1099, etc.

    # Documents matched to this person
    documents_matched: list[str] = field(default_factory=list)

    @property
    def annual_wages(self) -> Decimal:
        """Total annual wages from all W-2s."""
        return sum(w2.wages for w2 in self.w2s)

    @property
    def federal_tax_withheld(self) -> Decimal:
        """Total federal tax withheld from all W-2s."""
        return sum(w2.federal_tax_withheld for w2 in self.w2s)

    @property
    def state_tax_withheld(self) -> Decimal:
        """Total state tax withheld from all W-2s."""
        return sum(w2.state_tax_withheld for w2 in self.w2s)

    @property
    def employers(self) -> list[str]:
        """List of all employers."""
        return [w2.employer_name for w2 in self.w2s]


OwnerType = Literal["taxpayer", "spouse", "joint", "excluded"]


@dataclass
class BankAccountData:
    """Bank account with ownership tracking."""
    institution: str
    account_type: str  # "checking", "savings", "retirement"
    balance: Decimal
    owner: OwnerType
    owner_name: str  # Actual name from statement
    account_number: str = ""  # Last 4 digits for deduplication
    source_file: str = ""
    statement_date: Optional[date] = None


@dataclass
class ExcludedDocument:
    """A document that was excluded from processing."""
    file_path: str
    owner_name: str
    reason: str


# =============================================================================
# AGGREGATED DATA STRUCTURE
# =============================================================================

@dataclass
class AggregatedData:
    """Aggregated financial data from multiple documents."""

    # Taxpayer and spouse
    taxpayer: PersonData = field(default_factory=lambda: PersonData(name="Unknown"))
    spouse: Optional[PersonData] = None

    # Shared household data
    state: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

    # Bank Accounts with ownership
    bank_accounts: list[BankAccountData] = field(default_factory=list)

    # Living Expenses (monthly) - shared household
    rent_mortgage: Decimal = Decimal("0")
    property_tax_monthly: Decimal = Decimal("0")
    homeowners_insurance: Decimal = Decimal("0")
    utilities_electric: Decimal = Decimal("0")
    utilities_gas: Decimal = Decimal("0")
    utilities_water: Decimal = Decimal("0")
    utilities_phone: Decimal = Decimal("0")  # Landline
    utilities_cell: Decimal = Decimal("0")   # Mobile/cell phones
    utilities_internet: Decimal = Decimal("0")
    utilities_cable: Decimal = Decimal("0")  # Cable TV
    utilities_trash: Decimal = Decimal("0")  # Trash/garbage
    vehicle_insurance: Decimal = Decimal("0")
    vehicle_payment: Decimal = Decimal("0")
    health_insurance: Decimal = Decimal("0")

    # Assets
    property_value: Decimal = Decimal("0")
    mortgage_balance: Decimal = Decimal("0")
    vehicle_value: Decimal = Decimal("0")
    vehicle_loan: Decimal = Decimal("0")
    vehicle_repossessed: bool = False  # Flag if vehicle was repossessed
    vehicle_make_model: str = ""  # e.g., "2020 Infiniti QX60"

    # Tax Liability
    tax_liability: Decimal = Decimal("0")
    tax_years: list[int] = field(default_factory=list)

    # Tracking
    documents_processed: int = 0
    document_types_found: list[str] = field(default_factory=list)
    excluded_documents: list[ExcludedDocument] = field(default_factory=list)
    extraction_audit: list[ExtractionAuditEntry] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


@dataclass
class ProcessingResult:
    """Result of document processing pipeline."""
    form_433a: Form433A
    aggregated_data: AggregatedData
    extraction_audit: list[ExtractionAuditEntry]
    excluded_documents: list[ExcludedDocument]
    warnings: list[str]
    errors: list[str]
    overall_confidence: float


# =============================================================================
# NAME MATCHING UTILITIES
# =============================================================================

def normalize_name(name: str) -> str:
    """Normalize a name for comparison."""
    # Remove common prefixes/suffixes
    name = re.sub(r'\b(Mr|Mrs|Ms|Dr|Jr|Sr|III|II|IV)\b\.?', '', name, flags=re.IGNORECASE)
    # Remove extra whitespace and lowercase
    return ' '.join(name.lower().split())


def name_similarity(name1: str, name2: str) -> float:
    """
    Calculate similarity between two names.

    Returns float between 0.0 and 1.0.
    """
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)

    # Exact match after normalization
    if n1 == n2:
        return 1.0

    # Check if one contains the other (handles first name only matches)
    parts1 = set(n1.split())
    parts2 = set(n2.split())

    # If first and last name match
    if len(parts1 & parts2) >= 2:
        return 0.95

    # If just first name matches
    if parts1 & parts2:
        return 0.7

    # Use sequence matcher for fuzzy matching
    return SequenceMatcher(None, n1, n2).ratio()


def matches_name(extracted_name: str, target_name: str, threshold: float = 0.7) -> bool:
    """Check if extracted name matches target name."""
    return name_similarity(extracted_name, target_name) >= threshold


# =============================================================================
# DOCUMENT DATA MAPPER
# =============================================================================

class DocumentDataMapper:
    """
    Maps extracted PDF data to Form 433-A models.

    This class aggregates data from multiple document extraction results,
    separates taxpayer vs spouse documents, and builds a complete Form 433-A.
    """

    # Regex patterns
    STATE_PATTERN = re.compile(r'\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b')
    NAME_PATTERN = re.compile(
        r'(?i)(?:employee\s+)?name[:\s]*([A-Za-z]+)\s+([A-Za-z]+)',
        re.IGNORECASE
    )
    ACCOUNT_HOLDER_PATTERN = re.compile(
        r'(?i)(?:account\s+holder|name|customer)[:\s]*([A-Za-z]+(?:\s+[A-Za-z]+)+)',
        re.IGNORECASE
    )
    # Additional patterns for paystub name extraction
    EMPLOYEE_NAME_PATTERNS = [
        # "David Rutgos" followed by address (common paystub format)
        re.compile(r'([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*\n\s*\d+\s+[A-Za-z]'),
        # SSN pattern with name before: "John Smith SSN: XXX-XX-XXXX"
        re.compile(r'([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*(?:SSN|Social\s+Security)', re.IGNORECASE),
        # "Paid To: John Smith" or "Employee: John Smith"
        re.compile(r'(?:paid\s+to|employee)[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)', re.IGNORECASE),
        # Name appearing after "Deposited to" line (common in paystubs)
        re.compile(r'(?:deposited|pay\s+date).*?([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*\n', re.IGNORECASE | re.DOTALL),
    ]

    def __init__(
        self,
        taxpayer_name: str,
        spouse_name: Optional[str] = None,
        use_llm_fallback: bool = False,
        state_override: Optional[str] = None,
    ):
        """
        Initialize the data mapper.

        Args:
            taxpayer_name: Full name of the primary taxpayer
            spouse_name: Full name of spouse (for MFJ)
            use_llm_fallback: Whether to use LLM for failed extractions
            state_override: Override state detection (e.g., "NY" for MVP)
        """
        self._taxpayer_name = taxpayer_name
        self._spouse_name = spouse_name
        self._use_llm = use_llm_fallback
        self._llm_extractor = None
        self._state_override = state_override
        self._state_from_priority_doc = None  # State from W-2/paystub (higher priority)

        # Parse names
        taxpayer_parts = taxpayer_name.split()
        self._aggregated = AggregatedData(
            taxpayer=PersonData(
                name=taxpayer_name,
                first_name=taxpayer_parts[0] if taxpayer_parts else "",
                last_name=taxpayer_parts[-1] if len(taxpayer_parts) > 1 else "",
            )
        )

        if spouse_name:
            spouse_parts = spouse_name.split()
            self._aggregated.spouse = PersonData(
                name=spouse_name,
                first_name=spouse_parts[0] if spouse_parts else "",
                last_name=spouse_parts[-1] if len(spouse_parts) > 1 else "",
            )

    def _init_llm_extractor(self):
        """Lazily initialize LLM extractor if needed."""
        if self._llm_extractor is None and self._use_llm:
            try:
                from .llm_extractor import LLMExtractor
                self._llm_extractor = LLMExtractor()
            except ImportError:
                logger.warning("LLM extractor not available")
                self._use_llm = False

    def process_documents(
        self,
        results: list[DocumentExtractionResult]
    ) -> AggregatedData:
        """
        Process multiple document extraction results and aggregate data.

        Args:
            results: List of DocumentExtractionResult from PDF parsing

        Returns:
            AggregatedData with combined information from all documents
        """
        for result in results:
            self._process_document(result)

        self._aggregated.documents_processed = len(results)
        self._finalize_aggregation()
        return self._aggregated

    def _attribute_document(self, result: DocumentExtractionResult) -> tuple[OwnerType, str]:
        """
        Determine who a document belongs to.

        Returns:
            Tuple of (owner_type, extracted_name)
        """
        extracted_name = self._extract_document_owner_name(result)

        if not extracted_name:
            # Can't determine - flag for review but don't exclude
            self._aggregated.warnings.append(
                f"Could not extract owner name from {result.file_path}"
            )
            return ("taxpayer", "Unknown")  # Default to taxpayer

        # Check against taxpayer
        if matches_name(extracted_name, self._taxpayer_name):
            return ("taxpayer", extracted_name)

        # Check against spouse
        if self._spouse_name and matches_name(extracted_name, self._spouse_name):
            return ("spouse", extracted_name)

        # Check if it might be joint (both names appear)
        if self._spouse_name:
            text = result.full_text
            taxpayer_in_doc = any(
                part.lower() in text.lower()
                for part in self._taxpayer_name.split()
            )
            spouse_in_doc = any(
                part.lower() in text.lower()
                for part in self._spouse_name.split()
            )
            if taxpayer_in_doc and spouse_in_doc:
                return ("joint", f"{self._taxpayer_name} & {self._spouse_name}")

        # Name doesn't match taxpayer or spouse - exclude
        return ("excluded", extracted_name)

    def _extract_document_owner_name(self, result: DocumentExtractionResult) -> Optional[str]:
        """Extract the owner/employee name from a document."""
        text = result.full_text

        # Check metadata first (might be set by LLM or field extraction)
        if 'employee_name' in result.metadata:
            name = result.metadata['employee_name']
            if name:
                return name.strip()

        # For paystubs, use specialized patterns
        if result.document_type == DocumentType.PAY_STUB:
            for pattern in self.EMPLOYEE_NAME_PATTERNS:
                match = pattern.search(text)
                if match:
                    name = match.group(1).strip()
                    # Clean up duplicated names (PDF rendering artifacts)
                    # e.g., "David RutgosDavid Rutgos" -> "David Rutgos"
                    words = name.split()
                    if len(words) >= 4:
                        # Check if first half equals second half
                        mid = len(words) // 2
                        if words[:mid] == words[mid:]:
                            name = ' '.join(words[:mid])
                    return name

        # Try employee name pattern (W-2, pay stubs)
        match = self.NAME_PATTERN.search(text)
        if match:
            return f"{match.group(1)} {match.group(2)}"

        # Try account holder pattern (bank statements)
        match = self.ACCOUNT_HOLDER_PATTERN.search(text)
        if match:
            return match.group(1).strip()

        # For paystubs specifically, also try to find name near Social Security Number
        if result.document_type == DocumentType.PAY_STUB:
            # Look for a pattern like "XXX-XX-XXXX" with name before it
            ssn_match = re.search(
                r'([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+).*?(?:XXX-XX-XXXX|X{3}-X{2}-X{4}|\d{3}-\d{2}-\d{4})',
                text,
                re.IGNORECASE | re.DOTALL
            )
            if ssn_match:
                return ssn_match.group(1).strip()

        return None

    def _process_document(self, result: DocumentExtractionResult) -> None:
        """Process a single document extraction result."""
        doc_type = result.document_type
        file_name = result.file_path.split('/')[-1] if result.file_path else "unknown"

        if doc_type.value not in self._aggregated.document_types_found:
            self._aggregated.document_types_found.append(doc_type.value)

        # Attribute document to owner
        owner, owner_name = self._attribute_document(result)

        if owner == "excluded":
            self._aggregated.excluded_documents.append(ExcludedDocument(
                file_path=result.file_path,
                owner_name=owner_name,
                reason=f"Owner '{owner_name}' not taxpayer/spouse",
            ))
            logger.info(
                "document_excluded",
                file_path=result.file_path,
                owner_name=owner_name,
            )
            return

        # Extract shared info (state, address)
        self._extract_shared_info(result)

        # Route to specific handler based on document type
        handlers = {
            DocumentType.W2: self._process_w2,
            DocumentType.PAY_STUB: self._process_paystub,
            DocumentType.BANK_STATEMENT: self._process_bank_statement,
            DocumentType.RETIREMENT_STATEMENT: self._process_retirement,
            DocumentType.UTILITY_BILL: self._process_utility,
            DocumentType.PROPERTY_TAX: self._process_property_tax,
            DocumentType.INSURANCE_STATEMENT: self._process_insurance,
            DocumentType.MORTGAGE_STATEMENT: self._process_mortgage,
            DocumentType.IRS_TRANSCRIPT: self._process_irs_transcript,
            DocumentType.FORM_1099: self._process_1099,
        }

        handler = handlers.get(doc_type)
        if handler:
            handler(result, owner, owner_name)

        # Check for vehicle repossession in any document
        self._check_vehicle_repossession(result)

        # Track document
        if owner == "taxpayer":
            self._aggregated.taxpayer.documents_matched.append(file_name)
        elif owner == "spouse" and self._aggregated.spouse:
            self._aggregated.spouse.documents_matched.append(file_name)

        logger.info(
            "document_processed",
            doc_type=doc_type.value,
            file_path=result.file_path,
            owner=owner,
        )

    def _extract_shared_info(self, result: DocumentExtractionResult) -> None:
        """Extract shared household information with priority-based state detection."""
        text = result.full_text

        # State detection with priority:
        # 1. CLI override (highest priority)
        # 2. W-2/paystub addresses (high priority - taxpayer's employment location)
        # 3. Other documents (lower priority)
        if self._state_override:
            self._aggregated.state = self._state_override
        elif not self._aggregated.state or not self._state_from_priority_doc:
            state_match = self.STATE_PATTERN.search(text)
            if state_match:
                extracted_state = state_match.group(1)
                # High-priority documents: W-2, paystubs (taxpayer's actual location)
                is_priority_doc = result.document_type in (DocumentType.W2, DocumentType.PAY_STUB)

                if is_priority_doc:
                    # Priority document - override any previous state
                    self._aggregated.state = extracted_state
                    self._state_from_priority_doc = extracted_state
                    logger.info(
                        "state_from_priority_doc",
                        state=extracted_state,
                        doc_type=result.document_type.value,
                        file=result.file_path,
                    )
                elif not self._aggregated.state:
                    # No state yet and this is a lower-priority document - use it as fallback
                    self._aggregated.state = extracted_state

    def _check_vehicle_repossession(self, result: DocumentExtractionResult) -> None:
        """Check if document indicates vehicle repossession."""
        text = result.full_text.lower()
        file_name = result.file_path.split('/')[-1] if result.file_path else ""
        file_name_lower = file_name.lower()

        # Only check for repossession in filename or if doc contains strong vehicle + repo context
        # Avoid false positives from documents that just mention "repo" in other contexts
        repo_in_filename = any(kw in file_name_lower for kw in ['repo', 'repossess'])

        # Check for strong repossession context (vehicle-related document with repo keywords)
        vehicle_keywords = ['vehicle', 'car', 'auto', 'infiniti', 'honda', 'toyota', 'ford', 'chevrolet',
                           'bridgecrest', 'santander', 'capital one auto']
        repo_keywords = ['repossess', 'repossession', 'involuntary surrender', 'deficiency balance']

        has_vehicle_context = any(kw in text for kw in vehicle_keywords)
        has_repo_keyword = any(kw in text for kw in repo_keywords)

        is_repo = repo_in_filename or (has_vehicle_context and has_repo_keyword)

        if is_repo:
            self._aggregated.vehicle_repossessed = True

            # Try to extract vehicle make/model from filename or text
            import re
            # Pattern for "YYYY Make Model" e.g., "2020 Infiniti QX60" in filename
            vehicle_match = re.search(
                r'(20\d{2})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)',
                file_name  # Check filename first (more reliable)
            )
            if not vehicle_match:
                # Try in document text
                vehicle_match = re.search(
                    r'(20\d{2})\s+(Infiniti|Honda|Toyota|Ford|Chevrolet|Nissan|BMW|Mercedes|Audi)\s+([A-Za-z0-9]+)',
                    result.full_text,
                    re.IGNORECASE
                )

            if vehicle_match:
                year = vehicle_match.group(1)
                make = vehicle_match.group(2)
                model = vehicle_match.group(3)
                self._aggregated.vehicle_make_model = f"{year} {make} {model}"

            self._aggregated.warnings.append(
                f"Vehicle repossession detected in {file_name}: {self._aggregated.vehicle_make_model or 'unknown vehicle'}"
            )
            logger.info(
                "vehicle_repossession_detected",
                file=file_name,
                vehicle=self._aggregated.vehicle_make_model,
            )

    def _add_audit_entry(
        self,
        field: str,
        value: Any,
        source_file: str,
        extraction_method: str = "regex",
        confidence: float = 1.0,
        raw_text: str = "",
    ) -> None:
        """Add an entry to the extraction audit trail."""
        self._aggregated.extraction_audit.append(ExtractionAuditEntry(
            field=field,
            value=value,
            source_file=source_file.split('/')[-1] if source_file else "",
            source_page=0,
            extraction_method=extraction_method,
            confidence=confidence,
            raw_text=raw_text,
        ))

    def _get_person(self, owner: OwnerType) -> PersonData:
        """Get the appropriate PersonData for owner type."""
        if owner == "spouse" and self._aggregated.spouse:
            return self._aggregated.spouse
        return self._aggregated.taxpayer

    def _process_w2(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process W-2 tax form data."""
        meta = result.metadata
        file_name = result.file_path.split('/')[-1] if result.file_path else ""

        person = self._get_person(owner)
        owner_prefix = "spouse" if owner == "spouse" else "taxpayer"

        # Extract wages
        wages = Decimal("0")
        if 'wages_tips' in meta:
            wages = meta['wages_tips']
        elif 'gross_income' in meta:
            wages = meta['gross_income']

        if wages > 0:
            # Create W2Data entry
            w2 = W2Data(
                employer_name=meta.get('employer_name', 'Unknown Employer'),
                wages=wages,
                federal_tax_withheld=meta.get('federal_income_tax_withheld', Decimal("0")),
                state_tax_withheld=meta.get('state_tax', Decimal("0")),
                social_security_withheld=meta.get('social_security', Decimal("0")),
                medicare_withheld=meta.get('medicare', Decimal("0")),
                source_file=file_name,
            )
            person.w2s.append(w2)

            # Audit trail
            w2_index = len(person.w2s)
            self._add_audit_entry(
                field=f"{owner_prefix}.w2_{w2_index}.wages",
                value=wages,
                source_file=result.file_path,
                confidence=1.0,
                raw_text=f"Wages: {wages}",
            )

    def _process_paystub(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process pay stub data."""
        meta = result.metadata
        file_name = result.file_path.split('/')[-1] if result.file_path else ""
        owner_prefix = "spouse" if owner == "spouse" else "taxpayer"

        person = self._get_person(owner)

        # Extract employer name from metadata or file path
        employer_name = meta.get('employer_name', '')
        if not employer_name:
            # Try to infer from file path (check full path for gig platforms, then filename)
            employer_name = self._extract_employer_from_path(result.file_path, file_name)
        if not employer_name:
            employer_name = 'Unknown Employer'

        # Check if we already have a W-2 for THIS SPECIFIC employer
        # Only skip paystub if we have authoritative W-2 data for the same employer
        existing_w2 = next(
            (w2 for w2 in person.w2s
             if self._employers_match(w2.employer_name, employer_name)
             and w2.source_file and 'paystub' not in w2.source_file.lower()),
            None
        )
        if existing_w2:
            logger.info("paystub_skipped_w2_exists", employer=employer_name, file=file_name)
            return

        # Try to get gross income from various fields
        gross = meta.get('gross_income') or Decimal("0")
        ytd_gross = meta.get('ytd_gross') or Decimal("0")

        if gross <= 0 and ytd_gross <= 0:
            self._aggregated.warnings.append(
                f"No gross pay extracted from paystub: {file_name}"
            )
            return

        # Detect pay frequency from metadata or estimate from pay period dates
        frequency = self._detect_pay_frequency(meta, result.full_text, employer_name)

        # Calculate annual wages
        annual = self._calculate_annual_from_paystub(gross, ytd_gross, frequency, meta)

        if annual <= 0:
            return

        # Check if we already have a paystub-based W2 for this employer
        # If so, update it if the new one has higher YTD (more recent)
        existing_paystub_w2 = next(
            (w2 for w2 in person.w2s
             if self._employers_match(w2.employer_name, employer_name)),
            None
        )

        if existing_paystub_w2:
            # Use the higher annual value (likely more recent or YTD-based)
            if annual > existing_paystub_w2.wages:
                existing_paystub_w2.wages = annual
                existing_paystub_w2.source_file = file_name
                logger.info("paystub_updated", employer=employer_name, wages=annual)
        else:
            # Create a synthetic W2 entry from paystub
            federal_tax = meta.get('federal_tax', Decimal("0"))
            # If we have period federal tax, annualize it
            if frequency and federal_tax > 0:
                annual_federal = self._annualize_amount(federal_tax, frequency)
            else:
                annual_federal = Decimal("0")

            w2 = W2Data(
                employer_name=employer_name,
                wages=annual,
                federal_tax_withheld=annual_federal,
                source_file=file_name,
            )
            person.w2s.append(w2)
            logger.info("paystub_processed", employer=employer_name, wages=annual, frequency=frequency)

        self._add_audit_entry(
            field=f"{owner_prefix}.paystub.{employer_name}.wages",
            value=annual,
            source_file=result.file_path,
            confidence=0.8 if ytd_gross > 0 else 0.7,
            raw_text=f"Gross: {gross}, YTD: {ytd_gross}, Freq: {frequency}",
        )

    def _extract_employer_from_path(self, full_path: str, filename: str) -> str:
        """Extract employer name from file path or filename."""
        import re
        path_lower = full_path.lower() if full_path else ''
        filename_lower = filename.lower()

        # Check for Uber/gig economy in full path or filename
        gig_platforms = {
            'uber': 'Uber',
            'lyft': 'Lyft',
            'doordash': 'DoorDash',
            'grubhub': 'GrubHub',
            'instacart': 'Instacart',
            'postmates': 'Postmates',
        }
        for keyword, name in gig_platforms.items():
            if keyword in path_lower or keyword in filename_lower:
                return name

        # Check for employer folders in path (e.g., "Paystubs/BHFS/...")
        path_parts = full_path.split('/') if full_path else []
        for i, part in enumerate(path_parts):
            if part.lower() == 'paystubs' and i + 1 < len(path_parts):
                # Next folder is likely the employer name
                employer_folder = path_parts[i + 1]
                if employer_folder and not employer_folder.startswith('unlocked'):
                    return employer_folder

        # Try to extract from filename patterns
        patterns = [
            r'^(?:unlocked_)?([A-Z]{2,})\s+(?:Statement|Pay)',  # "BHFS Statement"
            r'^(?:unlocked_)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Statement',  # "Prospect Kids Statement"
        ]
        for pattern in patterns:
            match = re.match(pattern, filename)
            if match and match.lastindex:
                return match.group(1)
        return ''

    def _employers_match(self, name1: str, name2: str) -> bool:
        """Check if two employer names likely refer to the same company."""
        if not name1 or not name2:
            return False
        n1 = name1.lower().strip()
        n2 = name2.lower().strip()

        # Exact match
        if n1 == n2:
            return True

        # One contains the other
        if n1 in n2 or n2 in n1:
            return True

        # Fuzzy match
        from difflib import SequenceMatcher
        return SequenceMatcher(None, n1, n2).ratio() > 0.7

    def _extract_bank_from_path(self, full_path: str) -> str:
        """Extract bank name from folder path (e.g., 'bank-statements/Chase/')."""
        if not full_path:
            return 'Unknown Bank'

        path_parts = full_path.split('/')

        # Look for bank-statements folder and use the next folder as bank name
        for i, part in enumerate(path_parts):
            if part.lower() in ['bank-statements', 'bank_statements', 'bankstatements', 'statements']:
                if i + 1 < len(path_parts):
                    bank_folder = path_parts[i + 1]
                    # Skip if it's a filename
                    if bank_folder and not bank_folder.endswith('.pdf') and not bank_folder.startswith('unlocked'):
                        return bank_folder

        # Fallback: Check for known bank names in path
        known_banks = ['chase', 'bofa', 'bank of america', 'wells fargo', 'citi', 'citibank', 'capital one',
                       'td bank', 'pnc', 'us bank', 'usaa', 'ally', 'discover', 'marcus', 'schwab',
                       'fidelity', 'vanguard', 'synchrony']
        path_lower = full_path.lower()
        for bank in known_banks:
            if bank in path_lower:
                return bank.title()

        return 'Unknown Bank'

    def _extract_account_number(self, filename: str) -> str:
        """Extract last 4 digits of account number from filename."""
        if not filename:
            return ''

        # Common patterns: "statements-3387-", "stmt_3387.pdf", "account-3387.pdf"
        import re
        patterns = [
            r'statements?[-_](\d{4})[-_\.]',  # statements-3387-
            r'[-_](\d{4})[-_\.]pdf',           # -3387.pdf
            r'account[-_]?(\d{4})',            # account3387 or account-3387
            r'[_-](\d{4})[_-]',                # _3387_ or -3387-
        ]

        for pattern in patterns:
            match = re.search(pattern, filename, re.IGNORECASE)
            if match:
                return match.group(1)

        return ''

    def _detect_pay_frequency(self, meta: dict, text: str, employer: str = '') -> str:
        """Detect pay frequency from metadata or text analysis."""
        # Gig economy platforms pay monthly or have monthly summaries
        gig_platforms = ['uber', 'lyft', 'doordash', 'grubhub', 'instacart', 'postmates']
        if any(gig in employer.lower() for gig in gig_platforms):
            return 'monthly'
        if any(gig in text.lower() for gig in gig_platforms):
            return 'monthly'
        if 'monthly summary' in text.lower() or 'tax summary for' in text.lower():
            return 'monthly'

        # Check if explicitly stated in metadata
        if 'pay_frequency' in meta:
            freq = str(meta['pay_frequency']).lower()
            if 'weekly' in freq and 'bi' not in freq:
                return 'weekly'
            if 'bi' in freq or 'bi-weekly' in freq:
                return 'bi_weekly'
            if 'semi' in freq:
                return 'semi_monthly'
            if 'monthly' in freq:
                return 'monthly'

        # Check text for frequency keywords
        text_lower = text.lower()
        if any(kw in text_lower for kw in ['bi-weekly', 'biweekly', 'bi weekly', 'every two weeks', 'every 2 weeks']):
            return 'bi_weekly'
        if any(kw in text_lower for kw in ['semi-monthly', 'semimonthly', 'semi monthly', 'twice a month']):
            return 'semi_monthly'
        if 'weekly' in text_lower and 'bi' not in text_lower:
            return 'weekly'
        if 'monthly' in text_lower and 'semi' not in text_lower:
            return 'monthly'

        # Try to infer from pay period dates if available
        start = meta.get('pay_period_start')
        end = meta.get('pay_period_end')
        if start and end:
            try:
                from datetime import datetime
                # Parse dates in various formats
                for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%Y-%m-%d', '%m/%d/%y']:
                    try:
                        start_date = datetime.strptime(str(start), fmt)
                        end_date = datetime.strptime(str(end), fmt)
                        days = (end_date - start_date).days
                        if days <= 7:
                            return 'weekly'
                        elif days <= 16:
                            return 'bi_weekly'
                        elif days <= 20:
                            return 'semi_monthly'
                        else:
                            return 'monthly'
                    except ValueError:
                        continue
            except Exception:
                pass

        # Default to bi-weekly (most common in US)
        return 'bi_weekly'

    def _calculate_annual_from_paystub(
        self, gross: Decimal, ytd_gross: Decimal, frequency: str, meta: dict
    ) -> Decimal:
        """Calculate annual wages from paystub data."""
        # If we have YTD and it's late in the year, use extrapolation
        if ytd_gross > 0:
            # Try to get pay date to determine how far into the year we are
            pay_date = meta.get('pay_date') or meta.get('pay_period_end')
            if pay_date:
                try:
                    from datetime import datetime
                    for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%Y-%m-%d', '%m/%d/%y']:
                        try:
                            date = datetime.strptime(str(pay_date), fmt)
                            # Calculate what fraction of the year has passed
                            day_of_year = date.timetuple().tm_yday
                            if day_of_year > 30:  # At least a month into the year
                                # Extrapolate: YTD / (days/365)
                                fraction = day_of_year / 365
                                annual = ytd_gross / Decimal(str(fraction))
                                return annual.quantize(Decimal("0.01"))
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass

            # If we can't parse the date, assume YTD is close to annual
            # (conservative estimate)
            return ytd_gross

        # Annualize the period gross using frequency
        return self._annualize_amount(gross, frequency)

    def _annualize_amount(self, amount: Decimal, frequency: str) -> Decimal:
        """Convert period amount to annual using frequency multiplier."""
        multipliers = {
            'weekly': Decimal("52"),
            'bi_weekly': Decimal("26"),
            'semi_monthly': Decimal("24"),
            'monthly': Decimal("12"),
        }
        multiplier = multipliers.get(frequency, Decimal("26"))  # Default bi-weekly
        return (amount * multiplier).quantize(Decimal("0.01"))

    def _process_bank_statement(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process bank statement data."""
        meta = result.metadata
        file_name = result.file_path.split('/')[-1] if result.file_path else ""
        full_path = result.file_path or ""

        if 'ending_balance' not in meta:
            return

        balance = meta['ending_balance']

        # Determine account type based on transaction count
        account_type = "checking" if len(result.amounts) > 10 else "savings"

        # Check for retirement keywords
        text_lower = result.full_text.lower()
        if any(kw in text_lower for kw in ['401k', '401(k)', 'ira', 'retirement', 'roth']):
            account_type = "retirement"

        # Extract institution name from folder path (e.g., "bank-statements/Chase/")
        institution = meta.get('institution_name', '')
        if not institution:
            institution = self._extract_bank_from_path(full_path)

        # Extract account number (last 4 digits) from filename for deduplication
        account_number = self._extract_account_number(file_name)

        # Check for duplicates (same institution, type, owner, AND account number)
        existing = next(
            (acc for acc in self._aggregated.bank_accounts
             if acc.institution == institution
             and acc.account_type == account_type
             and acc.owner == owner
             and getattr(acc, 'account_number', '') == account_number),
            None
        )

        if existing:
            # Use higher balance (conservative for IRS)
            if balance > existing.balance:
                existing.balance = balance
                existing.source_file = file_name
                self._aggregated.warnings.append(
                    f"Duplicate statement for {institution} {account_type} - used higher balance"
                )
        else:
            self._aggregated.bank_accounts.append(BankAccountData(
                institution=institution,
                account_type=account_type,
                balance=balance,
                owner=owner,
                owner_name=owner_name,
                account_number=account_number,
                source_file=file_name,
            ))

        # Include account number in audit trail for clarity
        account_label = f"{institution} {account_type}"
        if account_number:
            account_label += f" (...{account_number})"

        self._add_audit_entry(
            field=f"bank_account.{institution}.{account_type}",
            value=balance,
            source_file=result.file_path,
            confidence=1.0,
            raw_text=f"Ending balance: {balance}",
        )

    def _process_retirement(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process retirement/401K statement data."""
        meta = result.metadata
        file_name = result.file_path.split('/')[-1] if result.file_path else ""

        if 'account_balance' in meta:
            balance = meta['account_balance']
            institution = meta.get('institution_name', 'Retirement Account')

            self._aggregated.bank_accounts.append(BankAccountData(
                institution=institution,
                account_type="retirement",
                balance=balance,
                owner=owner,
                owner_name=owner_name,
                source_file=file_name,
            ))

            self._add_audit_entry(
                field=f"retirement.{institution}",
                value=balance,
                source_file=result.file_path,
                confidence=1.0,
            )

    def _detect_utility_type(self, text: str, filename: str) -> Optional[str]:
        """
        Detect utility type from document text and filename.

        Priority:
        1. Check filename first (most reliable indicator)
        2. Then check document text body
        3. Fall back to provider-based defaults

        Returns:
            Utility type string or None if unrecognized.
        """
        filename_lower = filename.lower()
        text_lower = text.lower()

        # Specific service patterns - checked in filename first, then text
        specific_patterns = [
            ('cell', r'(?:cell\s*phone|mobile\s+phone|wireless\s+phone|cellular)'),
            ('internet', r'(?:internet|broadband|dsl|fiber|fios)'),
            ('cable', r'(?:cable\s+tv|television|hbo|directv|dish)'),
            ('phone', r'(?:landline|home\s+phone|telephone)'),
            ('electric', r'(?:electric|power|energy|con\s*ed|coned|pge|duke\s+energy|national\s+grid)'),
            ('gas', r'(?:\bgas\b|natural\s+gas|keyspan|national\s+fuel)'),
            ('water', r'(?:water|sewer|municipal\s+water)'),
            ('trash', r'(?:trash|garbage|waste|recycling|sanitation)'),
        ]

        # Step 1: Check FILENAME first (most reliable)
        for utype, pattern in specific_patterns:
            if re.search(pattern, filename_lower, re.IGNORECASE):
                return utype

        # Step 2: Check document text body
        for utype, pattern in specific_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return utype

        # Provider-based fallbacks (only if no specific type matched above)
        provider_defaults = {
            'verizon': 'cell',  # Default for Verizon if no specific type found
            'at&t': 'cell',
            't-mobile': 'cell',
            'sprint': 'cell',
            'metro pcs': 'cell',
            'spectrum': 'internet',
            'comcast': 'internet',
            'xfinity': 'internet',
            'optimum': 'internet',
        }

        for provider, default_type in provider_defaults.items():
            if provider in combined:
                return default_type

        return None

    def _process_utility(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process utility bill data (shared household expense)."""
        meta = result.metadata
        text = result.full_text
        file_name = result.file_path.split('/')[-1] if result.file_path else ""

        amount = meta.get('amount_due', Decimal("0"))
        if amount <= 0:
            logger.warning(
                "utility_no_amount",
                file=file_name,
                message="No amount_due extracted from utility bill"
            )
            return

        # Detect utility type using improved pattern matching
        utility_type = self._detect_utility_type(text, file_name)

        if not utility_type:
            logger.warning(
                "utility_type_unknown",
                file=file_name,
                amount=float(amount),
                message="Could not determine utility type - skipping"
            )
            return

        # Map utility type to aggregated data field
        field_map = {
            'electric': 'utilities_electric',
            'gas': 'utilities_gas',
            'water': 'utilities_water',
            'phone': 'utilities_phone',
            'cell': 'utilities_cell',
            'internet': 'utilities_internet',
            'cable': 'utilities_cable',
            'trash': 'utilities_trash',
        }

        field_name = field_map.get(utility_type)
        if field_name:
            current_value = getattr(self._aggregated, field_name)
            setattr(self._aggregated, field_name, max(current_value, amount))

            logger.info(
                "utility_processed",
                type=utility_type,
                amount=float(amount),
                file=file_name,
            )

            self._add_audit_entry(
                field=f"utilities.{utility_type}",
                value=amount,
                source_file=result.file_path,
                confidence=0.9,
                raw_text=f"Amount due: ${amount}",
            )

    def _process_property_tax(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process property tax bill data."""
        meta = result.metadata

        if 'assessed_value' in meta:
            self._aggregated.property_value = max(
                self._aggregated.property_value,
                meta['assessed_value']
            )

        if 'property_tax_amount' in meta:
            annual_tax = meta['property_tax_amount']
            monthly = annual_tax / Decimal("12")
            self._aggregated.property_tax_monthly = max(
                self._aggregated.property_tax_monthly, monthly
            )

            self._add_audit_entry(
                field="property_tax.monthly",
                value=monthly,
                source_file=result.file_path,
                confidence=1.0,
                raw_text=f"Annual: {annual_tax} / 12",
            )

    def _process_insurance(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process insurance statement data."""
        meta = result.metadata
        text = result.full_text.lower()

        if 'premium_amount' not in meta:
            return

        premium = meta['premium_amount']

        if 'auto' in text or 'vehicle' in text or 'car' in text:
            self._aggregated.vehicle_insurance = max(
                self._aggregated.vehicle_insurance, premium
            )
        elif 'home' in text or 'property' in text or 'dwelling' in text:
            self._aggregated.homeowners_insurance = max(
                self._aggregated.homeowners_insurance, premium
            )
        elif 'health' in text or 'medical' in text:
            self._aggregated.health_insurance = max(
                self._aggregated.health_insurance, premium
            )

    def _process_mortgage(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process mortgage statement data."""
        meta = result.metadata

        if 'principal_balance' in meta:
            self._aggregated.mortgage_balance = max(
                self._aggregated.mortgage_balance,
                meta['principal_balance']
            )

        if 'monthly_payment' in meta:
            self._aggregated.rent_mortgage = max(
                self._aggregated.rent_mortgage,
                meta['monthly_payment']
            )

    def _process_irs_transcript(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process IRS transcript data."""
        for amount in result.amounts:
            label_lower = amount.label.lower()
            if 'balance' in label_lower or 'amount due' in label_lower:
                self._aggregated.tax_liability = max(
                    self._aggregated.tax_liability,
                    amount.amount
                )

        for date_entry in result.dates:
            if date_entry.date.year >= 2018:
                if date_entry.date.year not in self._aggregated.tax_years:
                    self._aggregated.tax_years.append(date_entry.date.year)

    def _process_1099(
        self,
        result: DocumentExtractionResult,
        owner: OwnerType,
        owner_name: str,
    ) -> None:
        """Process 1099 form data."""
        meta = result.metadata
        person = self._get_person(owner)

        if 'gross_income' in meta:
            person.other_income += meta['gross_income']

    def _finalize_aggregation(self) -> None:
        """Finalize aggregation after all documents processed."""
        # Calculate overall confidence
        if self._aggregated.extraction_audit:
            confidences = [e.confidence for e in self._aggregated.extraction_audit]
            avg_confidence = sum(confidences) / len(confidences)
        else:
            avg_confidence = 0.0

        # Log summary
        logger.info(
            "aggregation_complete",
            documents_processed=self._aggregated.documents_processed,
            excluded=len(self._aggregated.excluded_documents),
            taxpayer_w2s=len(self._aggregated.taxpayer.w2s),
            spouse_w2s=len(self._aggregated.spouse.w2s) if self._aggregated.spouse else 0,
            bank_accounts=len(self._aggregated.bank_accounts),
            avg_confidence=avg_confidence,
        )

    def build_form_433a(
        self,
        aggregated: Optional[AggregatedData] = None
    ) -> Form433A:
        """
        Build a Form 433-A from aggregated data.

        Args:
            aggregated: Optional AggregatedData (uses internal if not provided)

        Returns:
            Form433A populated with extracted data
        """
        data = aggregated or self._aggregated
        taxpayer = data.taxpayer
        spouse = data.spouse

        # Determine filing status
        filing_status = (
            FilingStatus.MARRIED_FILING_JOINTLY if spouse
            else FilingStatus.SINGLE
        )

        # Personal Info
        personal_info = PersonalInfo(
            first_name=taxpayer.first_name or "Unknown",
            last_name=taxpayer.last_name or "Taxpayer",
            ssn_last_four=taxpayer.ssn_last4,
            state=data.state or "NY",
            street_address=data.address,
            city=data.city,
            zip_code=data.zip_code,
            filing_status=filing_status,
            spouse_first_name=spouse.first_name if spouse else None,
            spouse_last_name=spouse.last_name if spouse else None,
        )

        # Taxpayer Employment
        employment = []
        for i, w2 in enumerate(taxpayer.w2s):
            monthly_gross = w2.wages / Decimal("12")
            employment.append(Employment(
                employer_name=w2.employer_name,
                employment_type=EmploymentType.W2_EMPLOYEE,
                income=IncomeSource(
                    income_type=IncomeType.WAGES,
                    source_name=w2.employer_name,
                    gross_amount=monthly_gross,
                    frequency=IncomeFrequency.MONTHLY,
                    federal_tax_withheld=w2.federal_tax_withheld / Decimal("12"),
                    state_tax_withheld=w2.state_tax_withheld / Decimal("12"),
                    social_security_withheld=w2.social_security_withheld / Decimal("12"),
                    medicare_withheld=w2.medicare_withheld / Decimal("12"),
                ),
            ))

        # Spouse Employment
        spouse_employment = []
        if spouse:
            for w2 in spouse.w2s:
                monthly_gross = w2.wages / Decimal("12")
                spouse_employment.append(Employment(
                    employer_name=w2.employer_name,
                    employment_type=EmploymentType.W2_EMPLOYEE,
                    income=IncomeSource(
                        income_type=IncomeType.WAGES,
                        source_name=w2.employer_name,
                        gross_amount=monthly_gross,
                        frequency=IncomeFrequency.MONTHLY,
                        federal_tax_withheld=w2.federal_tax_withheld / Decimal("12"),
                        state_tax_withheld=w2.state_tax_withheld / Decimal("12"),
                    ),
                ))

        # Other Income
        other_income = []
        total_other = taxpayer.other_income + (spouse.other_income if spouse else Decimal("0"))
        if total_other > 0:
            other_income.append(IncomeSource(
                income_type=IncomeType.SELF_EMPLOYMENT,
                source_name="1099 Income",
                gross_amount=total_other / Decimal("12"),
                frequency=IncomeFrequency.MONTHLY,
            ))

        # Living Expenses - map all 8 utility types
        living_expenses = LivingExpenses(
            rent=data.rent_mortgage if data.mortgage_balance == 0 else Decimal("0"),
            mortgage_payment=data.rent_mortgage if data.mortgage_balance > 0 else Decimal("0"),
            property_taxes=data.property_tax_monthly,
            homeowners_insurance=data.homeowners_insurance,
            utilities_electric=data.utilities_electric,
            utilities_gas=data.utilities_gas,
            utilities_water=data.utilities_water,
            utilities_trash=data.utilities_trash,
            utilities_phone=data.utilities_phone,
            utilities_cell=data.utilities_cell,
            utilities_internet=data.utilities_internet,
            utilities_cable=data.utilities_cable,
            vehicle_insurance=data.vehicle_insurance,
            vehicle_payment_1=data.vehicle_payment,
            health_insurance_premium=data.health_insurance,
        )

        # Bank Accounts (only taxpayer, spouse, or joint)
        bank_accounts = []
        for acc in data.bank_accounts:
            if acc.owner in ("taxpayer", "spouse", "joint"):
                account_type_map = {
                    "checking": AssetType.CHECKING_ACCOUNT,
                    "savings": AssetType.SAVINGS_ACCOUNT,
                    "retirement": AssetType.RETIREMENT_401K,
                }
                bank_accounts.append(BankAccount(
                    institution_name=acc.institution,
                    account_type=account_type_map.get(acc.account_type, AssetType.CHECKING_ACCOUNT),
                    current_balance=acc.balance,
                    is_retirement=acc.account_type == "retirement",
                ))

        # Real Property
        real_property = []
        if data.property_value > 0:
            real_property.append(RealProperty(
                property_type=AssetType.PRIMARY_RESIDENCE,
                address=data.address or "Primary Residence",
                current_market_value=data.property_value,
                mortgage_balance=data.mortgage_balance,
                monthly_payment=data.rent_mortgage,
                is_primary_residence=True,
            ))

        # Vehicles (exclude if repossessed)
        vehicles = []
        if (data.vehicle_insurance > 0 or data.vehicle_payment > 0) and not data.vehicle_repossessed:
            # Try to parse make/model if we have it
            year = 2020
            make = "Unknown"
            model = "Vehicle"
            if data.vehicle_make_model:
                import re
                match = re.match(r'(\d{4})\s+(\w+)\s+(\w+)', data.vehicle_make_model)
                if match:
                    year = int(match.group(1))
                    make = match.group(2)
                    model = match.group(3)

            vehicles.append(Vehicle(
                year=year,
                make=make,
                model=model,
                current_market_value=data.vehicle_value or Decimal("15000"),
                loan_balance=data.vehicle_loan,
                monthly_payment=data.vehicle_payment,
            ))
        elif data.vehicle_repossessed:
            notes_parts = notes_parts if 'notes_parts' in dir() else []
            # Note: we'll add this to notes later

        # Tax Periods
        tax_periods = []
        if data.tax_liability > 0:
            for year in sorted(data.tax_years)[-3:]:
                tax_periods.append(TaxPeriod(
                    tax_year=year,
                    tax_type="income",
                    form_type="1040",
                    original_balance=data.tax_liability / len(data.tax_years) if data.tax_years else data.tax_liability,
                    current_balance=data.tax_liability / len(data.tax_years) if data.tax_years else data.tax_liability,
                ))

        # Build notes with processing summary
        notes_parts = [
            f"Auto-generated from {data.documents_processed} documents.",
            f"Types: {', '.join(data.document_types_found)}",
        ]
        if data.excluded_documents:
            notes_parts.append(f"Excluded: {len(data.excluded_documents)} documents")
        if data.vehicle_repossessed:
            notes_parts.append(f"Vehicle repossessed: {data.vehicle_make_model or 'unknown'} - excluded from assets")

        return Form433A(
            personal_info=personal_info,
            employment=employment,
            spouse_employment=spouse_employment,
            other_income=other_income,
            living_expenses=living_expenses,
            bank_accounts=bank_accounts,
            real_property=real_property,
            vehicles=vehicles,
            tax_periods=tax_periods,
            notes=" ".join(notes_parts),
        )

    def get_processing_result(self) -> ProcessingResult:
        """
        Get the complete processing result.

        Returns:
            ProcessingResult with form, audit trail, and diagnostics
        """
        form = self.build_form_433a()

        # Calculate overall confidence
        if self._aggregated.extraction_audit:
            confidences = [e.confidence for e in self._aggregated.extraction_audit]
            overall_confidence = sum(confidences) / len(confidences)
        else:
            overall_confidence = 0.0

        return ProcessingResult(
            form_433a=form,
            aggregated_data=self._aggregated,
            extraction_audit=self._aggregated.extraction_audit,
            excluded_documents=self._aggregated.excluded_documents,
            warnings=self._aggregated.warnings,
            errors=self._aggregated.errors,
            overall_confidence=overall_confidence,
        )
