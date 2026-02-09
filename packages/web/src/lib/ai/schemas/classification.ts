export const classificationSchema = {
  type: "object" as const,
  properties: {
    document_type: {
      type: "string" as const,
      enum: [
        "validation-letter",
        "dispute-letter",
        "court-document",
        "payment-receipt",
        "credit-report",
        "correspondence",
        "settlement-agreement",
        "bank-statement",
        "tax-document",
        "income-verification",
        "identity-document",
        "medical-bill",
        "other",
      ],
    },
    confidence: {
      type: "number" as const,
      description: "Confidence score between 0 and 1",
    },
    reasoning: {
      type: "string" as const,
      description: "Brief explanation of why this document type was chosen",
    },
  },
  required: ["document_type", "confidence", "reasoning"],
  additionalProperties: false,
};

export type ClassificationResult = {
  document_type: string;
  confidence: number;
  reasoning: string;
};
