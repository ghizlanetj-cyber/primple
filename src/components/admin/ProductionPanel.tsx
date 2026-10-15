import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminProductionConfig } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card, ErrorBox, Loading, Pill, fmtDate } from "./shared";

export function ProductionPanel() {
  const fetch = useServerFn(adminProductionConfig);
  const q = useQuery({ queryKey: ["admin", "production-config"], queryFn: () => fetch(), staleTime: 30_000 });
  const c = q.data;
  const rows = c ? [
    { label: "Base de données et formulaires", ready: c.databaseReady, text: c.databaseReady ? "Connectés" : "Connexion à vérifier" },
    { label: "Fichiers clients privés", ready: c.artworkReady, text: c.artworkReady ? "Stockage privé prêt" : "Stockage à vérifier" },
    { label: "Paiements par carte", ready: c.paymentMode === "live", text: c.paymentMode === "live" ? "Clés réelles configurées" : c.paymentMode === "sandbox" ? "Mode test — clés réelles nécessaires" : "Clés absentes ou incompatibles" },
    { label: "Confirmation de paiement réel", ready: Boolean(c.lastLiveConfirmation), text: c.lastLiveConfirmation ? `Dernière confirmation : ${fmtDate(c.lastLiveConfirmation, true)}` : "À vérifier avec un paiement réel autorisé" },
    { label: "Zoho (facultatif)", ready: c.crmCredentialsReady, text: c.crmCredentialsReady ? "Identifiants prêts · planification à vérifier" : "Identifiants à compléter" },
  ] : [];
  return <Card title="Configuration de production">
    <p className="mb-3 text-sm text-muted-foreground">Les indicateurs décrivent la configuration actuelle. L'activation du compte marchand et la réception du paiement doivent aussi être vérifiées.</p>
    {q.error ? <ErrorBox error={q.error} /> : !c ? <Loading /> : <ul className="divide-y text-sm">{rows.map(r => <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={r.label}><span>{r.label}</span><Pill tone={r.ready ? "good" : "warn"}>{r.text}</Pill></li>)}</ul>}
    <Button variant="outline" size="sm" className="mt-3" disabled={q.isFetching} onClick={() => void q.refetch()}>Vérifier à nouveau</Button>
  </Card>;
}
