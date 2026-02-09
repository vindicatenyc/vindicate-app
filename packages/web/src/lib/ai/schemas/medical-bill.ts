export const medicalBillSchema = {
  type: "object" as const,
  properties: {
    provider_name: { type: "string" as const },
    patient_name: { type: "string" as const },
    service_date: { type: "string" as const, description: "ISO date" },
    billing_date: { type: "string" as const, description: "ISO date" },
    charges: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          description: { type: "string" as const },
          amount: { type: "number" as const },
        },
        required: ["description", "amount"],
        additionalProperties: false,
      },
    },
    total_amount: { type: "number" as const },
    insurance_paid: { type: "number" as const },
    patient_responsibility: { type: "number" as const },
    account_number: { type: "string" as const },
  },
  required: ["provider_name", "total_amount"],
  additionalProperties: false,
};

export type MedicalBillExtraction = {
  provider_name: string;
  patient_name?: string;
  service_date?: string;
  billing_date?: string;
  charges?: Array<{
    description: string;
    amount: number;
  }>;
  total_amount: number;
  insurance_paid?: number;
  patient_responsibility?: number;
  account_number?: string;
};
