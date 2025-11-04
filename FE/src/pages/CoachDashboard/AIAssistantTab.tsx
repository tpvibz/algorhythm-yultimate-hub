import { useState } from "react";
import { aiAPI } from "@/services/api";

const AIAssistantTab = () => {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [hasAsked, setHasAsked] = useState(false);

  const goalOptions = [
    "Throwing mechanics",
    "Handler movement",
    "Zone offense",
    "Zone defense",
    "Endzone efficiency",
    "Transition defense",
    "Conditioning",
  ];

  const ask = async () => {
    setError("");
    setAnswer("");
    if (!question.trim()) return;
    setLoading(true);
    setHasAsked(true);
    try {
      const res = await aiAPI.coachAssistant({
        question,
        context: { language, teamName: teamName || undefined, sessionGoals: sessionGoals.length ? sessionGoals : undefined },
      });
      const output = res?.data?.answer || "";
      setAnswer(output);
      setHistory((prev) => [{ q: question, a: output }, ...prev].slice(0, 10));
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message;
      if (status === 401) {
        setError("Unauthorized: Please log in again.");
      } else if (status === 403) {
        setError("Forbidden: AI is available to coaches/admins. Check your login role.");
      } else if (status === 503 || (typeof message === "string" && message.toLowerCase().includes("overloaded"))) {
        setError("The model is busy. Please try again in a few seconds.");
      } else if (status === 429) {
        setError("Rate limited. Please slow down and try again shortly.");
      } else {
        setError(message || "Failed to get AI response");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-5 border">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">AI Coaching Assistant</h2>
        <p className="text-muted-foreground">Ask for drills, session plans, and coaching tips.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Input and controls */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-3 items-center">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (optional)"
              className="flex-1 border rounded-md px-3 py-2"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-md px-2 py-2"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
            <button
              onClick={ask}
              disabled={loading || !question.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>

          <div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Design a 60-min session to improve zone offense for U16 mixed."
              className="w-full h-28 border rounded-md p-3"
            />
            <div className="text-sm text-muted-foreground mt-2">Tip: Add age group, time, and focus area (optional).</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Quick goals</div>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((g) => {
                const active = sessionGoals.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() =>
                      setSessionGoals((prev) =>
                        active ? prev.filter((x) => x !== g) : [...prev, g]
                      )
                    }
                    className={`px-3 py-1 rounded-full border text-sm ${
                      active ? "bg-orange-50 border-orange-400 text-orange-700" : "hover:bg-muted"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-muted/30 rounded-md border p-4 min-h-[120px]">
            {loading && <div className="text-sm text-muted-foreground">Generating response…</div>}
            {!loading && error && <div className="text-red-600">{error}</div>}
            {!loading && !error && (
              <div className="prose max-w-none whitespace-pre-wrap text-foreground">
                {answer ? answer : hasAsked ? "No content returned. Please try again." : ""}
              </div>
            )}
          </div>
        </div>

        {/* Right: History & suggestions */}
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium mb-2">Suggestions</div>
            <div className="space-y-2">
              {[
                "Plan a 75-min mixed training for windy conditions",
                "Three progressive drills for zone offense (U16)",
                "Conditioning circuit for 20 players, no cones",
                "Transition defense checklist after a turn",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="w-full text-left px-3 py-2 border rounded-md hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Recent</div>
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {history.length === 0 && (
                <div className="text-sm text-muted-foreground">No conversations yet.</div>
              )}
              {history.map((h, idx) => (
                <div key={idx} className="border rounded-md">
                  <div className="px-3 py-2 text-sm bg-muted/40 font-medium">Q: {h.q}</div>
                  <div className="px-3 py-2 text-sm whitespace-pre-wrap">{h.a.slice(0, 300)}{h.a.length > 300 ? "…" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantTab;


