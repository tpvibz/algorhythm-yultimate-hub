import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.VERTEX_API_KEY ||
  "";

// Allow overriding the model via env; default to gemini-2.5-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Helper to call Google Generative Language API (Gemini) via API key with retries
async function callGeminiGenerateContent(promptParts) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
  }

  const urlBase =
    `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent?key=` + encodeURIComponent(GEMINI_API_KEY);

  const maxRetries = 3;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(urlBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: promptParts.map((p) => ({ text: p })),
            },
          ],
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        let details = await response.text();
        try {
          const parsed = JSON.parse(details);
          details = parsed?.error?.message || details;
        } catch (_) {}

        if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
          const backoffMs = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        const hint =
          response.status === 401 || response.status === 403
            ? " (check API key and model access)"
            : response.status === 429 || response.status === 503
            ? " (model is overloaded; try again shortly)"
            : "";
        throw new Error(`Gemini API error: ${response.status} ${details}${hint}`);
      }

      const data = await response.json();
      const candidates = data?.candidates || [];
      const firstText = candidates[0]?.content?.parts?.[0]?.text || "";
      return firstText;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoffMs = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }
      break;
    }
  }

  if (lastError) throw lastError;
  throw new Error("Gemini API error: unknown failure");
}

// POST /api/ai/coach-assistant
// Body: { question: string, context?: { teamName?: string, sessionGoals?: string[], roster?: any[], recentStats?: any, language?: string } }
export const coachAssistant = async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ success: false, message: "'question' is required" });
    }

    const roleHint = `You are an elite ULTIMATE FRISBEE coaching assistant.
Output style (guidelines, not strict rules):
- Keep answers short and skimmable with concise bullet points
- Focus on ultimate frisbee concepts and practical coaching guidance
- Provide 1–2 specific drills with reps/time and coaching cues when appropriate
- Include measurable outcomes or success criteria where possible
- If details are missing (age, duration, focus), infer reasonable defaults and proceed
- Only ask a brief clarifying question if an assumption would change the plan meaningfully`;

    const ctxLines = [];
    if (context?.teamName) ctxLines.push(`Team: ${context.teamName}`);
    if (Array.isArray(context?.sessionGoals) && context.sessionGoals.length > 0) ctxLines.push(`Session goals: ${context.sessionGoals.join(", ")}`);
    if (context?.recentStats) ctxLines.push(`Recent stats/observations: ${JSON.stringify(context.recentStats)}`);
    if (Array.isArray(context?.roster) && context.roster.length > 0) ctxLines.push(`Roster notes: ${JSON.stringify(context.roster.slice(0, 5))}${context.roster.length > 5 ? " (truncated)" : ""}`);

    const language = context?.language && typeof context.language === "string" ? context.language : "en";

    const promptParts = [
      roleHint,
      ctxLines.length ? `Context:\n${ctxLines.join("\n")}` : "",
      `Coach question: ${question}`,
      `Guidance: Respond in ${language}. Aim for concise bullet points. Prioritize session improvement and drill specificity. If context is missing, infer sensible defaults (e.g., mixed youth, 60 minutes, fundamentals) and continue.`,
    ].filter(Boolean);

    let answer = await callGeminiGenerateContent(promptParts);
    if (!answer || typeof answer !== "string" || !answer.trim()) {
      // Fallback: try a compact re-ask prompt once to avoid empty responses
      const fallbackPrompt = [
        `Provide concise, helpful ultimate frisbee coaching guidance. If details are missing, infer defaults (mixed youth, ~60 minutes) and proceed. Include 1–2 practical drills with cues and outcomes.`,
        `Coach question: ${question}`,
      ];
      try {
        answer = await callGeminiGenerateContent(fallbackPrompt);
      } catch (_) {}
    }
    if (!answer || !answer.trim()) {
      // Provide a generic but useful template rather than asking the user to rephrase
      answer = [
        "Session focus: Fundamentals and small-sided decision making (assumed mixed youth, ~60m)",
        "Warm-up (10m): Dynamic mobility + partner throwing (forehand/backhand cues: wrist snap, nose angle)",
        "Drill 1 (15m): Three-cone give-go – 6 reps/player; coaching cues: attack under space, pivot to threaten, quick resets; outcome: >70% clean passes",
        "Drill 2 (15m): 4v3 advantage – start with force forehand; cues: first look break-side, reset within 3s, clear lanes; outcome: 3+ consecutive completions",
        "Game (15m): 5v5 mini with endzone; constraints: 7s stall, must use one break throw/point; outcome: faster resets, improved spacing",
        "Cool-down (5m): Light jog + two team takeaways"
      ].join("\n- ");
    }

    return res.json({ success: true, data: { answer } });
  } catch (err) {
    console.error("coachAssistant error:", err);
    return res.status(500).json({ success: false, message: err.message || "AI service failed" });
  }
};

export default { coachAssistant };


