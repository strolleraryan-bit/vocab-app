// netlify/functions/lookup.js
//
// This runs on Netlify's servers (not in the browser), so it's safe to keep
// the Gemini API key here as an environment variable. Set it in:
// Netlify dashboard → Site configuration → Environment variables → GEMINI_API_KEY
//
// Get a free key (no credit card) at: https://aistudio.google.com/apikey

exports.handler = async (event) => {
  // CORS headers so the same-site frontend can call this
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API key present:", !!apiKey, "length:", apiKey ? apiKey.length : 0);
  if (!apiKey) {
    console.log("ERROR: GEMINI_API_KEY env var is not set or not visible to this function");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Server is missing GEMINI_API_KEY. Add it in Netlify → Site configuration → Environment variables, then redeploy.",
      }),
    };
  }

  let word;
  try {
    const parsed = JSON.parse(event.body || "{}");
    word = (parsed.word || "").trim();
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!word) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing 'word' in request body" }),
    };
  }

  const prompt = `You are a vocabulary assistant. For the English word "${word}", provide:
1. Hindi meaning (in Devanagari script, give 1-3 words)
2. English meaning (a clear, concise definition, 1-2 sentences)
3. Three example sentences using "${word}" naturally. In each sentence, wrap the word "${word}" (or its inflection) in <b> tags.

Respond ONLY in this exact JSON format (no markdown, no extra text, no code fences):
{
  "hindi": "...",
  "english": "...",
  "uses": ["sentence 1", "sentence 2", "sentence 3"]
}`;

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.log("ERROR: Gemini API returned", geminiRes.status, JSON.stringify(data));
      return {
        statusCode: geminiRes.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Gemini API error",
        }),
      };
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    console.log("ERROR: caught exception:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Lookup failed" }),
    };
  }
};
