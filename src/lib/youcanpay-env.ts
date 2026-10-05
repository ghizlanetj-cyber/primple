/** Classifies YouCan Pay keys by prefix. Never returns or logs the key itself. */
export type KeyEnv = "sandbox" | "live" | null;

export function keyEnvironment(key: string | undefined, kind: "pub" | "pri"): KeyEnv {
  if (!key) return null;
  if (key.startsWith(`${kind}_sandbox_`)) return "sandbox";
  if (key.startsWith(`${kind}_`)) return "live";
  return null;
}

/** Both keys must exist and share one environment; otherwise payments must not start. */
export function pairEnvironment(pub: string | undefined, pri: string | undefined): "sandbox" | "live" {
  const p = keyEnvironment(pub, "pub");
  const r = keyEnvironment(pri, "pri");
  if (!p || !r) throw new Error("YouCan Pay is not configured.");
  if (p !== r) throw new Error("YouCan Pay keys are from different environments.");
  return p;
}
