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

  const brief_ = brief && !question ? brief : null;

  return (
    <div className="mt-7 max-w-[540px] rounded-[22px] border border-white/10 bg-ink/35 p-4 text-ink-foreground backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
            <PenTool className="size-3.5 text-primary" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">{tr("Expert designer")}</p>
            <p className="mt-1 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{tr("Let's turn your idea into a brief.")}</p>
          </div>
        </div>
        {open && (
          <button
            type="button"
            onClick={reset}
            aria-label={tr("Close")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-foreground/55 transition-colors hover:bg-white/8 hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {!open && (
        <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-foreground/65 sm:ps-11">
          {tr("An idea to clarify? Describe your brand or your print piece. I'll help you prepare a creative brief.")}
        </p>
      )}

      {open && (
        <div className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto border-t border-white/10 pe-1 pt-3 text-sm">
          {turns.length > 2 && (
            <button
              type="button"
              onClick={() => setShowThread((v) => !v)}
              className="flex items-center gap-1 rounded text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50 hover:text-ink-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronDown className={`size-3.5 transition-transform ${showThread ? "rotate-180" : ""}`} />
              {tr("Conversation")} ({turns.length})
            </button>
          )}
          {(showThread ? turns.slice(0, -1) : []).map((t, i) => (
            <p
              key={i}
              className={`max-w-[52ch] border-s ps-3 text-[13px] leading-relaxed ${t.role === "assistant" ? "border-primary/40 text-ink-foreground/80" : "border-white/15 text-ink-foreground/55"}`}
            >
              {t.text}
            </p>
          ))}
          {!showThread && turns.length > 0 && !brief && last?.role === "user" && (
            <p className="max-w-[52ch] border-s border-white/15 ps-3 text-[13px] text-ink-foreground/55">{last.text}</p>
          )}
          {loading && <Loader2 className="size-4 animate-spin text-primary" />}
          {question && (
            <p className="max-w-[52ch] border-s-2 border-primary ps-3 text-[15px] leading-relaxed text-ink-foreground">{question}</p>
          )}

          {brief_ && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">{tr("Your creative brief")}</p>
              {brief_.goal && <p className="mt-1.5 max-w-[52ch] text-[15px] font-medium leading-snug">{brief_.goal}</p>}
              {brief_.direction && (
                <div className="mt-3 border-t border-white/10 pt-3 text-[13px]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50">{tr("Visual direction")}</p>
                  <p className="mt-1 max-w-[52ch] text-ink-foreground/85">{brief_.direction}</p>
                </div>
              )}
              {brief_.checklist.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3 text-[13px]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50">{tr("Content to prepare")}</p>
                  <ul className="mt-1 ms-4 list-disc space-y-0.5 text-ink-foreground/85 marker:text-primary">
                    {brief_.checklist.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50">{tr("Suggested supports")}</p>
                <ul className="mt-2 space-y-2 text-[13px]">
                  {brief_.items.map((it, i) => (
                    <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="max-w-[40ch]">
                        <span className="font-medium">{tr(it.name)}</span>
                        {it.purpose && <span className="text-ink-foreground/60"> — {it.purpose}</span>}
                        {it.options.length > 0 && (
                          <span className="text-ink-foreground/50"> ({it.options.map((o) => tr(o.choice)).join(", ")})</span>
                        )}
                      </span>
                      {(it.kind === "product" || it.kind === "pack") && (
                        <Link to={it.href} className="rounded text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          {tr("See the configurator")}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[11px] text-ink-foreground/50">{tr("Exact price and availability are confirmed in the configurator.")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brief_.next === "design" && (
                  <Button asChild size="sm" className="h-10 rounded-full px-4">
                    <Link to="/design-services">
                      {tr("Book design hours")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                {brief_.next === "quote" && (
                  <Button asChild size="sm" className="h-10 rounded-full px-4">
                    <Link to="/contact">
                      {tr("Request a quote")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-full border-white/20 bg-transparent px-4 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                >
                  <a href={whatsappPlanUrl(brief_.items, tr("Hello, here is my creative brief:"))} target="_blank" rel="noopener noreferrer">
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
        className="group mt-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] p-1 ps-4 transition-colors focus-within:border-primary/60 focus-within:bg-white/[0.08]"
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
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink-foreground placeholder:text-ink-foreground/45 focus:outline-none"
        />
        <Button
          type="submit"
          size="sm"
          aria-label={turns.length ? tr("Reply") : tr("Talk to the expert")}
          className="h-10 shrink-0 gap-1.5 rounded-full px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          disabled={loading || input.trim().length < 2}
        >
          <span className="hidden sm:inline">{turns.length ? tr("Reply") : tr("Talk to the expert")}</span>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 rtl:rotate-180" />}
        </Button>
      </form>
      {!open && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => void send(tr(c))}
              className="min-h-9 rounded-full border border-white/12 px-3 text-xs text-ink-foreground/75 transition-colors hover:border-primary/50 hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {tr(c)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p className="mt-3 text-[11px] text-ink-foreground/45">{tr("No payment data · nothing saved")}</p>
    </div>
  );
}
