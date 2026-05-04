export const prompts = {

  flags: (ctx) => {
    // Only send fields Claude needs — not the full SF object
    const quoteSlim = {
      name: ctx.quote.Name,
      status: ctx.quote.SBQQ__Status__c,
      grandTotal: ctx.quote.SBQQ__GrandTotal__c,
      discount: ctx.quote.SBQQ__Discount__c,
      expiryDate: ctx.quote.SBQQ__ExpirationDate__c,
      priceBook: ctx.quote.Pricebook2Id
    };

    const linesSlim = (ctx.lines || []).map(l => ({
      product: l.SBQQ__ProductName__c,
      qty: l.SBQQ__Quantity__c,
      listPrice: l.SBQQ__ListPrice__c,
      netPrice: l.SBQQ__NetPrice__c,
      discount: l.SBQQ__Discount__c,
      requiredBy: l.SBQQ__RequiredBy__c
    }));

    const rulesSlim = (ctx.rules || []).map(r => ({
      name: r.Name,
      scope: r.SBQQ__Scope__c,
      error: r.SBQQ__ErrorMessage__c
    }));

    return `You are a CPQ configuration reviewer.
Return ONLY a raw JSON array, no markdown, no code fences.
Each item: { "severity", "line_item", "issue", "suggestion" }
severity values: critical | warning | info

Quote: ${JSON.stringify(quoteSlim)}
Lines: ${JSON.stringify(linesSlim)}
Rules: ${JSON.stringify(rulesSlim)}

Check for: missing required bundle components,
quantity anomalies, expired dates, pricing mismatches,
discount policy violations.

Raw JSON array only. No other text.`;
  },

  discount: (ctx) => {
    const discountsSlim = (ctx.discounts || []).map(d => ({
      name: d.Name,
      unit: d.SBQQ__DiscountUnit__c,
      type: d.SBQQ__Type__c
    }));

    return `You are a deal desk analyst.
Return ONLY a raw JSON object, no markdown, no code fences.
Format: { "recommended", "floor", "ceiling", "confidence", "reasoning" }
All discount values are percentages as numbers, not strings.

Quote total: ${ctx.quote.SBQQ__GrandTotal__c ?? 'unknown'}
Current discount: ${ctx.quote.SBQQ__Discount__c ?? 0}%
Account industry: ${ctx.account?.Industry ?? 'unknown'}
Account type: ${ctx.account?.Type ?? 'unknown'}
Discount schedules: ${JSON.stringify(discountsSlim)}

Raw JSON object only. No other text.`;
  },

  justification: (ctx, flags, discount) => {
    // Slim down flags for the justification prompt
    const flagSummary = Array.isArray(flags)
      ? flags.map(f => `[${f.severity}] ${f.line_item}: ${f.issue}`).join('\n')
      : 'No flags data available';

    const discountSummary = typeof discount === 'object'
      ? `Recommended ${discount.recommended}% `
        + `(floor ${discount.floor}%, ceiling ${discount.ceiling}%)`
      : 'No discount data available';

    return `Write an approval justification note.
Max 120 words. Professional, factual, no filler, no headers.
Plain paragraph text only.

Account: ${ctx.account?.Name ?? ctx.quote.SBQQ__Account__c}
Total: ${ctx.quote.SBQQ__GrandTotal__c ?? 'unknown'}
Flags: ${flagSummary}
Discount: ${discountSummary}
Reasoning: ${typeof discount === 'object' ? discount.reasoning : ''}

Structure: what is being requested, why the discount 
is defensible, how flags were addressed, 
recommended approver action.`;
  }
};