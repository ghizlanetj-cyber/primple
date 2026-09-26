import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ChevronDown, Loader2, MessageCircle, PenTool, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { whatsappPlanUrl, type AssistantReply, type AssistantTurn } from "@/lib/print-assistant";
import { askPrintAssistant } from "@/lib/print-assistant.functions";

type Brief = Extract<AssistantReply, { type: "plan" }>;

const CHIPS = ["I'm launching a brand", "I'm preparing a menu", "I need a stand"];

/** Homepage-only creative-brief assistant. Conversation lives in component state only. */
export function DesignExpert() {
  const { tr, lang } = useI18n();
  const ask = useServerFn(askPrintAssistant);
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showThread, setShowThread] = useState(false);

  const send = async (text = input) => {
    const next = [...turns, { role: "user" as const, text: text.trim() }];
    setOpen(true);
    setLoading(true);
    setError(null);
    setTurns(next);
    try {
      const reply = await ask({ data: { turns: next, lang } });
      setInput("");
      if (reply.type === "question") {
        setTurns([...next, { role: "assistant", text: reply.text }]);
      } else {
        setTurns([...next, { role: "assistant", text: reply.goal || reply.summary || tr("Your creative brief") }]);
        setBrief(reply);
      }
    } catch (caught) {
      setTurns(turns);
      setError(caught instanceof Error ? tr(caught.message) : tr("The assistant could not answer. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTurns([]);
    setBrief(null);
    setError(null);
    setInput("");
    setOpen(false);
  };

  const last = turns[turns.length - 1];
  const question = !loading && last?.role === "assistant" && !(brief && last.text === (brief.goal || brief.summary || tr("Your creative brief")))
    ? last.text
    : null;

  return (
    <div className="mt-6 max-w-[520px] rounded-2xl border border-white/15 bg-ink/55 p-3.5 text-ink-foreground backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <PenTool className="size-4 text-primary" />
          {tr("Expert Designer Primple")}
        </p>
        {open && (
          <button type="button" onClick={reset} aria-label={tr("Close")} className="text-ink-foreground/60 hover:text-ink-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>
      {!open && (
        <p className="mt-1 text-[13px] leading-snug text-ink-foreground/75">
          {tr("An idea to clarify? Describe your brand or your print piece. I'll help you prepare a creative brief.")}
        </p>
      )}

      {open && (
        <div className="mt-3 max-h-[46vh] space-y-2.5 overflow-y-auto pe-1 text-sm">
          {turns.length > 2 && (
            <button type="button" onClick={() => setShowThread((v) => !v)} className="flex items-center gap-1 text-xs text-ink-foreground/60">
              <ChevronDown className={`size-3.5 transition-transform ${showThread ? "rotate-180" : ""}`} />
              {tr("Conversation")} ({turns.length})
            </button>
          )}
          {(showThread ? turns.slice(0, -1) : []).map((t, i) => (
            <p key={i} className={t.role === "assistant" ? "text-ink-foreground/85" : "text-ink-foreground/55"}>
              {t.text}
            </p>
          ))}
          {!showThread && turns.length > 0 && !brief && last?.role === "user" && (
            <p className="text-ink-foreground/55">{last.text}</p>
          )}
          {loading && <Loader2 className="size-4 animate-spin text-ink-foreground/60" />}
          {question && <p className="rounded-xl bg-white/10 px-3 py-2">{question}</p>}

          {brief && !question && (
            <div className="rounded-xl bg-background p-3.5 text-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{tr("Your creative brief")}</p>
              {brief.goal && <p className="mt-1 font-medium">{brief.goal}</p>}
              {brief.direction && (
                <p className="mt-2 text-[13px]">
                  <span className="text-muted-foreground">{tr("Visual direction")}: </span>
                  {brief.direction}
                </p>
              )}
              {brief.checklist.length > 0 && (
                <div className="mt-2 text-[13px]">
                  <p className="text-muted-foreground">{tr("Content to prepare")}:</p>
                  <ul className="ms-4 list-disc">
                    {brief.checklist.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-2 text-[13px] text-muted-foreground">{tr("Suggested supports")}:</p>
              <ul className="mt-1 space-y-1.5 text-[13px]">
                {brief.items.map((it, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span>
                      <span className="font-medium">{tr(it.name)}</span>
                      {it.purpose && <span className="text-muted-foreground"> — {it.purpose}</span>}
                      {it.options.length > 0 && (
                        <span className="text-muted-foreground"> ({it.options.map((o) => tr(o.choice)).join(", ")})</span>
                      )}
                    </span>
                    {(it.kind === "product" || it.kind === "pack") && (
                      <Link to={it.href} className="text-xs text-primary underline">
                        {tr("See the configurator")}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{tr("Exact price and availability are confirmed in the configurator.")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brief.next === "design" && (
                  <Button asChild size="sm">
                    <Link to="/design-services">
                      {tr("Book design hours")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                {brief.next === "quote" && (
                  <Button asChild size="sm">
                    <Link to="/contact">
                      {tr("Request a quote")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <a href={whatsappPlanUrl(brief.items, tr("Hello, here is my creative brief:"))} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim().length >= 2 && !loading) void send();
        }}
      >
        <input
          value={input}
          maxLength={600}
          onChange={(e) => setInput(e.target.value)}
          placeholder={question ? tr("Your answer") : tr("e.g. A new coffee brand in Casablanca")}
          aria-label={tr("Describe your project")}
          className="h-10 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-ink-foreground placeholder:text-ink-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="sm" className="h-10 shrink-0 rounded-full" disabled={loading || input.trim().length < 2}>
          {turns.length ? tr("Reply") : tr("Talk to the expert")}
        </Button>
      </form>
      {!open && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => void send(tr(c))}
              className="rounded-full border border-white/20 px-2.5 py-1 text-xs text-ink-foreground/85 hover:bg-white/10"
            >
              {tr(c)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p className="mt-2 text-[11px] text-ink-foreground/55">{tr("No payment details here. Nothing is saved.")}</p>
    </div>
  );
}
