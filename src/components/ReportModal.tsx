"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/categories";
import { Spinner } from "./ui";
import { IconClose, IconFlag, IconCheck } from "./icons";

export function ReportModal({
  open,
  onClose,
  postId,
}: {
  open: boolean;
  onClose: () => void;
  postId: number;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function submit() {
    if (!reason) return;
    setBusy(true);
    try {
      await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        setDone(false);
        setReason("");
        setDetails("");
      }, 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 nx-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="nx-scale-in w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <IconCheck width={28} height={28} />
            </div>
            <h3 className="text-lg font-semibold text-white">Report submitted</h3>
            <p className="mt-1 text-sm text-[var(--text-dim)]">Our team will review it. Thank you!</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-400"><IconFlag /></span>
                <h3 className="text-lg font-semibold text-white">Report post</h3>
              </div>
              <button onClick={onClose} className="text-[var(--text-faint)] hover:text-white">
                <IconClose />
              </button>
            </div>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                    reason === r
                      ? "border-[#7c5cff] bg-[var(--accent-soft)] text-white"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {r}
                  {reason === r && <IconCheck width={16} height={16} className="text-[#a78bfa]" />}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Additional details (optional)…"
              className="nx-focus mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
            />
            <button
              onClick={submit}
              disabled={!reason || busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {busy ? <Spinner /> : "Submit report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
