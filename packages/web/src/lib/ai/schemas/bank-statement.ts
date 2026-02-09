export const bankStatementSchema = {
  type: "object" as const,
  properties: {
    bank_name: { type: "string" as const },
    account_type: {
      type: "string" as const,
      enum: ["checking", "savings", "money_market", "other"],
    },
    account_last_four: { type: "string" as const },
    statement_period: {
      type: "object" as const,
      properties: {
        start: { type: "string" as const, description: "ISO date" },
        end: { type: "string" as const, description: "ISO date" },
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
    opening_balance: { type: "number" as const },
    closing_balance: { type: "number" as const },
    transactions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          date: { type: "string" as const, description: "ISO date" },
          description: { type: "string" as const },
          amount: {
            type: "number" as const,
            description: "Positive number",
          },
          type: { type: "string" as const, enum: ["debit", "credit"] },
          category: { type: "string" as const },
        },
        required: ["date", "description", "amount", "type"],
        additionalProperties: false,
      },
    },
  },
  required: ["bank_name", "transactions"],
  additionalProperties: false,
};

export type BankStatementExtraction = {
  bank_name: string;
  account_type?: "checking" | "savings" | "money_market" | "other";
  account_last_four?: string;
  statement_period?: { start: string; end: string };
  opening_balance?: number;
  closing_balance?: number;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "debit" | "credit";
    category?: string;
  }>;
};
