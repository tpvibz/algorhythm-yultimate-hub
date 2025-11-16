import { useState } from "react";
import { Settings, MessageCircle, Send } from "lucide-react";
import { aiAPI } from "@/services/api";

const AIAssistantTab = () => {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant' | 'error'; text: string }>>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

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
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion("");
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userQuestion }]);
    setLoading(true);

    try {
      const res = await aiAPI.coachAssistant({
        question: userQuestion,
        context: { 
          language, 
          teamName: teamName || undefined, 
          sessionGoals: sessionGoals.length ? sessionGoals : undefined 
        },
      });
      const output = res?.data?.answer || "No response received.";
      
      // Add assistant message
      setMessages(prev => [...prev, { type: 'assistant', text: output }]);
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message;
      let errorMsg = "";
      
      if (status === 401) {
        errorMsg = "Unauthorized: Please log in again.";
      } else if (status === 403) {
        errorMsg = "Forbidden: AI is available to coaches/admins. Check your login role.";
      } else if (status === 503 || (typeof message === "string" && message.toLowerCase().includes("overloaded"))) {
        errorMsg = "The model is busy. Please try again in a few seconds.";
      } else if (status === 429) {
        errorMsg = "Rate limited. Please slow down and try again shortly.";
      } else {
        errorMsg = message || "Failed to get AI response";
      }
      
      // Add error message
      setMessages(prev => [...prev, { type: 'error', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="bg-card rounded-xl border max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Coaching Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask for drills, session plans, and coaching tips</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-2 py-1 text-xs border rounded-lg hover:bg-muted flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b bg-muted/30 space-y-2">
          <div className="flex gap-2">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (optional)"
              className="flex-1 border rounded-md px-2 py-1.5 text-sm bg-background"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium">Session Goals (optional)</div>
            <div className="flex flex-wrap gap-1.5">
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
                    className={`px-2 py-0.5 rounded-full border text-xs ${
                      active ? "bg-orange-50 border-orange-400 text-orange-700" : "hover:bg-muted"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-4">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Ask me about drills, training plans, or coaching strategies</p>
            
            <div className="mt-4 space-y-1.5 max-w-md mx-auto">
              <p className="text-xs font-medium text-left">Try asking:</p>
              {[
                "Plan a 75-min mixed training for windy conditions",
                "Three progressive drills for zone offense (U16)",
                "Conditioning circuit for 20 players, no cones",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="w-full text-left px-2.5 py-1.5 border rounded-md hover:bg-muted text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                msg.type === 'user'
                  ? 'bg-orange-600 text-white'
                  : msg.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-muted border'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-muted border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about drills, session plans, or coaching tips..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '100px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '40px';
              target.style.height = Math.min(target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors font-medium text-sm flex items-center gap-1.5"
          >
            {loading ? (
              <span className="animate-spin">⋯</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask
              </>
            )}
          </button>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default AIAssistantTab;