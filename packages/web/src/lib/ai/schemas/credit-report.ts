export const creditReportSchema = {
  type: "object" as const,
  properties: {
    bureau: {
      type: "string" as const,
      enum: ["equifax", "experian", "transunion", "unknown"],
    },
    report_date: { type: "string" as const, description: "ISO date" },
    credit_score: { type: ["number", "null"] as const },
    accounts: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          creditor_name: { type: "string" as const },
          account_number_last_four: { type: "string" as const },
          account_type: { type: "string" as const },
          status: { type: "string" as const },
          balance: { type: "number" as const },
          credit_limit: { type: ["number", "null"] as const },
          date_opened: {
            type: "string" as const,
            description: "ISO date",
          },
          payment_status: { type: "string" as const },
          past_due_amount: { type: "number" as const },
          date_of_last_activity: {
            type: "string" as const,
            description: "ISO date",
          },
        },
        required: ["creditor_name", "account_type", "status", "balance"],
        additionalProperties: false,
      },
    },
    collections: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          creditor_name: { type: "string" as const },
          original_creditor: { type: "string" as const },
          account_number_last_four: { type: "string" as const },
          status: { type: "string" as const },
          balance: { type: "number" as const },
          date_opened: {
            type: "string" as const,
            description: "ISO date",
          },
          date_of_last_activity: {
            type: "string" as const,
            description: "ISO date",
          },
        },
        required: ["creditor_name", "balance"],
        additionalProperties: false,
      },
    },
    inquiries: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          creditor_name: { type: "string" as const },
          date: { type: "string" as const, description: "ISO date" },
          type: { type: "string" as const, enum: ["hard", "soft"] },
        },
        required: ["creditor_name", "date"],
        additionalProperties: false,
      },
    },
  },
  required: ["accounts"],
  additionalProperties: false,
};

export type CreditReportExtraction = {
  bureau?: "equifax" | "experian" | "transunion" | "unknown";
  report_date?: string;
  credit_score?: number | null;
  accounts: Array<{
    creditor_name: string;
    account_number_last_four?: string;
    account_type: string;
    status: string;
    balance: number;
    credit_limit?: number | null;
    date_opened?: string;
    payment_status?: string;
    past_due_amount?: number;
    date_of_last_activity?: string;
  }>;
  collections?: Array<{
    creditor_name: string;
    original_creditor?: string;
    account_number_last_four?: string;
    status?: string;
    balance: number;
    date_opened?: string;
    date_of_last_activity?: string;
  }>;
  inquiries?: Array<{
    creditor_name: string;
    date: string;
    type?: "hard" | "soft";
  }>;
};
