"""Report generation for Form 433-A analysis.

This module generates comprehensive reports from Form 433-A calculations,
providing clear summaries and recommendations for OIC submissions.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import Optional, Union

import structlog

from .models import Form433A, Form433AResult, ExpenseAllowance
from .irs_standards import IRS_STANDARDS_VERSION, MINIMUM_OIC_OFFER
from .data_mapper import AggregatedData, ExtractionAuditEntry

logger = structlog.get_logger()

# Try to import reportlab for PDF generation
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        PageBreak,
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


@dataclass
class ReportSection:
    """A section of the report."""
    title: str
    content: str
    subsections: list["ReportSection"] = None  # type: ignore

    def __post_init__(self):
        if self.subsections is None:
            self.subsections = []


class Form433AReportGenerator:
    """
    Generate comprehensive Form 433-A analysis reports.

    Reports include:
    - Executive summary
    - Income analysis
    - Expense breakdown vs IRS standards
    - Asset equity calculations
    - RCP analysis
    - CNC eligibility
    - Recommendations
    """

    def __init__(self):
        """Initialize the report generator."""
        self._sections: list[ReportSection] = []

    def generate(
        self,
        form: Form433A,
        result: Form433AResult,
        format: str = "text",
        aggregated_data: Optional[AggregatedData] = None,
    ) -> Union[str, bytes]:
        """
        Generate a complete Form 433-A analysis report.

        Args:
            form: The Form 433-A data
            result: The calculation result
            format: Output format ("text", "markdown", "html", "pdf")
            aggregated_data: Optional extraction data for source annotations

        Returns:
            Formatted report string, or bytes for PDF format
        """
        self._sections = []
        self._form = form
        self._result = result
        self._aggregated = aggregated_data

        # Build report sections
        self._add_header(form, result)
        self._add_executive_summary(form, result)
        self._add_income_analysis(form, result)
        self._add_expense_analysis(form, result)
        self._add_asset_analysis(form, result)
        self._add_rcp_analysis(result)
        self._add_cnc_analysis(result)
        self._add_recommendations(result)

        # Add extraction sources if available
        if aggregated_data:
            self._add_extraction_sources(aggregated_data)
            if aggregated_data.excluded_documents:
                self._add_excluded_documents(aggregated_data)

        self._add_audit_trail(result)

        # Format output
        if format == "markdown":
            return self._format_markdown()
        elif format == "html":
            return self._format_html()
        elif format == "pdf":
            return self._format_pdf(form, result)
        else:
            return self._format_text()

    def _add_header(self, form: Form433A, result: Form433AResult) -> None:
        """Add report header."""
        personal = form.personal_info
        content = f"""
FORM 433-A FINANCIAL ANALYSIS REPORT
====================================

Prepared for: {personal.first_name} {personal.last_name}
State: {personal.state}
Filing Status: {personal.filing_status.value.replace('_', ' ').title()}
Family Size: {personal.family_size}

Report Date: {datetime.now().strftime('%B %d, %Y')}
IRS Standards Version: {result.irs_standards_version}
Calculator Version: {result.methodology_version}
""".strip()

        self._sections.append(ReportSection(title="Header", content=content))

    def _add_executive_summary(self, form: Form433A, result: Form433AResult) -> None:
        """Add executive summary section."""
        tax_liability = form.total_tax_liability

        # Determine overall status
        if result.qualifies_for_cnc:
            status = "CURRENTLY NOT COLLECTIBLE (CNC) ELIGIBLE"
            status_detail = result.cnc_reason or "Qualifies for hardship status"
        elif result.monthly_disposable_income < 0:
            status = "HARDSHIP OIC CANDIDATE"
            status_detail = "Negative disposable income indicates financial hardship"
        elif result.rcp_lump_sum < tax_liability * Decimal("0.3"):
            status = "STRONG OIC CANDIDATE"
            status_detail = f"RCP is significantly below total liability"
        elif result.rcp_lump_sum < tax_liability:
            status = "MODERATE OIC CANDIDATE"
            status_detail = "RCP is below total liability"
        else:
            status = "FULL PAY OR INSTALLMENT AGREEMENT"
            status_detail = "RCP exceeds or equals total liability"

        content = f"""
STATUS: {status}
{status_detail}

QUICK NUMBERS:
--------------
Monthly Gross Income:      ${result.total_gross_monthly_income:,.2f}
IRS Allowed Expenses:      ${result.irs_allowed_total_expenses:,.2f}
Monthly Disposable Income: ${result.monthly_disposable_income:,.2f}
Total Asset Equity:        ${result.total_net_realizable_equity:,.2f}
Total Tax Liability:       ${tax_liability:,.2f}

OFFER IN COMPROMISE OPTIONS:
----------------------------
Lump Sum Offer (5 months): ${result.minimum_offer_lump_sum:,.2f}
Periodic Offer (24 months): ${result.minimum_offer_periodic:,.2f}

Confidence Level: {result.confidence_level:.0%}
""".strip()

        self._sections.append(ReportSection(title="Executive Summary", content=content))

    def _add_income_analysis(self, form: Form433A, result: Form433AResult) -> None:
        """Add income analysis section."""
        lines = ["INCOME SOURCES:", "-" * 50]

        # Employment income
        for i, emp in enumerate(form.employment, 1):
            inc = emp.income
            lines.append(f"\nEmployment #{i}: {emp.employer_name}")
            lines.append(f"  Type: {emp.employment_type.value.replace('_', ' ').title()}")
            lines.append(f"  Gross: ${inc.gross_amount:,.2f}/{inc.frequency.value}")
            lines.append(f"  Monthly Gross: ${inc.monthly_gross:,.2f}")
            lines.append(f"  Monthly Net: ${inc.monthly_net:,.2f}")

        for i, emp in enumerate(form.spouse_employment, 1):
            inc = emp.income
            lines.append(f"\nSpouse Employment #{i}: {emp.employer_name}")
            lines.append(f"  Monthly Gross: ${inc.monthly_gross:,.2f}")

        # Other income
        if form.other_income:
            lines.append("\nOther Income Sources:")
            for inc in form.other_income:
                lines.append(f"  {inc.income_type.value}: ${inc.monthly_gross:,.2f}/month")

        lines.append("")
        lines.append("-" * 50)
        lines.append(f"TOTAL MONTHLY GROSS INCOME: ${result.total_gross_monthly_income:,.2f}")
        lines.append(f"TOTAL MONTHLY NET INCOME:   ${result.total_net_monthly_income:,.2f}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Income Analysis", content=content))

    def _add_expense_analysis(self, form: Form433A, result: Form433AResult) -> None:
        """Add expense analysis section."""
        lines = [
            "EXPENSE COMPARISON: ACTUAL VS IRS STANDARDS",
            "-" * 60,
            "",
            f"{'Category':<35} {'Actual':>12} {'IRS Std':>12} {'Allowed':>12}",
            "-" * 60,
        ]

        for allowance in result.expense_allowances:
            irs_std = f"${allowance.irs_standard:,.2f}" if allowance.irs_standard else "N/A"
            lines.append(
                f"{allowance.category:<35} "
                f"${allowance.actual_amount:>10,.2f} "
                f"{irs_std:>12} "
                f"${allowance.allowed_amount:>10,.2f}"
            )

        lines.append("-" * 60)
        lines.append(
            f"{'TOTALS':<35} "
            f"${result.actual_total_expenses:>10,.2f} "
            f"{'':>12} "
            f"${result.irs_allowed_total_expenses:>10,.2f}"
        )

        # Add variance analysis
        if result.actual_total_expenses > result.irs_allowed_total_expenses:
            variance = result.actual_total_expenses - result.irs_allowed_total_expenses
            lines.append("")
            lines.append(f"EXPENSE VARIANCE: ${variance:,.2f} over IRS standards")
            lines.append("Documentation may be required to justify excess expenses.")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Expense Analysis", content=content))

    def _add_asset_analysis(self, form: Form433A, result: Form433AResult) -> None:
        """Add asset analysis section."""
        lines = [
            "ASSET EQUITY ANALYSIS",
            "-" * 60,
            "",
            "LIQUID ASSETS (Full Value):",
        ]

        for account in form.bank_accounts:
            if not account.is_retirement:
                lines.append(f"  {account.institution_name} ({account.account_type.value}): ${account.current_balance:,.2f}")

        lines.append(f"  TOTAL LIQUID: ${result.total_liquid_assets:,.2f}")
        lines.append("")

        # Real property
        if form.real_property:
            lines.append("REAL PROPERTY (Quick Sale Value = 80% FMV):")
            for prop in form.real_property:
                lines.append(f"  {prop.address}")
                lines.append(f"    FMV: ${prop.current_market_value:,.2f}")
                lines.append(f"    QSV: ${prop.quick_sale_value:,.2f}")
                lines.append(f"    Less Mortgage: ${prop.mortgage_balance:,.2f}")
                lines.append(f"    Net Equity: ${prop.net_realizable_equity:,.2f}")
            lines.append("")

        # Vehicles
        if form.vehicles:
            lines.append("VEHICLES (Quick Sale Value = 80% FMV):")
            for veh in form.vehicles:
                lines.append(f"  {veh.description}")
                lines.append(f"    FMV: ${veh.current_market_value:,.2f}")
                lines.append(f"    QSV: ${veh.quick_sale_value:,.2f}")
                lines.append(f"    Less Loan: ${veh.loan_balance:,.2f}")
                lines.append(f"    Net Equity: ${veh.net_realizable_equity:,.2f}")
            lines.append("")

        # Retirement accounts (excluded)
        retirement_accounts = [a for a in form.bank_accounts if a.is_retirement]
        if retirement_accounts:
            lines.append("RETIREMENT ACCOUNTS (Generally Exempt):")
            for account in retirement_accounts:
                lines.append(f"  {account.institution_name}: ${account.current_balance:,.2f}")
            lines.append("  Note: Retirement accounts typically excluded from RCP")
            lines.append("")

        lines.append("-" * 60)
        lines.append(f"TOTAL NET REALIZABLE EQUITY: ${result.total_net_realizable_equity:,.2f}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Asset Analysis", content=content))

    def _add_rcp_analysis(self, result: Form433AResult) -> None:
        """Add RCP analysis section."""
        content = f"""
REASONABLE COLLECTION POTENTIAL (RCP) ANALYSIS
-----------------------------------------------

The RCP represents the minimum acceptable offer amount the IRS will consider.
It is calculated as: (Monthly Disposable Income × Multiplier) + Net Asset Equity

LUMP SUM OFFER (paid in 5 months or less):
  Disposable Income: ${result.monthly_disposable_income:,.2f}/month
  × 12 months = ${max(Decimal('0'), result.monthly_disposable_income * 12):,.2f}
  + Net Asset Equity: ${result.total_net_realizable_equity:,.2f}
  ─────────────────────────────────────────────
  RCP (Lump Sum): ${result.rcp_lump_sum:,.2f}
  Minimum Offer: ${result.minimum_offer_lump_sum:,.2f}

PERIODIC PAYMENT OFFER (paid in 6-24 months):
  Disposable Income: ${result.monthly_disposable_income:,.2f}/month
  × 24 months = ${max(Decimal('0'), result.monthly_disposable_income * 24):,.2f}
  + Net Asset Equity: ${result.total_net_realizable_equity:,.2f}
  ─────────────────────────────────────────────
  RCP (Periodic): ${result.rcp_periodic:,.2f}
  Minimum Offer: ${result.minimum_offer_periodic:,.2f}

Note: IRS minimum offer is ${MINIMUM_OIC_OFFER:,.2f} regardless of RCP calculation.
""".strip()

        self._sections.append(ReportSection(title="RCP Analysis", content=content))

    def _add_cnc_analysis(self, result: Form433AResult) -> None:
        """Add CNC analysis section."""
        if result.qualifies_for_cnc:
            status = "QUALIFIES FOR CNC STATUS"
            detail = result.cnc_reason or "Meets CNC criteria"
            recommendation = """
When placed in CNC status:
- Collection activity stops
- No payments required
- Interest and penalties continue to accrue
- IRS reviews status periodically (typically annually)
- CSED (Collection Statute Expiration Date) continues to run
"""
        else:
            status = "DOES NOT QUALIFY FOR CNC"
            detail = "Financial analysis indicates ability to pay"
            recommendation = """
Alternative options to consider:
- Offer in Compromise (OIC)
- Installment Agreement
- Partial Pay Installment Agreement
"""

        content = f"""
CURRENTLY NOT COLLECTIBLE (CNC) ANALYSIS
----------------------------------------

Status: {status}
Reason: {detail}
{recommendation}
""".strip()

        self._sections.append(ReportSection(title="CNC Analysis", content=content))

    def _add_recommendations(self, result: Form433AResult) -> None:
        """Add recommendations section."""
        lines = [
            "RECOMMENDATIONS",
            "-" * 50,
        ]

        if result.warnings:
            lines.append("")
            lines.append("WARNINGS:")
            for warning in result.warnings:
                lines.append(f"  ⚠️  {warning}")

        if result.recommendations:
            lines.append("")
            lines.append("RECOMMENDATIONS:")
            for rec in result.recommendations:
                lines.append(f"  ✓ {rec}")

        # Add general recommendations based on analysis
        lines.append("")
        lines.append("NEXT STEPS:")

        if result.qualifies_for_cnc:
            lines.append("  1. Gather documentation of financial hardship")
            lines.append("  2. Contact IRS or representative to request CNC status")
            lines.append("  3. Monitor for annual CNC reviews")
        elif result.monthly_disposable_income < 0:
            lines.append("  1. Document all expenses exceeding IRS standards")
            lines.append("  2. Consider filing Form 656 (Offer in Compromise)")
            lines.append("  3. Include Form 433-A with detailed documentation")
        else:
            lines.append("  1. Review all expense documentation")
            lines.append("  2. Consider Installment Agreement if OIC not viable")
            lines.append("  3. Consult with tax professional for strategy")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Recommendations", content=content))

    def _add_audit_trail(self, result: Form433AResult) -> None:
        """Add audit trail section."""
        lines = [
            "CALCULATION AUDIT TRAIL",
            "-" * 80,
            "",
            f"{'Step':<30} {'Input':<25} {'Output':<15} {'Source':<30}",
            "-" * 80,
        ]

        for entry in result.audit_log[:20]:  # Limit to first 20 entries
            input_val = entry.input_value[:23] + ".." if len(entry.input_value) > 25 else entry.input_value
            output_val = entry.output_value[:13] + ".." if len(entry.output_value) > 15 else entry.output_value
            source = entry.source[:28] + ".." if len(entry.source) > 30 else entry.source

            lines.append(
                f"{entry.step:<30} "
                f"{input_val:<25} "
                f"{output_val:<15} "
                f"{source:<30}"
            )

        if len(result.audit_log) > 20:
            lines.append(f"... and {len(result.audit_log) - 20} more entries")

        lines.append("")
        lines.append(f"Total audit entries: {len(result.audit_log)}")
        lines.append(f"Calculated at: {result.calculated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Audit Trail", content=content))

    def _add_extraction_sources(self, aggregated: AggregatedData) -> None:
        """Add extraction sources section showing document sources for data."""
        lines = [
            "DATA EXTRACTION SOURCES",
            "-" * 70,
            "",
        ]

        # Taxpayer income sources
        taxpayer = aggregated.taxpayer
        lines.append(f"TAXPAYER: {taxpayer.name}")
        if taxpayer.w2s:
            for i, w2 in enumerate(taxpayer.w2s, 1):
                source = f"[{w2.source_file}]" if w2.source_file else "[unknown]"
                lines.append(f"  W-2 #{i}: {w2.employer_name} - ${w2.wages:,.2f}/year {source}")
            lines.append(f"  TOTAL: ${taxpayer.annual_wages:,.2f}/year ({len(taxpayer.w2s)} W-2s)")
        else:
            lines.append("  No W-2 documents found")
        lines.append("")

        # Spouse income sources
        if aggregated.spouse and aggregated.spouse.w2s:
            spouse = aggregated.spouse
            lines.append(f"SPOUSE: {spouse.name}")
            for i, w2 in enumerate(spouse.w2s, 1):
                source = f"[{w2.source_file}]" if w2.source_file else "[unknown]"
                lines.append(f"  W-2 #{i}: {w2.employer_name} - ${w2.wages:,.2f}/year {source}")
            lines.append(f"  TOTAL: ${spouse.annual_wages:,.2f}/year ({len(spouse.w2s)} W-2s)")
            lines.append("")

        # Bank accounts
        if aggregated.bank_accounts:
            lines.append("BANK ACCOUNTS:")
            for acc in aggregated.bank_accounts:
                owner_label = f"({acc.owner.title()})" if acc.owner != "excluded" else "(Excluded)"
                source = f"[{acc.source_file}]" if acc.source_file else ""
                lines.append(
                    f"  {acc.institution} {acc.account_type.title()} {owner_label}: "
                    f"${acc.balance:,.2f} {source}"
                )
            lines.append("")

        # Extraction audit summary
        if aggregated.extraction_audit:
            lines.append("EXTRACTION AUDIT SUMMARY:")
            lines.append(f"  Total extractions: {len(aggregated.extraction_audit)}")

            # Count by method
            regex_count = sum(1 for e in aggregated.extraction_audit if e.extraction_method == "regex")
            llm_count = sum(1 for e in aggregated.extraction_audit if e.extraction_method == "llm")
            agg_count = sum(1 for e in aggregated.extraction_audit if e.extraction_method == "aggregated")

            lines.append(f"  Regex extractions: {regex_count}")
            if llm_count > 0:
                lines.append(f"  LLM extractions: {llm_count}")
            if agg_count > 0:
                lines.append(f"  Aggregated values: {agg_count}")

            # Average confidence
            confidences = [e.confidence for e in aggregated.extraction_audit]
            avg_conf = sum(confidences) / len(confidences) if confidences else 0
            lines.append(f"  Average confidence: {avg_conf:.1%}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Extraction Sources", content=content))

    def _add_excluded_documents(self, aggregated: AggregatedData) -> None:
        """Add excluded documents section."""
        lines = [
            "EXCLUDED DOCUMENTS",
            "-" * 70,
            "",
            "The following documents were excluded from Form 433-A analysis",
            "because they belong to non-household members:",
            "",
        ]

        for excluded in aggregated.excluded_documents:
            file_name = excluded.file_path.split('/')[-1] if excluded.file_path else "unknown"
            lines.append(f"  - {file_name}")
            lines.append(f"    Owner: \"{excluded.owner_name}\"")
            lines.append(f"    Reason: {excluded.reason}")
            lines.append("")

        lines.append(
            f"Total excluded: {len(aggregated.excluded_documents)} document(s)"
        )
        lines.append("")
        lines.append("Note: Only taxpayer and spouse financial data is included in Form 433-A.")
        lines.append("Documents belonging to dependents or other household members are excluded.")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Excluded Documents", content=content))

    def _format_text(self) -> str:
        """Format report as plain text."""
        output = []

        for section in self._sections:
            if section.title != "Header":
                output.append("")
                output.append("=" * 60)
                output.append(section.title.upper())
                output.append("=" * 60)

            output.append(section.content)

        output.append("")
        output.append("=" * 60)
        output.append("END OF REPORT")
        output.append("=" * 60)
        output.append("")
        output.append("DISCLAIMER: This report is for informational purposes only and")
        output.append("does not constitute legal or tax advice. Consult a qualified")
        output.append("tax professional before making decisions regarding IRS matters.")
        output.append("")
        output.append("Generated by Vindicate Core - https://vindicate.nyc")

        return "\n".join(output)

    def _format_markdown(self) -> str:
        """Format report as Markdown."""
        output = []

        for section in self._sections:
            if section.title == "Header":
                output.append(section.content)
            else:
                output.append(f"\n## {section.title}\n")
                output.append("```")
                output.append(section.content)
                output.append("```")

        output.append("\n---\n")
        output.append("**DISCLAIMER:** This report is for informational purposes only and ")
        output.append("does not constitute legal or tax advice. Consult a qualified ")
        output.append("tax professional before making decisions regarding IRS matters.\n")
        output.append("\n*Generated by [Vindicate Core](https://vindicate.nyc)*")

        return "\n".join(output)

    def _format_html(self) -> str:
        """Format report as HTML."""
        lines = [
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            "<title>Form 433-A Analysis Report</title>",
            "<style>",
            "body { font-family: 'Courier New', monospace; margin: 40px; }",
            "h1 { color: #333; }",
            "h2 { color: #555; border-bottom: 2px solid #333; padding-bottom: 5px; }",
            "pre { background: #f5f5f5; padding: 15px; overflow-x: auto; }",
            ".disclaimer { font-size: 0.9em; color: #666; margin-top: 30px; }",
            "</style>",
            "</head>",
            "<body>",
        ]

        for section in self._sections:
            if section.title == "Header":
                lines.append(f"<pre>{section.content}</pre>")
            else:
                lines.append(f"<h2>{section.title}</h2>")
                lines.append(f"<pre>{section.content}</pre>")

        lines.append('<div class="disclaimer">')
        lines.append("<p><strong>DISCLAIMER:</strong> This report is for informational purposes only and ")
        lines.append("does not constitute legal or tax advice. Consult a qualified ")
        lines.append("tax professional before making decisions regarding IRS matters.</p>")
        lines.append("<p><em>Generated by <a href='https://vindicate.nyc'>Vindicate Core</a></em></p>")
        lines.append("</div>")
        lines.append("</body>")
        lines.append("</html>")

        return "\n".join(lines)

    def _format_pdf(self, form: Form433A, result: Form433AResult) -> bytes:
        """
        Format report as PDF using reportlab.

        Args:
            form: The Form 433-A data
            result: The calculation result

        Returns:
            PDF content as bytes
        """
        if not REPORTLAB_AVAILABLE:
            raise ValueError(
                "PDF generation requires reportlab. "
                "Install with: pip install reportlab"
            )

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        # Create custom styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1a365d'),
        ))
        styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#2c5282'),
            borderWidth=0,
            borderPadding=0,
            borderColor=colors.HexColor('#2c5282'),
        ))
        styles.add(ParagraphStyle(
            name='MonoText',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=9,
            leading=12,
        ))
        styles.add(ParagraphStyle(
            name='Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
        ))

        # Build document elements
        elements = []
        personal = form.personal_info
        tax_liability = form.total_tax_liability

        # Title
        elements.append(Paragraph("FORM 433-A FINANCIAL ANALYSIS REPORT", styles['ReportTitle']))
        elements.append(Spacer(1, 0.2 * inch))

        # Header info table
        header_data = [
            ["Prepared For:", f"{personal.first_name} {personal.last_name}"],
            ["State:", personal.state],
            ["Filing Status:", personal.filing_status.value.replace('_', ' ').title()],
            ["Family Size:", str(personal.family_size)],
            ["Report Date:", datetime.now().strftime('%B %d, %Y')],
            ["IRS Standards:", result.irs_standards_version],
        ]
        header_table = Table(header_data, colWidths=[1.5 * inch, 4 * inch])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Executive Summary
        elements.append(Paragraph("Executive Summary", styles['SectionHeading']))

        # Determine status
        if result.qualifies_for_cnc:
            status = "CURRENTLY NOT COLLECTIBLE (CNC) ELIGIBLE"
            status_color = colors.HexColor('#38a169')
        elif result.monthly_disposable_income < 0:
            status = "HARDSHIP OIC CANDIDATE"
            status_color = colors.HexColor('#38a169')
        elif result.rcp_lump_sum < tax_liability * Decimal("0.3"):
            status = "STRONG OIC CANDIDATE"
            status_color = colors.HexColor('#38a169')
        elif result.rcp_lump_sum < tax_liability:
            status = "MODERATE OIC CANDIDATE"
            status_color = colors.HexColor('#d69e2e')
        else:
            status = "FULL PAY OR INSTALLMENT AGREEMENT"
            status_color = colors.HexColor('#e53e3e')

        # Status box
        status_data = [[status]]
        status_table = Table(status_data, colWidths=[5 * inch])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), status_color),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Quick Numbers table
        quick_data = [
            ["Monthly Gross Income:", f"${result.total_gross_monthly_income:,.2f}"],
            ["IRS Allowed Expenses:", f"${result.irs_allowed_total_expenses:,.2f}"],
            ["Monthly Disposable Income:", f"${result.monthly_disposable_income:,.2f}"],
            ["Total Asset Equity:", f"${result.total_net_realizable_equity:,.2f}"],
            ["Total Tax Liability:", f"${tax_liability:,.2f}"],
            ["", ""],
            ["Lump Sum Offer (5 months):", f"${result.minimum_offer_lump_sum:,.2f}"],
            ["Periodic Offer (24 months):", f"${result.minimum_offer_periodic:,.2f}"],
            ["Confidence Level:", f"{result.confidence_level:.0%}"],
        ]
        quick_table = Table(quick_data, colWidths=[2.5 * inch, 2 * inch])
        quick_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEABOVE', (0, 6), (-1, 6), 1, colors.grey),
        ]))
        elements.append(quick_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Expense Analysis
        elements.append(Paragraph("Expense Analysis", styles['SectionHeading']))

        expense_header = [["Category", "Actual", "IRS Std", "Allowed"]]
        expense_data = []
        for allowance in result.expense_allowances:
            irs_std = f"${allowance.irs_standard:,.0f}" if allowance.irs_standard else "N/A"
            expense_data.append([
                allowance.category[:30],
                f"${allowance.actual_amount:,.0f}",
                irs_std,
                f"${allowance.allowed_amount:,.0f}",
            ])
        expense_data.append([
            "TOTALS",
            f"${result.actual_total_expenses:,.0f}",
            "",
            f"${result.irs_allowed_total_expenses:,.0f}",
        ])

        expense_table = Table(
            expense_header + expense_data,
            colWidths=[2.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch]
        )
        expense_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            # Body
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            # Totals row
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(expense_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Asset Analysis
        elements.append(Paragraph("Asset Equity Summary", styles['SectionHeading']))

        asset_data = [
            ["Asset Type", "Value", "Less Debt", "Net Equity"],
            ["Liquid Assets", f"${result.total_liquid_assets:,.0f}", "$0", f"${result.total_liquid_assets:,.0f}"],
        ]

        # Add real property
        for prop in form.real_property:
            asset_data.append([
                prop.address[:25] + "..." if len(prop.address) > 25 else prop.address,
                f"${prop.quick_sale_value:,.0f}",
                f"${prop.mortgage_balance:,.0f}",
                f"${prop.net_realizable_equity:,.0f}",
            ])

        # Add vehicles
        for veh in form.vehicles:
            asset_data.append([
                veh.description[:25],
                f"${veh.quick_sale_value:,.0f}",
                f"${veh.loan_balance:,.0f}",
                f"${veh.net_realizable_equity:,.0f}",
            ])

        asset_data.append([
            "TOTAL NET REALIZABLE EQUITY",
            "",
            "",
            f"${result.total_net_realizable_equity:,.0f}",
        ])

        asset_table = Table(asset_data, colWidths=[2.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch])
        asset_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(asset_table)
        elements.append(Spacer(1, 0.3 * inch))

        # RCP Analysis
        elements.append(Paragraph("RCP Analysis", styles['SectionHeading']))

        rcp_data = [
            ["Offer Type", "Calculation", "RCP Amount"],
            [
                "Lump Sum (5 months)",
                f"(${result.monthly_disposable_income:,.0f} × 12) + ${result.total_net_realizable_equity:,.0f}",
                f"${result.rcp_lump_sum:,.0f}",
            ],
            [
                "Periodic (6-24 months)",
                f"(${result.monthly_disposable_income:,.0f} × 24) + ${result.total_net_realizable_equity:,.0f}",
                f"${result.rcp_periodic:,.0f}",
            ],
        ]
        rcp_table = Table(rcp_data, colWidths=[1.8 * inch, 3.2 * inch, 1.2 * inch])
        rcp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(rcp_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Recommendations
        elements.append(Paragraph("Recommendations", styles['SectionHeading']))
        if result.recommendations:
            for rec in result.recommendations:
                elements.append(Paragraph(f"• {rec}", styles['Normal']))
        if result.warnings:
            elements.append(Spacer(1, 0.1 * inch))
            for warning in result.warnings:
                elements.append(Paragraph(f"⚠ {warning}", styles['Normal']))

        # Next steps
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Paragraph("<b>Next Steps:</b>", styles['Normal']))
        if result.qualifies_for_cnc:
            steps = [
                "1. Gather documentation of financial hardship",
                "2. Contact IRS or representative to request CNC status",
                "3. Monitor for annual CNC reviews",
            ]
        elif result.monthly_disposable_income < 0:
            steps = [
                "1. Document all expenses exceeding IRS standards",
                "2. Consider filing Form 656 (Offer in Compromise)",
                "3. Include Form 433-A with detailed documentation",
            ]
        else:
            steps = [
                "1. Review all expense documentation",
                "2. Consider Installment Agreement if OIC not viable",
                "3. Consult with tax professional for strategy",
            ]
        for step in steps:
            elements.append(Paragraph(step, styles['Normal']))

        # Disclaimer
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph(
            "DISCLAIMER: This report is for informational purposes only and does not constitute "
            "legal or tax advice. Consult a qualified tax professional before making decisions "
            "regarding IRS matters.",
            styles['Disclaimer']
        ))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph(
            "Generated by Vindicate Core - https://vindicate.nyc",
            styles['Disclaimer']
        ))

        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes


# =============================================================================
# FORM 433-A WORKSHEET GENERATOR
# =============================================================================

class Form433AWorksheetGenerator:
    """
    Generate detailed Form 433-A worksheets with IRS line numbers.

    Maps extracted data to actual IRS form line numbers for
    professional presentation and form completion assistance.
    """

    # IRS Form 433-A line number mappings
    LINE_NUMBERS = {
        # Section 2 - Employment
        'employment_1': '7',
        'employment_2': '8',
        # Section 4 - Bank Accounts
        'checking_1': '13a',
        'checking_2': '13b',
        'savings_1': '13c',
        'retirement': '14',
        # Section 8 - Expenses
        'food_clothing': '23',
        'housing_utilities': '24',
        'transportation': '25',
        'healthcare': '26',
        'court_ordered': '27',
        'childcare': '28',
        'life_insurance': '29',
        'current_taxes': '30',
        'other_secured': '31',
    }

    def __init__(self, form: Form433A, result: Form433AResult, aggregated: Optional[AggregatedData] = None):
        """Initialize worksheet generator."""
        self.form = form
        self.result = result
        self.aggregated = aggregated
        self._sections: list[ReportSection] = []

    def generate(self, format: str = "text") -> Union[str, bytes]:
        """
        Generate Form 433-A worksheet.

        Args:
            format: Output format ("text", "markdown", "html")

        Returns:
            Formatted worksheet
        """
        self._sections = []

        self._add_header()
        self._add_employment_section()
        self._add_bank_accounts_section()
        self._add_expenses_section()
        self._add_summary()

        if format == "markdown":
            return self._format_markdown()
        elif format == "html":
            return self._format_html()
        return self._format_text()

    def _add_header(self) -> None:
        """Add worksheet header."""
        personal = self.form.personal_info
        content = f"""
FORM 433-A COLLECTION INFORMATION STATEMENT - WORKSHEET
========================================================

Taxpayer: {personal.first_name} {personal.last_name}
State: {personal.state}
Filing Status: {personal.filing_status.value.replace('_', ' ').title()}
Date: {datetime.now().strftime('%B %d, %Y')}
""".strip()
        self._sections.append(ReportSection(title="Header", content=content))

    def _add_employment_section(self) -> None:
        """Add Section 2 - Employment information."""
        lines = [
            "SECTION 2 - EMPLOYMENT INFORMATION",
            "=" * 50,
        ]

        for i, emp in enumerate(self.form.employment, 1):
            line_num = f"Line {self.LINE_NUMBERS.get(f'employment_{i}', '?')}"
            inc = emp.income
            lines.append(f"\n{line_num} - Employer #{i}: {emp.employer_name}")
            lines.append(f"  Gross Monthly Income: ${inc.monthly_gross:,.2f}")
            lines.append(f"  Net Monthly Income:   ${inc.monthly_net:,.2f}")
            if self.aggregated:
                # Find source file
                for w2 in self.aggregated.taxpayer.w2s:
                    if w2.employer_name == emp.employer_name:
                        lines.append(f"  Source: {w2.source_file}")
                        break

        if self.form.spouse_employment:
            lines.append("\nSPOUSE EMPLOYMENT:")
            for i, emp in enumerate(self.form.spouse_employment, 1):
                inc = emp.income
                lines.append(f"  Employer: {emp.employer_name}")
                lines.append(f"  Gross Monthly: ${inc.monthly_gross:,.2f}")

        lines.append("")
        lines.append("-" * 50)
        lines.append(f"TOTAL MONTHLY GROSS INCOME: ${self.result.total_gross_monthly_income:,.2f}")
        lines.append(f"TOTAL MONTHLY NET INCOME:   ${self.result.total_net_monthly_income:,.2f}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Employment", content=content))

    def _add_bank_accounts_section(self) -> None:
        """Add Section 4 - Bank accounts."""
        lines = [
            "SECTION 4 - BANK ACCOUNTS AND INVESTMENTS",
            "=" * 50,
        ]

        checking_count = 0
        savings_count = 0

        for acc in self.form.bank_accounts:
            if acc.is_retirement:
                line_num = f"Line {self.LINE_NUMBERS['retirement']}"
                exempt = " [EXEMPT]"
            elif acc.account_type.value == "checking_account":
                checking_count += 1
                line_num = f"Line {self.LINE_NUMBERS.get(f'checking_{checking_count}', '13')}"
                exempt = ""
            else:
                savings_count += 1
                line_num = f"Line {self.LINE_NUMBERS.get(f'savings_{savings_count}', '13')}"
                exempt = ""

            lines.append(f"{line_num} - {acc.institution_name} ({acc.account_type.value}): ${acc.current_balance:,.2f}{exempt}")

        lines.append("")
        lines.append("-" * 50)
        lines.append(f"TOTAL LIQUID ASSETS: ${self.result.total_liquid_assets:,.2f}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Bank Accounts", content=content))

    def _add_expenses_section(self) -> None:
        """Add Section 8 - Living expenses with IRS standards comparison."""
        lines = [
            "SECTION 8 - MONTHLY LIVING EXPENSES",
            "=" * 60,
            "",
            f"{'Line':<8} {'Category':<30} {'Actual':>10} {'IRS Std':>10} {'Allowed':>10}",
            "-" * 60,
        ]

        exp = self.form.living_expenses

        # Build expense items with breakdowns
        expense_items = []

        # Line 23 - Food, Clothing, etc. (National Standards)
        food_total = exp.food + exp.clothing + exp.personal_care + exp.miscellaneous
        expense_items.append({
            'line': '23',
            'category': 'Food, Clothing & Misc',
            'actual': food_total,
            'details': []
        })

        # Line 24 - Housing and Utilities
        housing_total = (exp.rent + exp.mortgage_payment + exp.property_taxes +
                         exp.homeowners_insurance + exp.utilities_electric +
                         exp.utilities_gas + exp.utilities_water + exp.utilities_trash +
                         exp.utilities_phone + exp.utilities_cell + exp.utilities_internet +
                         exp.utilities_cable)
        housing_details = []
        if exp.rent > 0:
            housing_details.append(f"  Rent: ${exp.rent:,.2f}")
        if exp.mortgage_payment > 0:
            housing_details.append(f"  Mortgage: ${exp.mortgage_payment:,.2f}")
        if exp.utilities_electric > 0:
            housing_details.append(f"  Electric: ${exp.utilities_electric:,.2f}")
        if exp.utilities_gas > 0:
            housing_details.append(f"  Gas: ${exp.utilities_gas:,.2f}")
        if exp.utilities_cell > 0:
            housing_details.append(f"  Cell Phone: ${exp.utilities_cell:,.2f}")
        if exp.utilities_internet > 0:
            housing_details.append(f"  Internet: ${exp.utilities_internet:,.2f}")
        if exp.utilities_cable > 0:
            housing_details.append(f"  Cable: ${exp.utilities_cable:,.2f}")

        expense_items.append({
            'line': '24',
            'category': 'Housing & Utilities',
            'actual': housing_total,
            'details': housing_details
        })

        # Line 25 - Transportation
        transport_total = (exp.vehicle_payment_1 + exp.vehicle_payment_2 +
                          exp.vehicle_insurance + exp.vehicle_gas +
                          exp.public_transportation + exp.parking_tolls)
        expense_items.append({
            'line': '25',
            'category': 'Transportation',
            'actual': transport_total,
            'details': []
        })

        # Line 26 - Healthcare
        healthcare_total = (exp.health_insurance_premium + exp.out_of_pocket_medical +
                           exp.prescriptions)
        expense_items.append({
            'line': '26',
            'category': 'Healthcare',
            'actual': healthcare_total,
            'details': []
        })

        # Map to IRS standards from result
        for item in expense_items:
            # Find matching allowance from result
            allowance = next(
                (a for a in self.result.expense_allowances
                 if item['category'].lower() in a.category.lower() or
                 a.category.lower() in item['category'].lower()),
                None
            )
            irs_std = allowance.irs_standard if allowance else None
            allowed = allowance.allowed_amount if allowance else item['actual']

            std_str = f"${irs_std:,.2f}" if irs_std else "N/A"
            lines.append(
                f"Line {item['line']:<3} {item['category']:<30} "
                f"${item['actual']:>8,.2f} {std_str:>10} ${allowed:>8,.2f}"
            )
            for detail in item['details']:
                lines.append(detail)

        lines.append("-" * 60)
        lines.append(
            f"{'TOTALS':<12} {'':<26} "
            f"${self.result.actual_total_expenses:>8,.2f} "
            f"{'':>10} "
            f"${self.result.irs_allowed_total_expenses:>8,.2f}"
        )

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Expenses", content=content))

    def _add_summary(self) -> None:
        """Add summary calculations."""
        content = f"""
SUMMARY CALCULATIONS
====================

Monthly Gross Income:           ${self.result.total_gross_monthly_income:,.2f}
Less: IRS Allowed Expenses:    -${self.result.irs_allowed_total_expenses:,.2f}
                                ──────────────
MONTHLY DISPOSABLE INCOME:      ${self.result.monthly_disposable_income:,.2f}

Total Liquid Assets:            ${self.result.total_liquid_assets:,.2f}
Total Asset Equity (NRE):       ${self.result.total_net_realizable_equity:,.2f}

REASONABLE COLLECTION POTENTIAL:
  Lump Sum (12 × MDI + NRE):    ${self.result.rcp_lump_sum:,.2f}
  Periodic (24 × MDI + NRE):    ${self.result.rcp_periodic:,.2f}
""".strip()
        self._sections.append(ReportSection(title="Summary", content=content))

    def _format_text(self) -> str:
        """Format as plain text."""
        output = []
        for section in self._sections:
            output.append(section.content)
            output.append("")
        return "\n".join(output)

    def _format_markdown(self) -> str:
        """Format as Markdown."""
        output = []
        for section in self._sections:
            if section.title != "Header":
                output.append(f"\n## {section.title}\n")
            output.append("```")
            output.append(section.content)
            output.append("```")
        return "\n".join(output)

    def _format_html(self) -> str:
        """Format as HTML."""
        lines = [
            "<!DOCTYPE html>",
            "<html><head><title>Form 433-A Worksheet</title>",
            "<style>body{font-family:monospace;margin:40px;}pre{background:#f5f5f5;padding:15px;}</style>",
            "</head><body>",
        ]
        for section in self._sections:
            if section.title != "Header":
                lines.append(f"<h2>{section.title}</h2>")
            lines.append(f"<pre>{section.content}</pre>")
        lines.append("</body></html>")
        return "\n".join(lines)


# =============================================================================
# MONTHLY BUDGET REPORT GENERATOR
# =============================================================================

class MonthlyBudgetReportGenerator:
    """
    Generate monthly budget reports from bank statement transactions.

    Provides spending analysis by category for financial planning
    and Form 433-A expense documentation.
    """

    def __init__(self):
        """Initialize budget report generator."""
        self._sections: list[ReportSection] = []

    def generate(
        self,
        budgets: list,  # List[MonthlyBudget]
        format: str = "text",
    ) -> str:
        """
        Generate monthly budget report.

        Args:
            budgets: List of MonthlyBudget objects
            format: Output format ("text", "markdown", "html", "pdf")

        Returns:
            Formatted report (or empty string for PDF which writes to file)
        """
        from .models import BudgetAnalysis
        from .transaction_extractor import build_budget_analysis

        self._sections = []
        self._budgets = budgets  # Store for PDF generation

        if not budgets:
            return "No budget data available."

        # Build analysis
        analysis = build_budget_analysis(budgets)
        self._analysis = analysis  # Store for PDF generation

        self._add_header(analysis)
        self._add_overview(analysis)

        for budget in budgets:
            self._add_month_detail(budget)

        self._add_trends(analysis)

        if format == "markdown":
            return self._format_markdown()
        elif format == "html":
            return self._format_html()
        elif format == "pdf":
            return ""  # PDF is generated separately via generate_pdf()
        return self._format_text()

    def generate_pdf(self, budgets: list, output_path: str) -> bool:
        """
        Generate PDF budget report with detailed breakdown.

        Args:
            budgets: List of MonthlyBudget objects
            output_path: Path to write PDF file

        Returns:
            True if successful, False otherwise
        """
        if not REPORTLAB_AVAILABLE:
            logger.warning("reportlab not available - PDF generation disabled")
            return False

        from .transaction_extractor import build_budget_analysis
        from .models import TransactionCategory

        if not budgets:
            return False

        analysis = build_budget_analysis(budgets)
        return self._generate_pdf_report(budgets, analysis, output_path)

    def _generate_pdf_report(self, budgets: list, analysis, output_path: str) -> bool:
        """Generate the actual PDF report."""
        from .models import TransactionCategory

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            rightMargin=0.5 * inch,
        )

        # Define styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1a365d'),
        ))
        styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#2c5282'),
        ))
        styles.add(ParagraphStyle(
            name='MonthHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=8,
            spaceBefore=15,
            textColor=colors.HexColor('#2d3748'),
        ))
        styles.add(ParagraphStyle(
            name='SmallText',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
        ))
        styles.add(ParagraphStyle(
            name='TinyText',
            parent=styles['Normal'],
            fontSize=7,
            leading=9,
            textColor=colors.HexColor('#666666'),
        ))

        elements = []

        # ===== PAGE 1: SUMMARY =====
        elements.append(Paragraph("MONTHLY BUDGET ANALYSIS", styles['ReportTitle']))
        elements.append(Spacer(1, 0.2 * inch))

        # Date range
        date_range = ""
        if analysis.date_range_start and analysis.date_range_end:
            date_range = f"{analysis.date_range_start.strftime('%b %Y')} - {analysis.date_range_end.strftime('%b %Y')}"

        header_data = [
            ["Analysis Period:", date_range],
            ["Total Months:", str(len(budgets))],
            ["Report Generated:", datetime.now().strftime('%B %d, %Y')],
        ]
        header_table = Table(header_data, colWidths=[1.5 * inch, 3 * inch])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Monthly Averages Summary
        elements.append(Paragraph("Monthly Averages", styles['SectionHeading']))

        savings_rate = Decimal("0")
        if analysis.avg_monthly_income > 0:
            savings_rate = (analysis.avg_net_cashflow / analysis.avg_monthly_income) * 100

        avg_data = [
            ["Average Monthly Income:", f"${analysis.avg_monthly_income:,.2f}"],
            ["Average Monthly Expenses:", f"${analysis.avg_monthly_expenses:,.2f}"],
            ["Average Net Cashflow:", f"${analysis.avg_net_cashflow:,.2f}"],
            ["Savings Rate:", f"{savings_rate:.1f}%"],
        ]
        avg_table = Table(avg_data, colWidths=[2.5 * inch, 2 * inch])
        avg_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(avg_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Top Expense Categories
        elements.append(Paragraph("Top Expense Categories (Monthly Average)", styles['SectionHeading']))

        top_cat_data = [["Category", "Average"]]
        for cat, avg in analysis.top_expense_categories[:8]:
            cat_name = cat.value.replace('_', ' ').title()
            top_cat_data.append([cat_name, f"${avg:,.2f}"])

        top_cat_table = Table(top_cat_data, colWidths=[3 * inch, 1.5 * inch])
        top_cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(top_cat_table)
        elements.append(PageBreak())

        # ===== DETAILED PAGES FOR EACH MONTH =====
        for budget in budgets:
            elements.append(Paragraph(f"Detail: {budget.month}", styles['SectionHeading']))

            # Income section
            income_cats = [TransactionCategory.INCOME, TransactionCategory.PAYCHECK, TransactionCategory.TRANSFER_IN]
            income_data = [["Income Source", "Amount"]]
            for cat in income_cats:
                if cat in budget.categories and budget.categories[cat] > 0:
                    income_data.append([cat.value.replace('_', ' ').title(), f"${budget.categories[cat]:,.2f}"])
            income_data.append(["TOTAL INCOME", f"${budget.total_income:,.2f}"])

            income_table = Table(income_data, colWidths=[3 * inch, 1.5 * inch])
            income_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#38a169')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(income_table)
            elements.append(Spacer(1, 0.15 * inch))

            # Expense section
            expense_data = [["Expense Category", "Amount", "Txns"]]
            for summary in sorted(budget.category_details, key=lambda x: x.total, reverse=True):
                if summary.category not in income_cats and summary.total > 0:
                    cat_name = summary.category.value.replace('_', ' ').title()
                    expense_data.append([cat_name, f"${summary.total:,.2f}", str(summary.count)])
            expense_data.append(["TOTAL EXPENSES", f"${budget.total_expenses:,.2f}", ""])

            expense_table = Table(expense_data, colWidths=[3 * inch, 1.2 * inch, 0.6 * inch])
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e53e3e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(expense_table)
            elements.append(Spacer(1, 0.15 * inch))

            # Net cashflow
            cf_sign = "+" if budget.net_cashflow >= 0 else ""
            cf_color = colors.HexColor('#38a169') if budget.net_cashflow >= 0 else colors.HexColor('#e53e3e')
            cf_data = [[f"NET CASHFLOW: {cf_sign}${budget.net_cashflow:,.2f}"]]
            cf_table = Table(cf_data, colWidths=[4.8 * inch])
            cf_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), cf_color),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(cf_table)
            elements.append(Spacer(1, 0.2 * inch))

            # ===== "OTHER" CATEGORY DETAIL =====
            other_summary = None
            for summary in budget.category_details:
                if summary.category == TransactionCategory.OTHER and summary.transactions:
                    other_summary = summary
                    break

            if other_summary and other_summary.transactions:
                elements.append(Paragraph(f'"Other" Category Detail - {len(other_summary.transactions)} transactions', styles['MonthHeading']))

                other_data = [["Date", "Description", "Amount", "Source File"]]
                for txn in sorted(other_summary.transactions, key=lambda x: x.abs_amount, reverse=True)[:50]:
                    desc = txn.description[:40] + "..." if len(txn.description) > 40 else txn.description
                    source = txn.source_file[:25] + "..." if len(txn.source_file) > 25 else txn.source_file
                    other_data.append([
                        txn.date.strftime('%m/%d'),
                        desc,
                        f"${txn.abs_amount:,.2f}",
                        source,
                    ])

                if len(other_summary.transactions) > 50:
                    other_data.append(["", f"... and {len(other_summary.transactions) - 50} more transactions", "", ""])

                other_table = Table(other_data, colWidths=[0.6 * inch, 2.8 * inch, 0.9 * inch, 2.2 * inch])
                other_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#718096')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 7),
                    ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))
                elements.append(other_table)

            elements.append(PageBreak())

        # Build PDF
        try:
            doc.build(elements)
            return True
        except Exception as e:
            logger.error("pdf_generation_failed", error=str(e))
            return False

    def _add_header(self, analysis) -> None:
        """Add report header."""
        date_range = ""
        if analysis.date_range_start and analysis.date_range_end:
            date_range = f"{analysis.date_range_start.strftime('%b %Y')} - {analysis.date_range_end.strftime('%b %Y')}"

        content = f"""
MONTHLY BUDGET ANALYSIS
=======================

Analysis Period: {date_range}
Total Months: {len(analysis.months)}
Generated: {datetime.now().strftime('%B %d, %Y')}
""".strip()
        self._sections.append(ReportSection(title="Header", content=content))

    def _add_overview(self, analysis) -> None:
        """Add overview section."""
        savings_rate = Decimal("0")
        if analysis.avg_monthly_income > 0:
            savings_rate = (analysis.avg_net_cashflow / analysis.avg_monthly_income) * 100

        content = f"""
MONTHLY AVERAGES
================

Average Monthly Income:    ${analysis.avg_monthly_income:,.2f}
Average Monthly Expenses:  ${analysis.avg_monthly_expenses:,.2f}
Average Net Cashflow:      ${analysis.avg_net_cashflow:,.2f}
Savings Rate:              {savings_rate:.1f}%

TOP EXPENSE CATEGORIES (Monthly Average):
""".strip()

        lines = [content]
        for cat, avg in analysis.top_expense_categories[:5]:
            lines.append(f"  {cat.value.replace('_', ' ').title():<25} ${avg:,.2f}")

        self._sections.append(ReportSection(title="Overview", content="\n".join(lines)))

    def _add_month_detail(self, budget) -> None:
        """Add detail for a single month."""
        from .models import TransactionCategory

        lines = [
            f"{budget.month}",
            "-" * 40,
        ]

        # Income
        lines.append("\nINCOME:")
        income_cats = [TransactionCategory.INCOME, TransactionCategory.PAYCHECK, TransactionCategory.TRANSFER_IN]
        for cat in income_cats:
            if cat in budget.categories and budget.categories[cat] > 0:
                lines.append(f"  {cat.value.replace('_', ' ').title():<25} ${budget.categories[cat]:,.2f}")
        lines.append(f"  {'SUBTOTAL':<25} ${budget.total_income:,.2f}")

        # Expenses
        lines.append("\nEXPENSES:")
        for summary in sorted(budget.category_details, key=lambda x: x.total, reverse=True):
            if summary.category not in income_cats and summary.total > 0:
                cat_name = summary.category.value.replace('_', ' ').title()
                lines.append(f"  {cat_name:<25} ${summary.total:,.2f} ({summary.count} txns)")

        lines.append(f"  {'SUBTOTAL':<25} ${budget.total_expenses:,.2f}")

        # Net
        lines.append("")
        cashflow_sign = "+" if budget.net_cashflow >= 0 else ""
        lines.append(f"NET CASHFLOW:{' ' * 13} {cashflow_sign}${budget.net_cashflow:,.2f}")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title=budget.month, content=content))

    def _add_trends(self, analysis) -> None:
        """Add trends and recommendations."""
        lines = [
            "INSIGHTS & RECOMMENDATIONS",
            "=" * 40,
        ]

        if analysis.spending_trends:
            lines.append("\nTrends:")
            for trend in analysis.spending_trends:
                lines.append(f"  • {trend}")

        if analysis.recommendations:
            lines.append("\nRecommendations:")
            for rec in analysis.recommendations:
                lines.append(f"  • {rec}")

        if not analysis.spending_trends and not analysis.recommendations:
            lines.append("\nNo specific recommendations at this time.")

        content = "\n".join(lines)
        self._sections.append(ReportSection(title="Insights", content=content))

    def _format_text(self) -> str:
        """Format as plain text."""
        output = []
        for section in self._sections:
            output.append(section.content)
            output.append("")
        return "\n".join(output)

    def _format_markdown(self) -> str:
        """Format as Markdown."""
        output = []
        for section in self._sections:
            if section.title != "Header":
                output.append(f"\n## {section.title}\n")
            output.append("```")
            output.append(section.content)
            output.append("```")
        return "\n".join(output)

    def _format_html(self) -> str:
        """Format as HTML."""
        lines = [
            "<!DOCTYPE html>",
            "<html><head><title>Monthly Budget Analysis</title>",
            "<style>body{font-family:monospace;margin:40px;}pre{background:#f5f5f5;padding:15px;}</style>",
            "</head><body>",
        ]
        for section in self._sections:
            if section.title != "Header":
                lines.append(f"<h2>{section.title}</h2>")
            lines.append(f"<pre>{section.content}</pre>")
        lines.append("</body></html>")
        return "\n".join(lines)
