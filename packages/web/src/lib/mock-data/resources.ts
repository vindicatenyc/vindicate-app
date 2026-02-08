/**
 * Mock resource center content
 * Rights summaries, template letters, articles, glossary terms
 */

import type { Resource, GlossaryTerm, TempleLetter } from '@vindicate/shared';

// Rights Summaries
export const mockRightsSummaries: Resource[] = [
  {
    id: 'res-rights-001',
    slug: 'fdcpa-rights',
    type: 'rights-summary',
    title: 'Your Rights Under the FDCPA',
    description: 'The Fair Debt Collection Practices Act protects you from abusive debt collectors.',
    content: `# Your Rights Under the Fair Debt Collection Practices Act (FDCPA)

The FDCPA is a federal law that protects consumers from abusive debt collection practices. Here's what you need to know.

## What Collectors CANNOT Do

### Time Restrictions
- Call before 8:00 AM or after 9:00 PM in YOUR time zone
- Call at times they know are inconvenient for you

### Harassment
- Use threats of violence or harm
- Use obscene or profane language
- Call repeatedly to annoy or harass you
- Publish your name on a "bad debt" list

### Deception
- Lie about the amount you owe
- Falsely claim to be attorneys or government officials
- Threaten actions they cannot legally take
- Falsely claim you've committed a crime

### Third Party Contact
- Tell others about your debt (except your spouse, attorney, or co-signer)
- Contact you at work if they know your employer disapproves

## What You CAN Do

### Request Validation
Within 30 days of first contact, you can demand the collector prove:
- The debt exists and the amount is accurate
- They have the legal right to collect it
- The original creditor's name and address

### Stop Contact
You can send a cease and desist letter requiring them to stop all contact. After receiving it, they can only contact you to:
- Confirm they'll stop contacting you
- Notify you of a specific action they're taking

### Sue for Violations
If a collector violates the FDCPA, you can sue for:
- Actual damages (emotional distress, lost wages)
- Statutory damages up to $1,000
- Attorney's fees and court costs

## Important Notes

*This information is for educational purposes only. Consult with an attorney for legal advice specific to your situation.*

The FDCPA applies to third-party debt collectors, not original creditors. However, many states have similar laws that do cover original creditors.`,
    category: 'rights',
    tags: ['fdcpa', 'debt-collection', 'consumer-rights', 'harassment'],
    relatedResourceIds: ['res-rights-002', 'res-template-001', 'res-template-003'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'res-rights-002',
    slug: 'fcra-rights',
    type: 'rights-summary',
    title: 'Your Credit Report Rights (FCRA)',
    description: 'The Fair Credit Reporting Act gives you rights over your credit information.',
    content: `# Your Rights Under the Fair Credit Reporting Act (FCRA)

The FCRA regulates how your credit information is collected, shared, and used.

## Your Key Rights

### Free Credit Reports
- One free report from each bureau annually via AnnualCreditReport.com
- Free report if you're denied credit
- Free report if you're unemployed and job searching
- Free report if you're on public assistance
- Free report if you suspect identity theft

### Dispute Inaccuracies
You have the right to dispute any information you believe is inaccurate:
- The bureau must investigate within 30 days
- They must forward your dispute to the data furnisher
- They must remove or correct inaccurate information
- They must notify you of the results in writing

### Limit Access
- Only those with a "permissible purpose" can access your report
- You can freeze your credit to prevent new inquiries
- You can opt out of prescreened credit offers

### Know Who's Looking
- You can see who has accessed your credit report
- "Hard" inquiries (when you apply for credit) stay for 2 years
- "Soft" inquiries (like checking your own credit) don't affect your score

## How to Dispute

1. **Get your credit reports** from all three bureaus
2. **Identify errors** - wrong balances, accounts you don't recognize, incorrect payment history
3. **File disputes online, by mail, or by phone**
   - Equifax: equifax.com/dispute
   - Experian: experian.com/disputes
   - TransUnion: transunion.com/dispute
4. **Include documentation** supporting your dispute
5. **Wait for investigation** (30 days maximum)
6. **Review the results** and follow up if needed

## What Gets Removed

Credit bureaus must remove:
- Inaccurate information after investigation
- Most negative items after 7 years
- Bankruptcies after 10 years (Chapter 7) or 7 years (Chapter 13)

*This information is for educational purposes only.*`,
    category: 'rights',
    tags: ['fcra', 'credit-report', 'disputes', 'credit-bureaus'],
    relatedResourceIds: ['res-rights-001', 'res-template-002'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// Template Letters
export const mockTemplateLetters: TempleLetter[] = [
  {
    id: 'res-template-001',
    slug: 'debt-validation-letter',
    title: 'Debt Validation Request Letter',
    description: 'Use this template to request validation of a debt within 30 days of first contact.',
    content: `{{your_name}}
{{your_address}}
{{your_city_state_zip}}

{{date}}

{{collector_name}}
{{collector_address}}
{{collector_city_state_zip}}

RE: Account Number {{account_number}}

To Whom It May Concern:

I am writing in response to your {{letter/call}} dated {{date_of_contact}} regarding the above-referenced account.

Pursuant to my rights under the Fair Debt Collection Practices Act (15 U.S.C. § 1692g), I am requesting validation of this alleged debt. Please provide the following:

1. Proof that you are licensed to collect debts in {{your_state}}
2. The name and address of the original creditor
3. Documentation that establishes I am responsible for this debt
4. A complete payment history showing how the current balance was calculated
5. A copy of the original signed agreement or application
6. Proof of your authority to collect on this debt

Please note that this letter is not an acknowledgment of the debt, nor is it a promise to pay. It is a request for validation as permitted by law.

Until this debt is validated, I request that you cease all collection activities and do not report this account to any credit reporting agencies.

Please respond to this request within 30 days.

Sincerely,

{{your_signature}}
{{your_name}}

Sent via Certified Mail
Return Receipt Requested
Tracking #: {{tracking_number}}`,
    category: 'validation',
    placeholders: [
      'your_name',
      'your_address',
      'your_city_state_zip',
      'date',
      'collector_name',
      'collector_address',
      'collector_city_state_zip',
      'account_number',
      'date_of_contact',
      'your_state',
      'your_signature',
      'tracking_number',
    ],
  },
  {
    id: 'res-template-002',
    slug: 'credit-bureau-dispute',
    title: 'Credit Bureau Dispute Letter',
    description: 'Template for disputing inaccurate information with credit bureaus.',
    content: `{{your_name}}
{{your_address}}
{{your_city_state_zip}}

{{date}}

{{bureau_name}}
{{bureau_address}}

RE: Dispute of Inaccurate Information

Dear Sir or Madam:

I am writing to dispute the following inaccurate information on my credit report. My information is as follows:

Full Name: {{your_name}}
Date of Birth: {{your_dob}}
Social Security Number: {{your_ssn_last_4}} (last 4 digits)
Current Address: {{your_address}}

The following item(s) are inaccurate:

Account Name: {{creditor_name}}
Account Number: {{account_number}}
Reason for Dispute: {{dispute_reason}}

{{additional_details}}

Under the Fair Credit Reporting Act, you are required to investigate this dispute and correct any inaccurate information. Please investigate this matter and delete or correct the disputed item(s) as soon as possible.

I have enclosed copies of the following documents supporting my dispute:
{{supporting_documents}}

Please send me confirmation of your investigation results within 30 days as required by law.

Sincerely,

{{your_signature}}
{{your_name}}

Enclosures: {{list_enclosures}}`,
    category: 'dispute',
    placeholders: [
      'your_name',
      'your_address',
      'your_city_state_zip',
      'date',
      'bureau_name',
      'bureau_address',
      'your_dob',
      'your_ssn_last_4',
      'creditor_name',
      'account_number',
      'dispute_reason',
      'additional_details',
      'supporting_documents',
      'your_signature',
      'list_enclosures',
    ],
  },
  {
    id: 'res-template-003',
    slug: 'cease-and-desist',
    title: 'Cease and Desist Letter',
    description: 'Stop a debt collector from contacting you (but does not eliminate the debt).',
    content: `{{your_name}}
{{your_address}}
{{your_city_state_zip}}

{{date}}

{{collector_name}}
{{collector_address}}
{{collector_city_state_zip}}

RE: Account Number {{account_number}}
CEASE AND DESIST COMMUNICATION

To Whom It May Concern:

Pursuant to my rights under the Fair Debt Collection Practices Act, 15 U.S.C. § 1692c(c), I am demanding that you cease all communication with me regarding the above-referenced account.

This letter is your legal notice to STOP the following:
- All telephone calls to my home, cell phone, or workplace
- All written correspondence except as permitted by law
- All contact with my family, friends, neighbors, or employer

Under the FDCPA, once you receive this notice, you may only contact me to:
1. Advise me that your collection efforts are being terminated
2. Notify me that you or the creditor may invoke specified remedies

Any further contact beyond what is permitted by law will be considered harassment and a violation of federal law. I will document any violations and take appropriate legal action.

This is not a refusal to pay, nor is it an acknowledgment of the debt. It is a formal demand that you cease contact.

Sincerely,

{{your_signature}}
{{your_name}}

Sent via Certified Mail
Return Receipt Requested
Tracking #: {{tracking_number}}`,
    category: 'cease-desist',
    placeholders: [
      'your_name',
      'your_address',
      'your_city_state_zip',
      'date',
      'collector_name',
      'collector_address',
      'collector_city_state_zip',
      'account_number',
      'your_signature',
      'tracking_number',
    ],
  },
  {
    id: 'res-template-004',
    slug: 'settlement-offer',
    title: 'Settlement Offer Letter',
    description: 'Template for proposing a settlement to a debt collector.',
    content: `{{your_name}}
{{your_address}}
{{your_city_state_zip}}

{{date}}

{{collector_name}}
{{collector_address}}
{{collector_city_state_zip}}

RE: Account Number {{account_number}}
Original Creditor: {{original_creditor}}
Claimed Balance: {{claimed_balance}}

Dear Sir or Madam:

I am writing regarding the above-referenced account. Due to {{reason_for_hardship}}, I am unable to pay the full amount claimed.

I am offering a one-time settlement payment of {{settlement_amount}} to resolve this matter in full. This represents {{percentage}}% of the claimed balance.

If you accept this offer, I require the following conditions in writing before payment:
1. This payment will be accepted as settlement in full
2. The account will be reported to credit bureaus as "Paid in Full" or "Settled"
3. You will not sell or transfer this account to any other collector
4. No 1099-C will be issued for the forgiven amount (if applicable)

Upon receipt of your written acceptance of these terms, I will remit payment via {{payment_method}}.

This offer is valid for 30 days from the date of this letter. This letter is not an acknowledgment of the debt and is an attempt to resolve a disputed claim.

Please respond in writing to the address above.

Sincerely,

{{your_signature}}
{{your_name}}`,
    category: 'negotiation',
    placeholders: [
      'your_name',
      'your_address',
      'your_city_state_zip',
      'date',
      'collector_name',
      'collector_address',
      'collector_city_state_zip',
      'account_number',
      'original_creditor',
      'claimed_balance',
      'reason_for_hardship',
      'settlement_amount',
      'percentage',
      'payment_method',
      'your_signature',
    ],
  },
  {
    id: 'res-template-005',
    slug: 'goodwill-letter',
    title: 'Goodwill Adjustment Letter',
    description: 'Request removal of negative marks after you have paid the account.',
    content: `{{your_name}}
{{your_address}}
{{your_city_state_zip}}

{{date}}

{{creditor_name}}
Customer Service Department
{{creditor_address}}
{{creditor_city_state_zip}}

RE: Account Number {{account_number}}

Dear Sir or Madam:

I am writing to request a goodwill adjustment on my account. I have been a customer since {{start_date}} and have always valued my relationship with {{creditor_name}}.

Unfortunately, due to {{reason_for_hardship}}, I experienced difficulty making timely payments during {{timeframe}}. I take full responsibility for this.

Since then, I have {{actions_taken}} and my account is now {{current_status}}.

I am respectfully requesting that you remove the late payment notation(s) from {{dates_of_late_payments}} from my credit report as a gesture of goodwill.

I understand this is not a request you are obligated to grant, but I am hoping that given my overall payment history and current good standing, you will consider this request.

Thank you for your time and consideration.

Sincerely,

{{your_signature}}
{{your_name}}`,
    category: 'goodwill',
    placeholders: [
      'your_name',
      'your_address',
      'your_city_state_zip',
      'date',
      'creditor_name',
      'creditor_address',
      'creditor_city_state_zip',
      'account_number',
      'start_date',
      'reason_for_hardship',
      'timeframe',
      'actions_taken',
      'current_status',
      'dates_of_late_payments',
      'your_signature',
    ],
  },
];

// Glossary Terms
export const mockGlossaryTerms: GlossaryTerm[] = [
  {
    id: 'gloss-001',
    term: 'Charge-Off',
    definition: 'When a creditor writes off a debt as a loss, usually after 180 days of non-payment. The debt is still owed and can be sold to collectors.',
    relatedTerms: ['Collections', 'Credit Report', 'Statute of Limitations'],
  },
  {
    id: 'gloss-002',
    term: 'Collections',
    definition: 'The process of pursuing payment of a debt. An account "in collections" has been transferred to a collection agency.',
    relatedTerms: ['Charge-Off', 'FDCPA', 'Debt Collector'],
  },
  {
    id: 'gloss-003',
    term: 'FDCPA',
    definition: 'The Fair Debt Collection Practices Act - a federal law that protects consumers from abusive debt collection practices.',
    relatedTerms: ['Debt Collector', 'Harassment', 'Debt Validation'],
  },
  {
    id: 'gloss-004',
    term: 'FCRA',
    definition: 'The Fair Credit Reporting Act - a federal law that regulates how credit information is collected, shared, and used.',
    relatedTerms: ['Credit Report', 'Credit Bureau', 'Dispute'],
  },
  {
    id: 'gloss-005',
    term: 'Debt Validation',
    definition: 'Your right under the FDCPA to require a debt collector to prove you owe the debt. Must be requested within 30 days of first contact.',
    relatedTerms: ['FDCPA', 'Debt Collector', 'Verification'],
  },
  {
    id: 'gloss-006',
    term: 'Statute of Limitations (SOL)',
    definition: 'The time period during which a creditor can sue you for a debt. Varies by state and debt type. In NY, most debts have a 6-year SOL.',
    relatedTerms: ['Time-Barred Debt', 'Lawsuit', 'Default Judgment'],
  },
  {
    id: 'gloss-007',
    term: 'Credit Bureau',
    definition: 'Companies that collect and maintain credit information. The three major bureaus are Equifax, Experian, and TransUnion.',
    relatedTerms: ['Credit Report', 'FCRA', 'Credit Score'],
  },
  {
    id: 'gloss-008',
    term: 'Credit Score',
    definition: 'A numerical representation of creditworthiness, typically ranging from 300-850. Based on payment history, debt levels, and other factors.',
    relatedTerms: ['Credit Report', 'FICO', 'VantageScore'],
  },
  {
    id: 'gloss-009',
    term: 'Settlement',
    definition: 'An agreement to pay less than the full amount owed to resolve a debt. Often 40-60% of the balance for debts in collections.',
    relatedTerms: ['Negotiation', 'Lump Sum', 'Pay-for-Delete'],
  },
  {
    id: 'gloss-010',
    term: 'Pay-for-Delete',
    definition: 'An agreement where a collector removes negative information from your credit report in exchange for payment. Not all collectors agree to this.',
    relatedTerms: ['Settlement', 'Credit Report', 'Negotiation'],
  },
  {
    id: 'gloss-011',
    term: 'Judgment',
    definition: 'A court order establishing that you owe a debt. Allows the creditor to pursue wage garnishment, bank levies, or property liens.',
    relatedTerms: ['Lawsuit', 'Wage Garnishment', 'Default Judgment'],
  },
  {
    id: 'gloss-012',
    term: 'Garnishment',
    definition: 'A legal process where money is taken directly from your paycheck or bank account to pay a debt after a judgment.',
    relatedTerms: ['Judgment', 'Lawsuit', 'Exemptions'],
  },
];

// Articles
export const mockArticles: Resource[] = [
  {
    id: 'res-article-001',
    slug: 'what-happens-collections',
    type: 'article',
    title: 'What Happens When a Debt Goes to Collections',
    description: 'Understanding the collection process and your options at each stage.',
    content: `# What Happens When a Debt Goes to Collections

When you fall behind on payments, your debt may eventually be sent to collections. Here's what to expect.

## The Timeline

### 30-60 Days Late
The original creditor starts calling and sending notices. At this stage, you can often negotiate directly with them for a payment plan or hardship program.

### 90-120 Days Late
The account is usually reported to credit bureaus as delinquent. Your credit score takes a hit.

### 180 Days Late
Many creditors "charge off" the debt - writing it off as a loss. This is a major negative mark on your credit. The debt is often sold to a collection agency.

### After Charge-Off
A collection agency buys the debt (often for pennies on the dollar) and becomes the new owner. They may call, send letters, and report to credit bureaus.

## What Collectors Can and Cannot Do

[See our FDCPA Rights Guide for detailed information]

## Your Options

1. **Request Validation** - Make them prove you owe it
2. **Negotiate a Settlement** - Pay less than the full amount
3. **Set Up a Payment Plan** - Pay over time
4. **Dispute Inaccuracies** - Challenge errors on your credit report
5. **Wait It Out** - After 7 years, it falls off your credit report

## The Statute of Limitations

Each state has time limits on when creditors can sue. In New York, it's generally 6 years. After this period, the debt is "time-barred" - they can still try to collect, but they can't sue.

**Warning:** Making a payment or acknowledging the debt can restart the clock!

## Next Steps

1. Check your credit reports for accuracy
2. Send a debt validation letter
3. Understand your state's statute of limitations
4. Consider your negotiation options`,
    category: 'articles',
    tags: ['collections', 'charge-off', 'timeline', 'options'],
    relatedResourceIds: ['res-rights-001', 'res-template-001'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'res-article-002',
    slug: 'negotiating-settlement',
    type: 'article',
    title: 'How to Negotiate a Debt Settlement',
    description: 'Tips and strategies for settling debts for less than you owe.',
    content: `# How to Negotiate a Debt Settlement

Settling a debt for less than you owe is absolutely possible. Here's how to approach it.

## Why Collectors Settle

Collection agencies often buy debts for 10-20 cents on the dollar. This means accepting 50% from you is still profitable. The older the debt, the more flexible they may be.

## Before You Negotiate

1. **Know what you can afford** - Don't agree to something you can't pay
2. **Have the money ready** - Lump sum offers get better deals
3. **Understand the tax implications** - Forgiven debt over $600 may be taxable
4. **Get everything in writing** - Never pay without written confirmation

## Negotiation Strategies

### Start Low
Open with 25-30% of the balance. They'll counter, but you've set the floor.

### Use Time to Your Advantage
Collectors have quotas. End of month, end of quarter, end of year can be good times to negotiate.

### Mention Your Circumstances
Financial hardship can justify a lower offer. Be honest but don't overshare.

### Be Patient
Don't accept the first offer. Say "I need to think about it" and wait for a better one.

## What to Get in Writing

Before paying, get written confirmation of:
- The settlement amount
- That this resolves the debt in full
- How it will be reported to credit bureaus
- That they won't sell the remaining balance

## Sample Settlements

- Fresh debt (< 1 year old): 50-60%
- Older debt (2-3 years): 40-50%
- Very old debt (5+ years): 20-40%

*These are general ranges - your results may vary.*`,
    category: 'articles',
    tags: ['settlement', 'negotiation', 'debt', 'collections'],
    relatedResourceIds: ['res-template-004', 'res-article-001'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// Helper functions
export function getResourceBySlug(slug: string): Resource | TempleLetter | undefined {
  const allResources = [...mockRightsSummaries, ...mockArticles];
  const resource = allResources.find(r => r.slug === slug);
  if (resource) return resource;

  return mockTemplateLetters.find(t => t.slug === slug);
}

export function getResourcesByCategory(category: string): Resource[] {
  const allResources = [...mockRightsSummaries, ...mockArticles];
  return allResources.filter(r => r.category === category);
}

export function searchResources(query: string): Resource[] {
  const allResources = [...mockRightsSummaries, ...mockArticles];
  const lowerQuery = query.toLowerCase();

  return allResources.filter(r =>
    r.title.toLowerCase().includes(lowerQuery) ||
    r.description.toLowerCase().includes(lowerQuery) ||
    r.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return mockGlossaryTerms.filter(t =>
    t.term.toLowerCase().includes(lowerQuery) ||
    t.definition.toLowerCase().includes(lowerQuery)
  );
}
