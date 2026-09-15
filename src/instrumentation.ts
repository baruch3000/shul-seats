export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvIssues } = await import("@/lib/env");
    logEnvIssues();
  }
}
