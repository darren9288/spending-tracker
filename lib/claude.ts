function extractJSON(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON found in response");
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    if (c === "}") { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
  }
  throw new Error("Unbalanced JSON in response");
}

export type ParsedEntry = {
  description: string;
  amount: number;
  category: string;
  wallet: string | null;
};

export type ParseResult = {
  date: string;
  entries: ParsedEntry[];
};

export async function parseExpenses(
  text: string,
  walletNames: string[]
): Promise<ParseResult> {
  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();

  const baseURL = process.env.CLAUDE_PROXY_URL ?? "https://api.anthropic.com";
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  // Build the messages endpoint — handle both proxy and direct API URL shapes
  const url = baseURL.endsWith("/v1")
    ? `${baseURL}/messages`
    : `${baseURL}/v1/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are an expense parser. Extract date, description, amount, category, and wallet from the user's text.
Return ONLY valid JSON in this exact format:
{
  "date": "YYYY-MM-DD",
  "entries": [
    {
      "description": "string",
      "amount": number,
      "category": "Food|Transport|Shopping|Entertainment|Health|Bills|Other",
      "wallet": "wallet name or null"
    }
  ]
}

Rules:
- date: if user writes "24/4" or "24 April" → use year ${year}. If no date given, use today (${today}).
- amount: numeric only, no currency symbols.
- category: pick the closest match from: Food, Transport, Shopping, Entertainment, Health, Bills, Other.
- wallet: if the user mentions a wallet name in parentheses like "(Maybank)" or inline like "paid with CIMB", extract it. Known wallets: ${walletNames.join(", ") || "none"}. Otherwise null.
- Return ONLY the JSON, no explanation.`,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  const content = data.content?.[0];
  if (!content || content.type !== "text") throw new Error("Unexpected response type");

  return extractJSON(content.text) as ParseResult;
}
