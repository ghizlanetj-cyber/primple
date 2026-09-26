import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ChevronDown, Loader2, MessageCircle, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { whatsappPlanUrl, type AssistantReply, type AssistantTurn } from "@/lib/print-assistant";
import { askPrintAssistant } from "@/lib/print-assistant.functions";

type Plan = Extract<AssistantReply, { type: "plan" }>;

/**
 * In-memory session shared by every assistant instance during this page
 * session (client navigation). Never written to storage; a reload clears it.
 */
let session: { turns: AssistantTurn[]; plan: Plan | null; planIsLatest: boolean } = { turns: [], plan: null, planIsLatest: false };

const CHIPS = [
  "I'm opening a café",
  "I'm launching my online shop",
  "I'm preparing a trade-show stand",
  "I want business cards",
];

export function PrintAssistant({ context, variant = "compact" }: { context?: string; variant?: "compact" | "home" }) {
  const { tr, lang } = useI18n();
  const ask = useServerFn(askPrintAssistant);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planIsLatest, setPlanIsLatest] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const home = variant === "home";

  useEffect(() => {
    setTurns(session.turns);
    setPlan(session.plan);
    setPlanIsLatest(session.planIsLatest);
  }, []);

  const save = (t: AssistantTurn[], p: Plan | null, latest = false) => {
    session = { turns: t, plan: p, planIsLatest: latest };
    setPlanIsLatest(latest);
    setTurns(t);
    setPlan(p);
  };

  const send = async (text = input) => {
    const next = [...turns, { role: "user" as const, text: text.trim() }];
    setLoading(true);
    setError(null);
    try {
      const reply = await ask({ data: { turns: next, lang, context: context ?? "" } });
      setInput("");
      if (reply.type === "question") save([...next, { role: "assistant", text: reply.text }], plan);
      else {
        const note = reply.summary || reply.items.map((i) => tr(i.name)).join(", ");
        save([...next, { role: "assistant", text: note }], reply, true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? tr(caught.message) : tr("The assistant could not answer. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    save([], null);
    setError(null);
    setInput("");
    setShowThread(false);
  };

  const last = turns[turns.length - 1];
  const isQuestion = !loading && last?.role === "assistant" && !planIsLatest;
  const pendingQuestion = isQuestion ? last : null;
  const multi = (plan?.items.length ?? 0) > 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Printer className="size-4" />
          {tr("Assistant Primple")}
        </div>
        {turns.length > 0 && (
          <button type="button" onClick={reset} className="text-xs text-muted-foreground underline">
            {tr("Start over")}
          </button>
        )}
      </div>
      {home && turns.length === 0 && (
        <>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">{tr("What do you want to print?")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Describe your project. I'll help you choose the right product.")}</p>
        </>
      )}

      {turns.length > 1 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowThread((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground"
            aria-expanded={showThread}
          >
            <ChevronDown className={`size-3.5 transition-transform ${showThread ? "rotate-180" : ""}`} />
            {tr("Conversation")} ({turns.length})
          </button>
          {showThread && (
            <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto text-sm">
              {turns.map((t, i) => (
                <p key={i} className={t.role === "assistant" ? "rounded-lg bg-muted px-3 py-1.5" : "px-3 text-muted-foreground"}>
                  {t.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {plan && (
        <div className="mt-3 rounded-xl border border-border bg-background p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {multi ? tr("Your print plan") : plan.items[0]?.kind === "quote" ? tr("Needs a quote") : tr("Best match")}
          </p>
          {plan.summary && multi && <p className="mt-1">{plan.summary}</p>}
          <ul className="mt-2 divide-y divide-border">
            {plan.items.map((it, i) => (
              <li key={i} className="py-2.5 first:pt-0 last:pb-0">
                <p className="font-semibold">{tr(it.name)}</p>
                {it.purpose && <p className="mt-0.5">{it.purpose}</p>}
                {(it.quantity || it.options.length > 0) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {it.quantity ? `${tr("Suggested quantity")}: ${it.quantity}` : ""}
                    {it.quantity && it.options.length ? " · " : ""}
                    {it.options.map((o) => `${tr(o.group)}: ${tr(o.choice)}`).join(" · ")}
                  </p>
                )}
                <Button asChild size="sm" variant={it.kind === "quote" ? "default" : multi ? "outline" : "default"} className="mt-2">
                  <Link to={it.href}>
                    {it.kind === "quote" ? tr("Request a quote") : tr("See the configurator")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{tr("Exact price and availability are confirmed in the configurator.")}</p>
          {multi && (
            <Button asChild size="sm" variant="secondary" className="mt-2">
              <a href={whatsappPlanUrl(plan.items, tr("Hello, here is my print plan:"))} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                {tr("Send my plan on WhatsApp")}
              </a>
            </Button>
          )}
        </div>
      )}

      {isQuestion && pendingQuestion && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">{pendingQuestion.text}</p>}

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim().length >= 2 && !loading) void send();
        }}
      >
        <Input
          value={input}
          maxLength={600}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isQuestion ? tr("Your answer") : plan ? tr("Add a detail or ask a question") : tr("e.g. Flyers for a restaurant opening")
          }
          aria-label={tr("Describe your print project")}
        />
        <Button type="submit" disabled={loading || input.trim().length < 2} className="shrink-0">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {turns.length ? tr("Reply") : tr("Find the right print")}
        </Button>
      </form>
      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={loading}
              onClick={() => void send(tr(c))}
              className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted disabled:opacity-50"
            >
              {tr(c)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">{tr("No payment details here. Nothing is saved.")}</p>
    </section>
  );
}
