#!/usr/bin/env python3
"""
Process Financial Documents for Form 433-A Analysis

This script recursively scans a folder for PDF financial documents,
extracts data, populates Form 433-A models, runs OIC calculations,
and generates comprehensive reports.

Enhanced features:
- Taxpayer/spouse document separation
- Automatic exclusion of non-household member documents
- LLM fallback for difficult extractions
- Extraction audit trail with confidence scoring

Usage:
    python examples/process_documents.py /path/to/documents --taxpayer "John Smith"
    python examples/process_documents.py /path/to/documents --taxpayer "John Smith" --spouse "Jane Smith"
    python examples/process_documents.py /path/to/documents --taxpayer "John" --spouse "Jane" --use-llm-fallback

Document Types Supported:
    - Bank statements
    - Pay stubs
    - W-2 forms
    - 1099 forms
    - IRS transcripts
    - Utility bills
    - 401K/retirement statements
    - Property tax bills
    - Insurance statements
    - Mortgage statements
"""

import argparse
import json
import os
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Look for .env in the package root (parent of examples/)
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars

from vindicate_core import (
    Form433ACalculator,
    Form433AReportGenerator,
    Form433AWorksheetGenerator,
    MonthlyBudgetReportGenerator,
)
from vindicate_core.pdf_parser import PDFParser, DocumentType
from vindicate_core.data_mapper import (
    DocumentDataMapper,
    AggregatedData,
    ExtractionAuditEntry,
    ExcludedDocument,
)
from vindicate_core.transaction_extractor import (
    TransactionExtractor,
    aggregate_monthly_budgets,
)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal and dataclass types."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        if hasattr(obj, '__dataclass_fields__'):
            return {k: self.default(v) for k, v in obj.__dict__.items()}
        return super().default(obj)


def find_pdf_files(folder_path: Path, recursive: bool = True) -> list[Path]:
    """
    Find all PDF files in a folder.

    Args:
        folder_path: Path to the folder to scan
        recursive: Whether to scan subfolders

    Returns:
        List of Path objects for each PDF found
    """
    if recursive:
        return list(folder_path.rglob("*.pdf"))
    else:
        return list(folder_path.glob("*.pdf"))


def format_document_summary(results: list) -> str:
    """Create a summary of documents found by type."""
    type_counts: dict[str, int] = {}
    for result in results:
        doc_type = result.document_type.value
        type_counts[doc_type] = type_counts.get(doc_type, 0) + 1

    lines = ["Documents Found by Type:"]
    lines.append("-" * 40)
    for doc_type, count in sorted(type_counts.items()):
        lines.append(f"  {doc_type}: {count}")
    lines.append("-" * 40)
    lines.append(f"  Total: {len(results)}")
    return "\n".join(lines)


def main():
    """Main entry point for document processing."""
    parser = argparse.ArgumentParser(
        description="Process financial documents for Form 433-A analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single filer
  python process_documents.py ~/Documents/tax_files --taxpayer "John Smith"

  # Married filing jointly
  python process_documents.py ./client_docs --taxpayer "John Smith" --spouse "Jane Smith"

  # With LLM fallback for difficult extractions
  python process_documents.py /path/to/pdfs --taxpayer "John" --spouse "Jane" --use-llm-fallback
        """
    )
    parser.add_argument(
        "folder",
        type=str,
        help="Path to folder containing PDF documents"
    )
    parser.add_argument(
        "--taxpayer", "-t",
        type=str,
        required=True,
        help="Full name of the primary taxpayer (required)"
    )
    parser.add_argument(
        "--spouse", "-s",
        type=str,
        default=None,
        help="Full name of spouse (for married filing jointly)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=".",
        help="Output directory for reports (default: current directory)"
    )
    parser.add_argument(
        "--no-recursive",
        action="store_true",
        help="Don't scan subfolders"
    )
    parser.add_argument(
        "--use-llm-fallback",
        action="store_true",
        help="Use Claude API for difficult extractions (requires ANTHROPIC_API_KEY)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed processing output"
    )
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="Only output extraction summary JSON (no Form 433-A)"
    )
    parser.add_argument(
        "--state",
        type=str,
        default="NY",
        help="State for IRS standards lookup (default: NY for MVP)"
    )
    parser.add_argument(
        "--generate-worksheet",
        action="store_true",
        help="Generate detailed Form 433-A worksheet with IRS line numbers"
    )
    parser.add_argument(
        "--generate-budget",
        action="store_true",
        help="Generate monthly budget from bank statement transactions"
    )
    parser.add_argument(
        "--budget-months",
        type=int,
        default=3,
        help="Number of months to analyze for budget (default: 3)"
    )
    parser.add_argument(
        "--use-llm-transactions",
        action="store_true",
        help="Use Claude LLM for transaction extraction from bank statements (more accurate credit/debit classification, requires ANTHROPIC_API_KEY)"
    )

    args = parser.parse_args()

    # Validate folder path
    folder_path = Path(args.folder).expanduser().resolve()
    if not folder_path.exists():
        print(f"Error: Folder not found: {folder_path}")
        sys.exit(1)
    if not folder_path.is_dir():
        print(f"Error: Not a directory: {folder_path}")
        sys.exit(1)

    # Create output directory
    output_path = Path(args.output).expanduser().resolve()
    output_path.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("VINDICATE CORE - Document Processing Pipeline")
    print("=" * 70)
    print()
    print(f"Scanning:  {folder_path}")
    print(f"Output:    {output_path}")
    print(f"Mode:      {'Recursive' if not args.no_recursive else 'Single folder'}")
    print(f"Taxpayer:  {args.taxpayer}")
    if args.spouse:
        print(f"Spouse:    {args.spouse}")
        print(f"Filing:    Married Filing Jointly")
    else:
        print(f"Filing:    Single")
    print(f"State:     {args.state}")
    if args.use_llm_fallback:
        print(f"LLM:       Enabled (fallback)")
    if args.generate_worksheet:
        print(f"Worksheet: Enabled")
    if args.generate_budget:
        print(f"Budget:    Enabled ({args.budget_months} months)")
    if args.use_llm_transactions:
        print(f"LLM Txns:  Enabled (Claude-based transaction extraction)")
    print()

    # Step 1: Find PDF files
    print("Step 1: Scanning for PDF files...")
    pdf_files = find_pdf_files(folder_path, recursive=not args.no_recursive)

    if not pdf_files:
        print("  No PDF files found.")
        print()
        print("Expected folder structure:")
        print("  your_documents/")
        print("  ├── bank_statements/")
        print("  │   └── chase_jan_2024.pdf")
        print("  ├── pay_stubs/")
        print("  │   └── pay_2024_01_15.pdf")
        print("  ├── tax_docs/")
        print("  │   ├── w2_2023.pdf")
        print("  │   └── 1099_2023.pdf")
        print("  └── bills/")
        print("      └── electric_jan.pdf")
        sys.exit(0)

    print(f"  Found {len(pdf_files)} PDF file(s)")
    if args.verbose:
        for pdf in pdf_files:
            print(f"    - {pdf.relative_to(folder_path)}")
    print()

    # Step 2: Parse PDFs
    print("Step 2: Parsing PDF documents...")
    pdf_parser = PDFParser()
    extraction_results = []
    parse_errors = []

    for i, pdf_file in enumerate(pdf_files, 1):
        rel_path = pdf_file.relative_to(folder_path)
        try:
            if args.verbose:
                print(f"  [{i}/{len(pdf_files)}] Parsing: {rel_path}")
            result = pdf_parser.parse(str(pdf_file))
            extraction_results.append(result)
            if args.verbose:
                print(f"          Type: {result.document_type.value}")
        except Exception as e:
            parse_errors.append((pdf_file, str(e)))
            if args.verbose:
                print(f"          Error: {e}")

    print(f"  Successfully parsed: {len(extraction_results)}")
    if parse_errors:
        print(f"  Errors: {len(parse_errors)}")
        for pdf, error in parse_errors:
            print(f"    - {pdf.name}: {error}")
    print()

    # Show document type summary
    print(format_document_summary(extraction_results))
    print()

    # Step 3: Aggregate data with taxpayer/spouse separation
    print("Step 3: Aggregating financial data...")
    mapper = DocumentDataMapper(
        taxpayer_name=args.taxpayer,
        spouse_name=args.spouse,
        use_llm_fallback=args.use_llm_fallback,
        state_override=args.state,
    )
    aggregated = mapper.process_documents(extraction_results)

    # Display aggregated data
    print(f"  Documents processed: {aggregated.documents_processed}")
    print(f"  Document types: {', '.join(aggregated.document_types_found)}")
    print()

    # Taxpayer info
    taxpayer = aggregated.taxpayer
    print(f"  TAXPAYER: {taxpayer.name}")
    print(f"    Documents matched: {len(taxpayer.documents_matched)}")
    print(f"    W-2s found: {len(taxpayer.w2s)}")
    if taxpayer.annual_wages > 0:
        print(f"    Annual wages: ${taxpayer.annual_wages:,.2f}")
    if taxpayer.employers:
        print(f"    Employers: {', '.join(taxpayer.employers)}")

    # Spouse info
    if aggregated.spouse:
        spouse = aggregated.spouse
        print()
        print(f"  SPOUSE: {spouse.name}")
        print(f"    Documents matched: {len(spouse.documents_matched)}")
        print(f"    W-2s found: {len(spouse.w2s)}")
        if spouse.annual_wages > 0:
            print(f"    Annual wages: ${spouse.annual_wages:,.2f}")
        if spouse.employers:
            print(f"    Employers: {', '.join(spouse.employers)}")

    # Excluded documents
    if aggregated.excluded_documents:
        print()
        print(f"  EXCLUDED DOCUMENTS ({len(aggregated.excluded_documents)}):")
        for excluded in aggregated.excluded_documents:
            file_name = excluded.file_path.split('/')[-1] if excluded.file_path else "unknown"
            print(f"    - {file_name}: {excluded.reason}")

    # Warnings
    if aggregated.warnings:
        print()
        print(f"  WARNINGS ({len(aggregated.warnings)}):")
        for warning in aggregated.warnings:
            print(f"    - {warning}")

    print()

    # Save extraction summary
    summary_file = output_path / "extraction_summary.json"
    summary_data = {
        "scan_folder": str(folder_path),
        "scan_time": datetime.now().isoformat(),
        "total_pdfs_found": len(pdf_files),
        "successful_parses": len(extraction_results),
        "parse_errors": len(parse_errors),
        "document_types": aggregated.document_types_found,
        "taxpayer": {
            "name": taxpayer.name,
            "documents_matched": taxpayer.documents_matched,
            "w2_count": len(taxpayer.w2s),
            "annual_wages": float(taxpayer.annual_wages),
            "employers": taxpayer.employers,
            "federal_tax_withheld": float(taxpayer.federal_tax_withheld),
        },
        "spouse": {
            "name": aggregated.spouse.name if aggregated.spouse else None,
            "documents_matched": aggregated.spouse.documents_matched if aggregated.spouse else [],
            "w2_count": len(aggregated.spouse.w2s) if aggregated.spouse else 0,
            "annual_wages": float(aggregated.spouse.annual_wages) if aggregated.spouse else 0,
            "employers": aggregated.spouse.employers if aggregated.spouse else [],
        } if aggregated.spouse else None,
        "bank_accounts": [
            {
                "institution": acc.institution,
                "type": acc.account_type,
                "balance": float(acc.balance),
                "owner": acc.owner,
                "source_file": acc.source_file,
            }
            for acc in aggregated.bank_accounts
        ],
        "excluded_documents": [
            {
                "file": exc.file_path.split('/')[-1] if exc.file_path else "unknown",
                "owner_name": exc.owner_name,
                "reason": exc.reason,
            }
            for exc in aggregated.excluded_documents
        ],
        "extraction_audit": [
            entry.to_dict() for entry in aggregated.extraction_audit
        ],
        "warnings": aggregated.warnings,
        "errors": [
            {"file": str(pdf), "error": error}
            for pdf, error in parse_errors
        ] + aggregated.errors,
    }

    with open(summary_file, "w") as f:
        json.dump(summary_data, f, indent=2, cls=DecimalEncoder)
    print(f"Saved: {summary_file}")

    if args.json_only:
        print()
        print("=" * 70)
        print("Extraction complete (--json-only mode)")
        print("=" * 70)
        return

    # Step 4: Build Form 433-A
    print()
    print("Step 4: Building Form 433-A...")
    form = mapper.build_form_433a()

    print(f"  Taxpayer: {form.personal_info.first_name} {form.personal_info.last_name}")
    if form.personal_info.spouse_first_name:
        print(f"  Spouse: {form.personal_info.spouse_first_name} {form.personal_info.spouse_last_name}")
    print(f"  State: {form.personal_info.state}")
    print(f"  Filing Status: {form.personal_info.filing_status.value}")
    print(f"  Taxpayer employment records: {len(form.employment)}")
    print(f"  Spouse employment records: {len(form.spouse_employment)}")
    print(f"  Bank accounts: {len(form.bank_accounts)}")
    print(f"  Real property: {len(form.real_property)}")
    print(f"  Vehicles: {len(form.vehicles)}")
    print(f"  Tax periods: {len(form.tax_periods)}")
    print()

    # Step 5: Run OIC calculations
    print("Step 5: Running OIC calculations...")
    calculator = Form433ACalculator()
    result = calculator.calculate(form)

    print(f"  Monthly Gross Income: ${result.total_gross_monthly_income:,.2f}")
    print(f"  IRS Allowed Expenses: ${result.irs_allowed_total_expenses:,.2f}")
    print(f"  Monthly Disposable: ${result.monthly_disposable_income:,.2f}")
    print(f"  Net Realizable Equity: ${result.total_net_realizable_equity:,.2f}")
    print(f"  RCP (Lump Sum): ${result.rcp_lump_sum:,.2f}")
    print(f"  RCP (Periodic): ${result.rcp_periodic:,.2f}")
    print(f"  Qualifies for CNC: {result.qualifies_for_cnc}")
    print(f"  Confidence Level: {result.confidence_level:.0%}")
    print()

    # Step 6: Generate reports
    print("Step 6: Generating reports...")
    report_gen = Form433AReportGenerator()

    # Save text report (with extraction sources)
    report_text = report_gen.generate(form, result, format="text", aggregated_data=aggregated)
    text_file = output_path / "form_433a_report.txt"
    with open(text_file, "w") as f:
        f.write(report_text)
    print(f"  Saved: {text_file}")

    # Save markdown report (with extraction sources)
    report_md = report_gen.generate(form, result, format="markdown", aggregated_data=aggregated)
    md_file = output_path / "form_433a_report.md"
    with open(md_file, "w") as f:
        f.write(report_md)
    print(f"  Saved: {md_file}")

    # Save HTML report (with extraction sources)
    report_html = report_gen.generate(form, result, format="html", aggregated_data=aggregated)
    html_file = output_path / "form_433a_report.html"
    with open(html_file, "w") as f:
        f.write(report_html)
    print(f"  Saved: {html_file}")

    # Try PDF report if available
    try:
        report_pdf = report_gen.generate(form, result, format="pdf", aggregated_data=aggregated)
        if report_pdf:
            pdf_file = output_path / "form_433a_report.pdf"
            with open(pdf_file, "wb") as f:
                f.write(report_pdf)
            print(f"  Saved: {pdf_file}")
    except (ValueError, NotImplementedError):
        pass
    except Exception as e:
        if args.verbose:
            print(f"  PDF generation skipped: {e}")

    # Generate worksheet if requested
    if args.generate_worksheet:
        print()
        print("Step 7: Generating Form 433-A worksheet...")
        worksheet_gen = Form433AWorksheetGenerator(form, result, aggregated)

        # Text worksheet
        worksheet_text = worksheet_gen.generate(format="text")
        ws_text_file = output_path / "form_433a_worksheet.txt"
        with open(ws_text_file, "w") as f:
            f.write(worksheet_text)
        print(f"  Saved: {ws_text_file}")

        # Markdown worksheet
        worksheet_md = worksheet_gen.generate(format="markdown")
        ws_md_file = output_path / "form_433a_worksheet.md"
        with open(ws_md_file, "w") as f:
            f.write(worksheet_md)
        print(f"  Saved: {ws_md_file}")

        # HTML worksheet
        worksheet_html = worksheet_gen.generate(format="html")
        ws_html_file = output_path / "form_433a_worksheet.html"
        with open(ws_html_file, "w") as f:
            f.write(worksheet_html)
        print(f"  Saved: {ws_html_file}")

    # Generate budget if requested
    if args.generate_budget:
        print()
        print("Step 8: Extracting transactions and generating budget...")

        # Find bank statement PDFs and extract transactions
        tx_extractor = TransactionExtractor(
            use_llm=args.use_llm_transactions,
        )
        if args.use_llm_transactions:
            print("  Using Claude LLM for transaction extraction...")
        all_transactions = []

        for result_item in extraction_results:
            if result_item.document_type == DocumentType.BANK_STATEMENT:
                txns = tx_extractor.extract_transactions(result_item.file_path)
                all_transactions.extend(txns)

        if all_transactions:
            print(f"  Extracted {len(all_transactions)} transactions")

            # Aggregate by month
            monthly_budgets = aggregate_monthly_budgets(
                all_transactions,
                months=args.budget_months
            )

            print(f"  Generated {len(monthly_budgets)} monthly budgets")

            # Generate budget report
            budget_gen = MonthlyBudgetReportGenerator()

            # Text budget
            budget_text = budget_gen.generate(monthly_budgets, format="text")
            budget_text_file = output_path / "monthly_budget.txt"
            with open(budget_text_file, "w") as f:
                f.write(budget_text)
            print(f"  Saved: {budget_text_file}")

            # Markdown budget
            budget_md = budget_gen.generate(monthly_budgets, format="markdown")
            budget_md_file = output_path / "monthly_budget.md"
            with open(budget_md_file, "w") as f:
                f.write(budget_md)
            print(f"  Saved: {budget_md_file}")

            # HTML budget
            budget_html = budget_gen.generate(monthly_budgets, format="html")
            budget_html_file = output_path / "monthly_budget.html"
            with open(budget_html_file, "w") as f:
                f.write(budget_html)
            print(f"  Saved: {budget_html_file}")

            # PDF budget with detailed "Other" category breakdown
            budget_pdf_file = output_path / "monthly_budget.pdf"
            if budget_gen.generate_pdf(monthly_budgets, str(budget_pdf_file)):
                print(f"  Saved: {budget_pdf_file}")
            else:
                print("  PDF generation skipped (reportlab not available)")
        else:
            print("  No transactions found in bank statements")

    print()
    print("=" * 70)
    print("Processing Complete!")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  - Processed {aggregated.documents_processed} documents")
    if aggregated.excluded_documents:
        print(f"  - Excluded {len(aggregated.excluded_documents)} documents (non-household)")
    print(f"  - Generated Form 433-A analysis")
    print(f"  - Reports saved to: {output_path}")
    print()

    # Quick analysis
    if result.qualifies_for_cnc:
        print("RESULT: Taxpayer may qualify for Currently Not Collectible (CNC) status")
    elif result.rcp_lump_sum < form.total_tax_liability:
        savings = form.total_tax_liability - result.rcp_lump_sum
        print(f"RESULT: Potential OIC savings of ${savings:,.2f}")
        print(f"        (Liability: ${form.total_tax_liability:,.2f}, RCP: ${result.rcp_lump_sum:,.2f})")
    else:
        print("RESULT: Full pay or Installment Agreement recommended")
        print(f"        (RCP exceeds liability)")


if __name__ == "__main__":
    main()
