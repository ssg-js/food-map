export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (
    process.env.DEPLOYMENT_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production"
  )
    return;
  const { inspectDeployment } = await import("./shared/config/deployment");
  const errors = inspectDeployment(process.env, true).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length)
    throw new Error(
      `Deployment configuration rejected: ${errors.map((issue) => issue.id).join(", ")}`,
    );
}
