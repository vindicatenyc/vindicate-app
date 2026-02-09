/**
 * Normalization functions — take extracted document data and insert/update
 * records in the appropriate database tables.
 *
 * All functions are idempotent (safe to run multiple times).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankStatementExtraction } from "./schemas/bank-statement";
import type { CreditReportExtraction } from "./schemas/credit-report";
import type { PayStubExtraction } from "./schemas/pay-stub";
import type { MedicalBillExtraction } from "./schemas/medical-bill";
import type { TaxDocumentExtraction } from "./schemas/tax-document";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface NormalizeCreditReportResult {
  created: number;
  updated: number;
  skipped: number;
  createdIds: string[];
}

export interface NormalizeBankStatementResult {
  incomeEntries: number;
  expenseEntries: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface NormalizePayStubResult {
  monthlyIncome: number;
  employer: string;
  incomeId: string | null;
}

export interface NormalizeMedicalBillResult {
  accountId: string | null;
  balance: number;
  provider: string;
}

export interface NormalizeTaxDocumentResult {
  subtype: string;
  taxYear: number;
  incomeRecorded: number | null;
}

export interface NormalizationSummary {
  type: string;
  result:
    | NormalizeCreditReportResult
    | NormalizeBankStatementResult
    | NormalizePayStubResult
    | NormalizeMedicalBillResult
    | NormalizeTaxDocumentResult;
}

// ---------------------------------------------------------------------------
// Category mapping for bank transactions
// ---------------------------------------------------------------------------

const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  rent: "housing",
  mortgage: "housing",
  electric: "utilities",
  gas: "utilities",
  water: "utilities",
  internet: "utilities",
  phone: "utilities",
  grocery: "food",
  groceries: "food",
  restaurant: "food",
  dining: "food",
  uber: "transportation",
  lyft: "transportation",
  metro: "transportation",
  transit: "transportation",
  parking: "transportation",
  doctor: "healthcare",
  pharmacy: "healthcare",
  medical: "healthcare",
  hospital: "healthcare",
  insurance: "insurance",
  loan: "debt-payments",
  credit: "debt-payments",
  payment: "debt-payments",
  tuition: "education",
  school: "education",
};

function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  for (const [keyword, category] of Object.entries(EXPENSE_CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Credit Report normalization
// ---------------------------------------------------------------------------

export async function normalizeCreditReport(
  data: CreditReportExtraction,
  userId: string,
  documentId: string,
  supabase: SupabaseClient
): Promise<NormalizeCreditReportResult> {
  const result: NormalizeCreditReportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    createdIds: [],
  };

  const allAccounts = [
    ...(data.accounts ?? []).map((a) => ({
      creditorName: a.creditor_name,
      accountLastFour: a.account_number_last_four,
      balance: a.balance,
      status: mapCreditReportStatus(a.status, a.payment_status),
      category: mapAccountType(a.account_type),
      dateOpened: a.date_opened,
      dateOfLastActivity: a.date_of_last_activity,
      creditLimit: a.credit_limit,
      isCollection: false,
    })),
    ...(data.collections ?? []).map((c) => ({
      creditorName: c.creditor_name,
      accountLastFour: c.account_number_last_four,
      balance: c.balance,
      status: "in-collections" as const,
      category: "other" as const,
      dateOpened: c.date_opened,
      dateOfLastActivity: c.date_of_last_activity,
      creditLimit: undefined,
      isCollection: true,
    })),
  ];

  for (const acct of allAccounts) {
    // Check for existing account (match by creditor name + last four)
    let existingQuery = supabase
      .from("accounts")
      .select("id, current_balance")
      .eq("user_id", userId)
      .ilike("creditor_name", acct.creditorName);

    if (acct.accountLastFour) {
      existingQuery = existingQuery.eq("account_number", acct.accountLastFour);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      // Update balance if different
      if (existing.current_balance !== acct.balance) {
        await supabase
          .from("accounts")
          .update({
            current_balance: acct.balance,
            date_of_last_activity: acct.dateOfLastActivity ?? new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        result.updated++;
      } else {
        result.skipped++;
      }
    } else {
      // Create new account
      const now = new Date().toISOString();
      const { data: inserted, error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          creditor_name: acct.creditorName,
          account_number: acct.accountLastFour ?? null,
          original_balance: acct.balance,
          current_balance: acct.balance,
          status: acct.status,
          category: acct.category,
          date_opened: acct.dateOpened ?? now.split("T")[0],
          date_of_last_activity: acct.dateOfLastActivity ?? now.split("T")[0],
          date_added_to_app: now.split("T")[0],
          import_source: "credit-report",
          document_ids: [documentId],
          credit_bureaus: data.bureau && data.bureau !== "unknown" ? [data.bureau] : [],
          status_history: [],
          tags: [],
          activity_ids: [],
          case_ids: [],
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (!error && inserted) {
        result.created++;
        result.createdIds.push(inserted.id);
      }
    }
  }

  return result;
}

function mapCreditReportStatus(
  status?: string,
  paymentStatus?: string
): string {
  const lower = (paymentStatus ?? status ?? "").toLowerCase();
  if (lower.includes("current") || lower.includes("paid as agreed"))
    return "current";
  if (lower.includes("collection")) return "in-collections";
  if (lower.includes("charged") || lower.includes("charge-off"))
    return "charged-off";
  if (lower.includes("late") || lower.includes("delinquent")) return "late";
  if (lower.includes("closed") || lower.includes("paid")) return "paid-in-full";
  return "unknown";
}

function mapAccountType(accountType?: string): string {
  const lower = (accountType ?? "").toLowerCase();
  if (lower.includes("credit") || lower.includes("revolving"))
    return "credit-card";
  if (lower.includes("medical")) return "medical";
  if (lower.includes("student")) return "student-loan";
  if (lower.includes("auto") || lower.includes("vehicle")) return "auto-loan";
  if (lower.includes("personal") || lower.includes("installment"))
    return "personal-loan";
  if (lower.includes("utility")) return "utility";
  if (lower.includes("mortgage") || lower.includes("rent")) return "rent";
  return "other";
}

// ---------------------------------------------------------------------------
// Bank Statement normalization
// ---------------------------------------------------------------------------

export async function normalizeBankStatement(
  data: BankStatementExtraction,
  userId: string,
  supabase: SupabaseClient
): Promise<NormalizeBankStatementResult> {
  const result: NormalizeBankStatementResult = {
    incomeEntries: 0,
    expenseEntries: 0,
    totalIncome: 0,
    totalExpenses: 0,
  };

  const transactions = data.transactions ?? [];
  if (transactions.length === 0) return result;

  // Determine the budget month from the statement period or first transaction
  const periodMonth =
    data.statement_period?.start?.slice(0, 7) ??
    transactions[0]?.date?.slice(0, 7) ??
    new Date().toISOString().slice(0, 7);

  // Find or create budget for this month
  let { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("month", periodMonth)
    .maybeSingle();

  if (!budget) {
    const { data: newBudget } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        month: periodMonth,
        total_income: 0,
        total_expenses: 0,
        available_for_debt: 0,
        repayment_strategy: "snowball",
        debt_payments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    budget = newBudget;
  }

  if (!budget) return result;

  // Process credits as income entries
  const credits = transactions.filter((t) => t.type === "credit");
  for (const tx of credits) {
    await supabase.from("budget_income").insert({
      user_id: userId,
      budget_id: budget.id,
      source: tx.description.slice(0, 100),
      amount: tx.amount,
      frequency: "one-time",
      is_recurring: false,
    });
    result.incomeEntries++;
    result.totalIncome += tx.amount;
  }

  // Process debits as expense entries
  const debits = transactions.filter((t) => t.type === "debit");
  for (const tx of debits) {
    const category = tx.category ?? categorizeTransaction(tx.description);
    await supabase.from("budget_expenses").insert({
      user_id: userId,
      budget_id: budget.id,
      category,
      name: tx.description.slice(0, 100),
      amount: tx.amount,
      is_fixed: false,
      is_recurring: false,
    });
    result.expenseEntries++;
    result.totalExpenses += tx.amount;
  }

  // Update budget totals
  await supabase
    .from("budgets")
    .update({
      total_income: result.totalIncome,
      total_expenses: result.totalExpenses,
      available_for_debt: Math.max(0, result.totalIncome - result.totalExpenses),
      updated_at: new Date().toISOString(),
    })
    .eq("id", budget.id);

  return result;
}

// ---------------------------------------------------------------------------
// Pay Stub normalization
// ---------------------------------------------------------------------------

export async function normalizePayStub(
  data: PayStubExtraction,
  userId: string,
  supabase: SupabaseClient
): Promise<NormalizePayStubResult> {
  const monthlyNet = getMonthlyIncomeFromPay(data.net_pay, data.pay_frequency);

  // Find current month budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  let { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  if (!budget) {
    const { data: newBudget } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        month: currentMonth,
        total_income: 0,
        total_expenses: 0,
        available_for_debt: 0,
        repayment_strategy: "snowball",
        debt_payments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    budget = newBudget;
  }

  if (!budget) {
    return { monthlyIncome: monthlyNet, employer: data.employer_name, incomeId: null };
  }

  // Check for existing income entry from same employer
  const { data: existing } = await supabase
    .from("budget_income")
    .select("id")
    .eq("user_id", userId)
    .eq("budget_id", budget.id)
    .ilike("source", `%${data.employer_name}%`)
    .maybeSingle();

  if (existing) {
    // Update existing
    await supabase
      .from("budget_income")
      .update({ amount: monthlyNet, frequency: "monthly", is_recurring: true })
      .eq("id", existing.id);
    return { monthlyIncome: monthlyNet, employer: data.employer_name, incomeId: existing.id };
  }

  // Create new income entry
  const { data: inserted } = await supabase
    .from("budget_income")
    .insert({
      user_id: userId,
      budget_id: budget.id,
      source: data.employer_name,
      amount: monthlyNet,
      frequency: "monthly",
      is_recurring: true,
    })
    .select("id")
    .single();

  return {
    monthlyIncome: monthlyNet,
    employer: data.employer_name,
    incomeId: inserted?.id ?? null,
  };
}

function getMonthlyIncomeFromPay(
  netPay: number,
  frequency?: string
): number {
  switch (frequency) {
    case "weekly":
      return (netPay * 52) / 12;
    case "biweekly":
      return (netPay * 26) / 12;
    case "semimonthly":
      return netPay * 2;
    case "monthly":
      return netPay;
    default:
      return netPay; // assume monthly
  }
}

// ---------------------------------------------------------------------------
// Medical Bill normalization
// ---------------------------------------------------------------------------

export async function normalizeMedicalBill(
  data: MedicalBillExtraction,
  userId: string,
  documentId: string,
  supabase: SupabaseClient
): Promise<NormalizeMedicalBillResult> {
  const balance = data.patient_responsibility ?? data.total_amount;

  // Check for existing account from same provider
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("category", "medical")
    .ilike("creditor_name", data.provider_name)
    .maybeSingle();

  if (existing) {
    // Update balance
    await supabase
      .from("accounts")
      .update({
        current_balance: balance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return { accountId: existing.id, balance, provider: data.provider_name };
  }

  // Create new medical debt account
  const now = new Date().toISOString();
  const { data: inserted } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      creditor_name: data.provider_name,
      account_number: data.account_number ?? null,
      original_balance: data.total_amount,
      current_balance: balance,
      status: "current",
      category: "medical",
      date_opened: data.service_date ?? now.split("T")[0],
      date_of_last_activity: data.billing_date ?? now.split("T")[0],
      date_added_to_app: now.split("T")[0],
      import_source: "credit-report",
      document_ids: [documentId],
      status_history: [],
      tags: [],
      activity_ids: [],
      case_ids: [],
      credit_bureaus: [],
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  return {
    accountId: inserted?.id ?? null,
    balance,
    provider: data.provider_name,
  };
}

// ---------------------------------------------------------------------------
// Tax Document normalization
// ---------------------------------------------------------------------------

export async function normalizeTaxDocument(
  data: TaxDocumentExtraction,
  userId: string,
  supabase: SupabaseClient
): Promise<NormalizeTaxDocumentResult> {
  // Determine the income amount from the document
  let incomeAmount: number | null = null;

  if (data.document_subtype === "W-2" && data.wages != null) {
    incomeAmount = data.wages;
  } else if (data.document_subtype?.startsWith("1099") && data.amount != null) {
    incomeAmount = data.amount;
  } else if (data.document_subtype === "1040" && data.agi != null) {
    incomeAmount = data.agi;
  }

  if (incomeAmount == null) {
    return {
      subtype: data.document_subtype,
      taxYear: data.tax_year,
      incomeRecorded: null,
    };
  }

  // Create/update an annual income summary
  // We don't have a dedicated annual income table, so we use budget_income
  // for the current month as a reference point with monthly equivalent
  const monthlyEquiv = incomeAmount / 12;
  const currentMonth = new Date().toISOString().slice(0, 7);

  let { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  if (!budget) {
    const { data: newBudget } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        month: currentMonth,
        total_income: 0,
        total_expenses: 0,
        available_for_debt: 0,
        repayment_strategy: "snowball",
        debt_payments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    budget = newBudget;
  }

  if (budget) {
    const sourceName = data.employer_name ?? data.payer_name ?? `${data.document_subtype} Income`;

    // Upsert income entry
    const { data: existing } = await supabase
      .from("budget_income")
      .select("id")
      .eq("user_id", userId)
      .eq("budget_id", budget.id)
      .ilike("source", `%${sourceName}%`)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("budget_income")
        .update({ amount: monthlyEquiv, frequency: "monthly", is_recurring: true })
        .eq("id", existing.id);
    } else {
      await supabase.from("budget_income").insert({
        user_id: userId,
        budget_id: budget.id,
        source: sourceName,
        amount: monthlyEquiv,
        frequency: "monthly",
        is_recurring: true,
      });
    }
  }

  return {
    subtype: data.document_subtype,
    taxYear: data.tax_year,
    incomeRecorded: incomeAmount,
  };
}

// ---------------------------------------------------------------------------
// Master normalize dispatcher
// ---------------------------------------------------------------------------

export async function normalizeExtraction(
  documentId: string,
  userId: string,
  supabase: SupabaseClient,
  _selections?: Record<string, unknown>
): Promise<NormalizationSummary> {
  // Fetch document
  const { data: docRow, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error || !docRow) {
    throw new Error(`Document not found: ${error?.message ?? "unknown"}`);
  }

  if (docRow.user_id !== userId) {
    throw new Error("Forbidden");
  }

  const extractedData = docRow.extracted_data;
  if (!extractedData || typeof extractedData !== "object") {
    throw new Error("No extracted data available for normalization");
  }

  // Determine effective type
  const extractableTypes = [
    "bank-statement",
    "credit-report",
    "income-verification",
    "medical-bill",
    "tax-document",
  ];
  const effectiveType = extractableTypes.includes(docRow.auto_classified_type)
    ? docRow.auto_classified_type
    : docRow.type;

  let result: NormalizationSummary["result"];

  switch (effectiveType) {
    case "credit-report":
      result = await normalizeCreditReport(
        extractedData as unknown as CreditReportExtraction,
        userId,
        documentId,
        supabase
      );
      break;
    case "bank-statement":
      result = await normalizeBankStatement(
        extractedData as unknown as BankStatementExtraction,
        userId,
        supabase
      );
      break;
    case "income-verification":
      result = await normalizePayStub(
        extractedData as unknown as PayStubExtraction,
        userId,
        supabase
      );
      break;
    case "medical-bill":
      result = await normalizeMedicalBill(
        extractedData as unknown as MedicalBillExtraction,
        userId,
        documentId,
        supabase
      );
      break;
    case "tax-document":
      result = await normalizeTaxDocument(
        extractedData as unknown as TaxDocumentExtraction,
        userId,
        supabase
      );
      break;
    default:
      throw new Error(`No normalization available for document type: ${effectiveType}`);
  }

  // Mark document as fully completed after normalization
  await supabase
    .from("documents")
    .update({ processing_status: "completed" })
    .eq("id", documentId);

  return { type: effectiveType, result };
}
