import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getDesignChat, sendDesignMessage } from "@/lib/design-chat.functions";
import { useI18n } from "@/i18n";

const MAX = 2000;

export function DesignerChat({ userId }: { userId: string | undefined }) {
  const { tr, lang } = useI18n();
  const loadChat = useServerFn(getDesignChat);
  const send = useServerFn(sendDesignMessage);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["design-chat", userId],
    queryFn: () => loadChat({}),
    enabled: Boolean(userId),
    // The designer replies from the back office; poll so new answers appear.
    refetchInterval: 10000,
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const mutation = useMutation({
    mutationFn: (body: string) => send({ data: { body } }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["design-chat", userId] });
    },
    onError: () => toast.error(tr("Your message could not be sent. Please try again.")),
  });

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    mutation.mutate(body.slice(0, MAX));
  };

  const timeFormat = (iso: string) =>
    new Date(iso).toLocaleString(lang === "fr" ? "fr-MA" : lang === "ar" ? "ar-MA" : "en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="surface-card flex min-h-[28rem] flex-col p-4 sm:p-6">
      <div>
        <h2 className="text-xl">{tr("Designer chat")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("Talk directly with your Primple designer about your files and your brief.")}
        </p>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-xl bg-secondary/40 p-3 sm:max-h-[26rem] sm:p-4">
        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tr("Loading your conversation…")}
          </p>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tr("The conversation could not be loaded.")}
          </p>
        )}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tr("No messages yet. Send the first one and a designer will reply here.")}
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderRole === "client";
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={cn(
                    "mt-1.5 text-[11px]",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {mine ? tr("You") : tr("Designer")} · {timeFormat(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
          rows={3}
          placeholder={tr("Write your message to the designer…")}
          aria-label={tr("Write your message to the designer…")}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {draft.length}/{MAX}
          </p>
          <Button
            className="rounded-full"
            onClick={submit}
            disabled={mutation.isPending || draft.trim().length === 0}
          >
            <Send className="size-4 rtl:rotate-180" />
            {tr("Send message")}
          </Button>
        </div>
      </div>
    </div>
  );
}
