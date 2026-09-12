/** Maps auth errors to base English phrases translated through the i18n `tr()` helper. */
export function authErrorPhrase(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  const message = raw.toLowerCase();

  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("email not confirmed")) return "Please confirm your email address first.";
  if (message.includes("already registered") || message.includes("already been registered"))
    return "This email already has an account. Please log in instead.";
  if (message.includes("password should be")) return "Your password must be at least 6 characters.";
  if (message.includes("rate limit") || message.includes("too many"))
    return "Too many attempts. Please try again in a few minutes.";
  if (message.includes("session") && message.includes("expired"))
    return "Your session has expired. Please log in again.";
  if (message.includes("disabled") || message.includes("banned"))
    return "This account is disabled. Please contact support.";
  if (message.includes("cancel") || message.includes("closed") || message.includes("denied"))
    return "Sign-in was cancelled.";
  if (message.includes("network") || message.includes("fetch"))
    return "Network problem. Check your connection and try again.";
  if (message.includes("provider") && message.includes("not"))
    return "This sign-in method is unavailable right now.";
  return "Something went wrong. Please try again.";
}
