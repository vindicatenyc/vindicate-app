/**
 * Mock Vinny AI responses
 * 30+ responses covering: rights, credit, disputes, payments, budgeting, encouragement, greetings
 */

import type { VinnyMockResponse } from '@vindicate/shared';

export const mockVinnyResponses: VinnyMockResponse[] = [
  // === GREETINGS ===
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    category: 'greetings',
    response: "Hey there! I'm Vinny, your financial recovery companion. I'm here to help you understand your options and take control of your debt situation. What's on your mind today?",
    suggestedReplies: ['What can you help me with?', "Tell me about my rights", "I'm stressed about debt"],
  },
  {
    keywords: ['how are you', "what's up", 'whats up'],
    category: 'greetings',
    response: "I'm here and ready to help! More importantly, how are YOU doing? Managing debt can be stressful, but you're taking positive steps by being here. What can I help you with?",
    suggestedReplies: ['I need help with a collector', 'Explain my credit score', 'Help me budget'],
  },

  // === ENCOURAGEMENT ===
  {
    keywords: ['stressed', 'overwhelmed', 'scared', 'worried', 'anxious', 'help me'],
    category: 'encouragement',
    response: "I hear you, and those feelings are completely valid. Dealing with debt is emotionally exhausting. But here's what I want you to remember: You're not alone, you have rights, and there IS a path forward. Let's take it one step at a time. What's weighing on you most right now?",
    suggestedReplies: ['Collectors keep calling', "I don't know where to start", 'I feel like giving up'],
  },
  {
    keywords: ['give up', 'hopeless', "can't do this", 'impossible'],
    category: 'encouragement',
    response: "I understand why you might feel that way, but please don't give up. Every day, people in situations just like yours find their way out. You've already taken the first step by being here. Let me share something: Even small actions - like sending one letter or making one payment - build momentum. What's one small thing we can tackle together today?",
    suggestedReplies: ['Help me send a letter', 'What should I prioritize?', 'Tell me a success story'],
  },
  {
    keywords: ['thank you', 'thanks', 'helpful', 'appreciate'],
    category: 'encouragement',
    response: "You're welcome! Remember, you're doing great by taking action. Every step forward counts, no matter how small. I'm here whenever you need me. You've got this!",
    suggestedReplies: ['What should I do next?', 'Show me my progress', 'I have another question'],
  },

  // === RIGHTS (FDCPA) ===
  {
    keywords: ['fdcpa', 'fair debt', 'collector rights', 'what can collectors do', 'my rights'],
    category: 'rights',
    response: "Great question! Under the Fair Debt Collection Practices Act (FDCPA), you have important rights:\n\n1. Collectors can only call between 8am-9pm YOUR time\n2. They must stop calling your workplace if you ask\n3. They can't use threats, lies, or obscene language\n4. You can demand they only contact you in writing\n5. You can request debt validation within 30 days\n\nIf a collector violates these rules, you may be able to sue for damages. Want me to explain any of these in more detail?",
    suggestedReplies: ['What is debt validation?', 'A collector is harassing me', 'Can I sue a collector?'],
    resourceLink: {
      title: 'Know Your Rights: FDCPA Guide',
      url: '/resources/fdcpa-rights',
    },
  },
  {
    keywords: ['harass', 'harassment', 'threaten', 'threat', 'calling too much', 'wont stop calling'],
    category: 'rights',
    response: "If a collector is harassing you, that's a serious violation. Here's what counts as harassment under the FDCPA:\n\n- Calling before 8am or after 9pm\n- Calling repeatedly to annoy you\n- Using threats of violence or harm\n- Using obscene or profane language\n- Calling your workplace after you've asked them to stop\n\nDocument every incident with dates, times, and what was said. You can send a cease and desist letter, and you may have grounds for a lawsuit. Would you like help documenting an incident?",
    suggestedReplies: ['Log a harassment incident', 'Send a cease and desist', 'Find an FDCPA lawyer'],
    resourceLink: {
      title: 'Harassment Documentation Template',
      url: '/resources/harassment-log',
    },
  },
  {
    keywords: ['cease and desist', 'stop calling', 'stop contact', 'leave me alone'],
    category: 'rights',
    response: "You have the right to tell collectors to stop contacting you. A cease and desist letter is a powerful tool. Once they receive it, they can only contact you to:\n\n1. Confirm they'll stop contacting you\n2. Notify you of a specific action (like a lawsuit)\n\nImportant: This doesn't make the debt go away, and they may still sue. But it stops the calls. Would you like me to help you draft a cease and desist letter?",
    suggestedReplies: ['Draft a cease and desist', "What happens if they ignore it?", 'Other ways to stop calls'],
    resourceLink: {
      title: 'Cease and Desist Letter Template',
      url: '/resources/cease-desist-template',
    },
  },

  // === DEBT VALIDATION ===
  {
    keywords: ['debt validation', 'validate', 'prove', 'verify debt', 'is this debt real'],
    category: 'disputes',
    response: "Debt validation is one of your most powerful rights! Within 30 days of a collector's first contact, you can demand they prove:\n\n1. The debt exists and the amount is correct\n2. They have the legal right to collect it\n3. The original creditor information\n\nWhile they're validating, they must stop collection efforts. If they can't prove it, they may have to stop collecting entirely. This is especially useful for old debts or accounts you don't recognize. Want to send a validation letter?",
    suggestedReplies: ['Send validation letter', "What if they can't validate?", 'Dispute with credit bureau'],
    resourceLink: {
      title: 'Debt Validation Letter Template',
      url: '/resources/validation-letter',
    },
  },
  {
    keywords: ['dispute', 'credit report', 'wrong balance', 'not my debt', 'incorrect'],
    category: 'disputes',
    response: "You can dispute inaccurate information on your credit report directly with the credit bureaus. Here's how:\n\n1. Get your free credit reports from AnnualCreditReport.com\n2. Identify the inaccurate information\n3. File disputes with each bureau showing the error\n4. They have 30 days to investigate\n\nIf they can't verify the info, they must remove it. Many people have success getting collections removed this way! What's the error you're seeing?",
    suggestedReplies: ['File a dispute', 'Balance is wrong', "Account isn't mine", 'Already paid this'],
    resourceLink: {
      title: 'Credit Bureau Dispute Guide',
      url: '/resources/dispute-guide',
    },
  },

  // === CREDIT SCORE ===
  {
    keywords: ['credit score', 'improve credit', 'raise score', 'credit report', 'fico'],
    category: 'credit',
    response: "Your credit score is affected by several factors. Here's what matters most:\n\n1. **Payment History (35%)** - Pay on time, every time\n2. **Credit Utilization (30%)** - Keep balances low\n3. **Length of History (15%)** - Keep old accounts open\n4. **Credit Mix (10%)** - Different types of credit help\n5. **New Credit (10%)** - Don't apply for too much\n\nGiven your situation, focus on: making agreed payments on time, successfully disputing errors, and keeping your one good account in good standing. Small wins add up!",
    suggestedReplies: ['What is credit utilization?', 'How long to rebuild?', 'Will settling help?'],
    resourceLink: {
      title: 'Credit Score Factors Explained',
      url: '/resources/credit-factors',
    },
  },
  {
    keywords: ['charged off', 'charge off', 'what does charged off mean'],
    category: 'credit',
    response: "A charge-off happens when a creditor writes off your debt as a loss (usually after 180 days of non-payment). Important things to know:\n\n1. The debt still exists - you still owe it\n2. It hurts your credit score significantly\n3. It stays on your report for 7 years from the first missed payment\n4. The debt may be sold to a collector\n5. You can still negotiate to pay it\n\nThe good news: Its impact lessens over time, and you may be able to negotiate a settlement or pay-for-delete agreement.",
    suggestedReplies: ['What is pay-for-delete?', 'Should I pay it?', 'Negotiate a settlement'],
  },
  {
    keywords: ['pay for delete', 'remove from credit', 'delete from report'],
    category: 'credit',
    response: "A pay-for-delete is when a collector agrees to remove the negative item from your credit report in exchange for payment. Here's the reality:\n\n1. Not all collectors will agree to this\n2. Even if they agree, credit bureaus may not remove it\n3. Always get any agreement IN WRITING before paying\n4. Never give them direct access to your bank account\n\nIt's worth asking, but don't count on it. A paid collection still helps your score more than an unpaid one. Would you like help negotiating?",
    suggestedReplies: ['Help me negotiate', 'Goodwill letter template', 'Settlement offer tips'],
    resourceLink: {
      title: 'Pay-for-Delete Letter Template',
      url: '/resources/pay-delete-letter',
    },
  },

  // === PAYMENTS & SETTLEMENTS ===
  {
    keywords: ['settlement', 'settle', 'negotiate', 'pay less', 'lump sum'],
    category: 'payments',
    response: "Settling a debt for less than you owe is definitely possible! Here's how it typically works:\n\n1. Collectors often buy debt for pennies on the dollar\n2. They may accept 40-60% of the balance\n3. Lump sum offers get better deals than payment plans\n4. Get EVERYTHING in writing before paying\n5. Know that settled debts may still show on your credit report (but as 'settled' instead of 'unpaid')\n\nDo you have a specific account you're thinking of settling?",
    suggestedReplies: ['How do I make an offer?', 'What should I say?', 'Settlement letter template'],
    resourceLink: {
      title: 'Settlement Negotiation Guide',
      url: '/resources/settlement-guide',
    },
  },
  {
    keywords: ['payment plan', 'cant pay full', 'monthly payments', 'hardship'],
    category: 'payments',
    response: "If you can't pay in full, a payment plan might be your best option. Tips for negotiating:\n\n1. Be honest about what you can afford\n2. Ask about hardship programs - many creditors have them\n3. Try to get interest frozen or reduced\n4. Get the agreement in writing\n5. Only agree to payments you can actually make\n\nRemember: A payment plan you can stick to is better than a settlement you can't afford. What amount could you realistically pay monthly?",
    suggestedReplies: ['Calculate what I can afford', "What if I can't make a payment?", 'Hardship program options'],
  },
  {
    keywords: ['snowball', 'avalanche', 'debt payoff', 'which debt first'],
    category: 'payments',
    response: "Great question about debt payoff strategies! There are two main approaches:\n\n**Snowball Method:**\n- Pay minimums on everything\n- Put extra money toward smallest balance first\n- Builds momentum through quick wins\n\n**Avalanche Method:**\n- Pay minimums on everything\n- Put extra money toward highest interest rate first\n- Saves more money mathematically\n\nFor your situation with debts in collections (often no interest), snowball might be more motivating. Which approach appeals to you?",
    suggestedReplies: ['Set up snowball plan', 'Calculate savings with avalanche', 'Show my debt order'],
    resourceLink: {
      title: 'Debt Payoff Calculator',
      url: '/budget',
    },
  },

  // === BUDGETING ===
  {
    keywords: ['budget', 'budgeting', 'save money', 'cut expenses', 'spend less'],
    category: 'budgeting',
    response: "Creating a budget is essential for debt recovery. Here are the basics:\n\n1. **Track everything** - Know where your money goes\n2. **Cover necessities first** - Housing, food, utilities, transportation\n3. **Pay yourself** - Even $20/month in savings helps\n4. **Then tackle debt** - Use what's left strategically\n\nI see you're already making progress with your budget! Your available for debt repayment is around $1,200/month. Would you like to review your budget or find places to save?",
    suggestedReplies: ['Review my budget', 'Where can I cut?', 'Am I on track?'],
    resourceLink: {
      title: 'Budget Worksheet',
      url: '/budget',
    },
  },
  {
    keywords: ['emergency fund', 'savings', 'save money'],
    category: 'budgeting',
    response: "Having an emergency fund is crucial - it prevents you from going deeper into debt when unexpected expenses hit. Here's my suggestion:\n\n1. Start with a mini emergency fund of $500-1,000\n2. Keep it in a separate account so you're not tempted\n3. Only use it for true emergencies\n4. Rebuild it whenever you dip into it\n\nI know it feels counterintuitive to save when you have debt, but even a small cushion can prevent a crisis. You've already saved $450 toward your emergency fund - that's great progress!",
    suggestedReplies: ['Update my savings goal', 'What counts as emergency?', 'Focus on debt instead?'],
  },

  // === LEGAL / LAWSUITS ===
  {
    keywords: ['lawsuit', 'sued', 'court', 'summons', 'being sued'],
    category: 'rights',
    response: "If you've received a court summons, don't panic - but do act quickly. Here's what you need to know:\n\n1. **Never ignore a summons** - If you don't respond, they win by default\n2. **Note the deadline** - You usually have 20-30 days to respond\n3. **You have defenses** - Statute of limitations, improper service, wrong amount\n4. **Consider free legal help** - Legal Aid Society can help in NYC\n\nThis is serious, but many people successfully defend these cases. Would you like me to help you understand your options?\n\n*Note: I'm not a lawyer - this is general information. Consider consulting with an attorney.*",
    suggestedReplies: ['What is statute of limitations?', 'Find legal aid', 'How to respond to summons'],
    resourceLink: {
      title: 'What to Do If You Are Sued',
      url: '/resources/lawsuit-response',
    },
  },
  {
    keywords: ['statute of limitations', 'sol', 'too old', 'old debt', 'time barred'],
    category: 'rights',
    response: "The statute of limitations (SOL) is a time limit on when a creditor can sue you for a debt. In New York:\n\n- Most debts: 6 years from last payment/acknowledgment\n- Some written contracts: 6 years\n- Auto loans: 4 years\n\n**Important warnings:**\n- Making a payment can reset the clock!\n- Acknowledging the debt might reset it too\n- Just because they can't sue doesn't mean they can't try to collect\n- The debt can still appear on your credit report\n\nWant me to check the SOL dates on your accounts?",
    suggestedReplies: ['Check my SOL dates', 'What if SOL has passed?', 'Zombie debt explained'],
  },

  // === SPECIFIC TOPICS ===
  {
    keywords: ['medical debt', 'hospital bill', 'doctor bill', 'healthcare debt'],
    category: 'rights',
    response: "Medical debt has some unique aspects worth knowing:\n\n1. **Billing errors are common** - Always request itemized bills\n2. **Negotiate the bill first** - Hospitals often reduce bills significantly\n3. **Ask about charity care** - Non-profit hospitals must offer this\n4. **Medical debt reporting changed** - Paid medical debt under $500 often isn't reported anymore\n5. **No-interest payment plans** - Many providers offer these\n\nI see you have two medical accounts. Have you tried negotiating with the hospitals directly?",
    suggestedReplies: ['Request itemized bill', 'Ask about charity care', 'Hospital negotiation tips'],
    resourceLink: {
      title: 'Medical Debt Guide',
      url: '/resources/medical-debt',
    },
  },
  {
    keywords: ['credit card', 'credit card debt'],
    category: 'payments',
    response: "Credit card debt can feel overwhelming, but here are your options:\n\n1. **Call and negotiate** - Ask for hardship programs, lower interest rates\n2. **Balance transfer** - If you can qualify, 0% intro rates help\n3. **Debt management plan** - Non-profit credit counselors can help\n4. **Settlement** - If the account is charged off, you may settle for less\n\nFor your Capital One account, you've already negotiated a great hardship plan at 0% interest. That's exactly the right approach. Keep making those payments!",
    suggestedReplies: ['Tell me about debt management', 'How to negotiate interest rate', 'Balance transfer options'],
  },

  // === FALLBACK RESPONSES ===
  {
    keywords: ['what can you do', 'what can you help', 'capabilities', 'features'],
    category: 'greetings',
    response: "I can help you with lots of things! Here's what I do best:\n\n1. **Explain your rights** - FDCPA, credit reporting, lawsuits\n2. **Guide you through disputes** - Validation letters, credit bureau disputes\n3. **Help with budgeting** - Track spending, plan debt payoff\n4. **Answer questions** - About collections, settlements, credit scores\n5. **Provide encouragement** - This journey isn't easy, I'm here for support\n\nWhat would be most helpful for you right now?",
    suggestedReplies: ['Tell me about my rights', 'Help with a dispute', 'Review my budget'],
  },
  {
    keywords: [],
    category: 'fallback',
    response: "I'm still learning, and I'm not sure I understood that. Here are some things I can definitely help with:\n\n- Your rights with debt collectors\n- How to dispute errors on your credit report\n- Understanding credit scores\n- Budgeting and debt payoff strategies\n- Encouragement when you need it!\n\nWould you like to try asking about one of these topics?",
    suggestedReplies: ['What are my rights?', 'How do I dispute a debt?', 'Explain credit scores'],
    resourceLink: {
      title: 'Browse Resource Center',
      url: '/resources',
    },
  },
];

// Helper function to find best matching response
export function findVinnyResponse(userMessage: string): VinnyMockResponse {
  const message = userMessage.toLowerCase();

  // Find all matching responses
  const matches = mockVinnyResponses
    .filter(r => r.keywords.length > 0) // Exclude fallback
    .map(r => ({
      response: r,
      matchCount: r.keywords.filter(k => message.includes(k.toLowerCase())).length,
    }))
    .filter(m => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  // Return best match or fallback
  if (matches.length > 0) {
    return matches[0].response;
  }

  // Return fallback
  return mockVinnyResponses.find(r => r.category === 'fallback')!;
}

// Get responses by category
export function getResponsesByCategory(category: string): VinnyMockResponse[] {
  return mockVinnyResponses.filter(r => r.category === category);
}

// Get random encouragement
export function getRandomEncouragement(): string {
  const encouragements = [
    "You're making progress, even when it doesn't feel like it.",
    "Every step forward counts, no matter how small.",
    "Remember: many people have been where you are and come out the other side.",
    "You've got this. One day at a time.",
    "Taking action is the hardest part - and you're doing it.",
  ];
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}
