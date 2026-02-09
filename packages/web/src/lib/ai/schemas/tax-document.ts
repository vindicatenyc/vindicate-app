export const taxDocumentSchema = {
  type: "object" as const,
  properties: {
    document_subtype: {
      type: "string" as const,
      enum: ["W-2", "1099-MISC", "1099-INT", "1099-DIV", "1040", "other"],
    },
    employer_name: { type: "string" as const },
    payer_name: { type: "string" as const },
    tax_year: { type: "number" as const },
    // W-2 fields
    wages: { type: "number" as const },
    federal_tax_withheld: { type: "number" as const },
    state_tax_withheld: { type: "number" as const },
    social_security_wages: { type: "number" as const },
    medicare_wages: { type: "number" as const },
    // 1099 fields
    amount: { type: "number" as const },
    type_of_income: { type: "string" as const },
    // 1040 fields
    agi: { type: "number" as const },
    taxable_income: { type: "number" as const },
    total_tax: { type: "number" as const },
    refund_or_owed: { type: "number" as const },
  },
  required: ["document_subtype", "tax_year"],
  additionalProperties: false,
};

export type TaxDocumentExtraction = {
  document_subtype:
    | "W-2"
    | "1099-MISC"
    | "1099-INT"
    | "1099-DIV"
    | "1040"
    | "other";
  employer_name?: string;
  payer_name?: string;
  tax_year: number;
  // W-2
  wages?: number;
  federal_tax_withheld?: number;
  state_tax_withheld?: number;
  social_security_wages?: number;
  medicare_wages?: number;
  // 1099
  amount?: number;
  type_of_income?: string;
  // 1040
  agi?: number;
  taxable_income?: number;
  total_tax?: number;
  refund_or_owed?: number;
};
