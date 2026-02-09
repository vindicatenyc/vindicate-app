export const payStubSchema = {
  type: "object" as const,
  properties: {
    employer_name: { type: "string" as const },
    pay_period: {
      type: "object" as const,
      properties: {
        start: { type: "string" as const, description: "ISO date" },
        end: { type: "string" as const, description: "ISO date" },
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
    pay_date: { type: "string" as const, description: "ISO date" },
    gross_pay: { type: "number" as const },
    net_pay: { type: "number" as const },
    pay_frequency: {
      type: "string" as const,
      enum: ["weekly", "biweekly", "semimonthly", "monthly"],
    },
    deductions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          amount: { type: "number" as const },
          ytd_amount: { type: "number" as const },
        },
        required: ["name", "amount"],
        additionalProperties: false,
      },
    },
    ytd_gross: { type: "number" as const },
    ytd_net: { type: "number" as const },
  },
  required: ["employer_name", "gross_pay", "net_pay"],
  additionalProperties: false,
};

export type PayStubExtraction = {
  employer_name: string;
  pay_period?: { start: string; end: string };
  pay_date?: string;
  gross_pay: number;
  net_pay: number;
  pay_frequency?: "weekly" | "biweekly" | "semimonthly" | "monthly";
  deductions?: Array<{
    name: string;
    amount: number;
    ytd_amount?: number;
  }>;
  ytd_gross?: number;
  ytd_net?: number;
};
