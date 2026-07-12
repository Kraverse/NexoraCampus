"use client";

import { useState, useRef, useEffect } from "react";
import { Spinner } from "./ui";
import { IconClose, IconSend, IconSparkles } from "./icons";

interface Msg {
  role: "user" | "nova";
  text: string;
}

const SUGGESTIONS = [
  "How do I create a post?",
  "Where can I find internships?",
  "How does saving work?",
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "nova", text: "Hey! I'm Nova 👋 your NexoraCampus guide. Ask me anything about the app!" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assistant", text: q }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "nova", text: data.reply || "Hmm, try rephrasing that." }]);
    } catch {
      setMsgs((m) => [...m, { role: "nova", text: "I'm having trouble right now. Try again in a bit." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="nx-float fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #7c5cff, #22d3ee)",
          boxShadow: "0 10px 40px -8px rgba(124,92,255,0.6)",
        }}
        aria-label="Open assistant"
      >
        {open ? <IconClose /> : <IconSparkles width={24} height={24} />}
      </button>

      {open && (
        <div className="nx-scale-in fixed bottom-24 right-5 z-40 flex h-[30rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[#7c5cff]/15 to-[#22d3ee]/10 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-white">
              <IconSparkles width={18} height={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Nova Assistant</div>
              <div className="text-[11px] text-emerald-400">● Online</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-[#7c5cff] text-white"
                      : "rounded-bl-sm border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                  <Spinner size={14} />
                </div>
              </div>
            )}
            {msgs.length <= 1 && (
              <div className="space-y-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-left text-xs text-[var(--text-dim)] transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[var(--border)] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova…"
              className="nx-focus flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="nx-btn-primary flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-50"
              aria-label="Send"
            >
              <IconSend width={16} height={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
