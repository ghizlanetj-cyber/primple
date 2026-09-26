import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import type { AssistantReply, AssistantTurn } from "@/lib/print-assistant";
import { askPrintAssistant } from "@/lib/print-assistant.functions";

/** Compact, in-memory only. The manual configurator never depends on it. */
export function PrintAssistant({ context }: { context?: string }) {
  const { tr, lang } = useI18n();
  const ask = useServerFn(askPrintAssistant);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Extract<AssistantReply, { type: "recommendation" }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const next = [...turns, { role: "user" as const, text: input.trim() }];
    setLoading(true);
    setError(null);
    try {
      const reply = await ask({ data: { turns: next, lang, context } });
      setInput("");
      if (reply.type === "question") setTurns([...next, { role: "assistant", text: reply.text }]);
      else {
        setTurns(next);
        setResult(reply);
      }
    } catch (caught) {
      setError(caught instanceof Error ? tr(caught.message) : tr("The assistant could not answer. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTurns([]);
    setResult(null);
    setError(null);
    setInput("");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-5 text-primary" />
        {tr("Assistant Primple")}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {tr("Describe your print project and get a product suggestion. Exact price and availability are confirmed in the configurator.")}
      </p>

      {turns.length > 0 && (
        <div className="mt-3 space-y-2 text-sm">
          {turns.map((t, i) => (
            <p key={i} className={t.role === "assistant" ? "rounded-xl bg-muted p-3" : "text-muted-foreground"}>
              {t.text}
            </p>
          ))}
        </div>
      )}

      {result ? (
        <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
          <p className="font-semibold">{result.kind === "quote" ? tr("Custom quote") : tr(result.name)}</p>
          {result.quantity && (
            <p className="mt-1">
              {tr("Suggested quantity")}: {result.quantity}
            </p>
          )}
          {result.direction && <p className="mt-1">{result.direction}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            {result.kind === "quote"
              ? tr("This request needs a quote from our team.")
              : tr("Exact price and availability are confirmed in the configurator.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to={result.href}>
                {result.kind === "quote" ? tr("Request a quote") : tr("See the configurator")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              {tr("Start over")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Textarea
            className="mt-3"
            rows={2}
            maxLength={600}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr("e.g. Flyers for a restaurant opening")}
          />
          <Button className="mt-3" size="sm" onClick={send} disabled={loading || input.trim().length < 3}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {tr("Ask")}
          </Button>
        </>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        {tr("Not saved. Do not share personal or payment details.")}
      </p>
    </section>
  );
}
