import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import type { AssistantReply, AssistantTurn } from "@/lib/print-assistant";
import { askPrintAssistant } from "@/lib/print-assistant.functions";

type Rec = Extract<AssistantReply, { type: "recommendation" }>;

/**
 * In-memory session shared by every assistant instance during this page
 * session (client navigation). Never written to storage; a reload clears it.
 */
let session: { turns: AssistantTurn[]; result: Rec | null } = { turns: [], result: null };

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
  const [result, setResult] = useState<Rec | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const home = variant === "home";

  useEffect(() => {
    setTurns(session.turns);
    setResult(session.result);
  }, []);

  const save = (t: AssistantTurn[], r: Rec | null) => {
    session = { turns: t, result: r };
    setTurns(t);
    setResult(r);
  };

  const send = async (text = input) => {
    const next = [...turns, { role: "user" as const, text: text.trim() }];
    setLoading(true);
    setError(null);
    try {
      const reply = await ask({ data: { turns: next, lang, context: context ?? "" } });
      setInput("");
      if (reply.type === "question") save([...next, { role: "assistant", text: reply.text }], null);
      else save(next, reply);
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
  };

  const lastQuestion = [...turns].reverse().find((t) => t.role === "assistant");
  const asked = turns.filter((t) => t.role === "assistant").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Printer className="size-4" />
        {tr("Assistant Primple")}
      </div>
      {home && !result && turns.length === 0 && (
        <>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">{tr("What do you want to print?")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Describe your project. I'll help you choose the right product.")}</p>
        </>
      )}

      {result ? (
        <div className="mt-3 rounded-xl border border-border bg-background p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {result.kind === "quote" ? tr("Needs a quote") : tr("Best match")}
          </p>
          <p className="mt-1 text-base font-semibold">{result.kind === "quote" ? tr("Custom quote") : tr(result.name)}</p>
          {result.why && <p className="mt-1">{result.why}</p>}
          <dl className="mt-2 space-y-1">
            {result.quantity && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{tr("Suggested quantity")}:</dt>
                <dd className="font-medium">{result.quantity}</dd>
              </div>
            )}
            {result.direction && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">{tr("Paper / finish")}:</dt>
                <dd>{result.direction}</dd>
              </div>
            )}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            {result.kind === "quote"
              ? tr("This request needs a quote from our team.")
              : tr("Exact price and availability are confirmed in the configurator.")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <Link to={result.href}>
                {result.kind === "quote" ? tr("Request a quote") : tr("See the configurator")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              {tr("Start over")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {lastQuestion && (
            <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="me-2 text-xs text-muted-foreground">{asked}/3</span>
              {lastQuestion.text}
            </p>
          )}
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
              placeholder={lastQuestion ? tr("Your answer") : tr("e.g. Flyers for a restaurant opening")}
              aria-label={tr("Describe your print project")}
            />
            <Button type="submit" disabled={loading || input.trim().length < 2} className="shrink-0">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {lastQuestion ? tr("Reply") : tr("Find the right print")}
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
          {turns.length > 0 && (
            <button type="button" onClick={reset} className="mt-2 text-xs text-muted-foreground underline">
              {tr("Start over")}
            </button>
          )}
        </>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">{tr("Not saved. Do not share personal or payment details.")}</p>
    </section>
  );
}
