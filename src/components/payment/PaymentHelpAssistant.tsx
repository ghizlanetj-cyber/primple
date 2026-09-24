import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircleQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { suggestPaymentStep } from "@/lib/payment-support.functions";

export function PaymentHelpAssistant() {
  const { tr, lang } = useI18n();
  const ask = useServerFn(suggestPaymentStep);
  const [issue, setIssue] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const result = await ask({ data: { issue, lang } });
      setAnswer(result.suggestion);
    } catch (caught) {
      setError(caught instanceof Error ? tr(caught.message) : tr("The assistant could not answer. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        <MessageCircleQuestion className="size-5 text-primary" />
        {tr("Payment help")}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {tr("Describe what happened and we'll suggest the next step. Never share card numbers or codes.")}
      </p>
      <Textarea
        className="mt-3"
        rows={3}
        maxLength={1500}
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        placeholder={tr("e.g. My card was declined after the bank code")}
      />
      <Button className="mt-3" onClick={submit} disabled={loading || issue.trim().length < 5}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {tr("Get a suggestion")}
      </Button>
      {answer && <p className="mt-4 whitespace-pre-line rounded-xl bg-muted p-4 text-sm">{answer}</p>}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
