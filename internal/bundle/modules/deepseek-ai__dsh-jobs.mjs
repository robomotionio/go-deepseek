// .harness/packages/jobs/jobs/lib/index.js
import { Service } from "@deepseek-ai/cordis";
function installJobArchiveAdmission(ctx, registry) {
  ctx.on("workspace/session-activity", async ({ sessionId }, next) => {
    const jobs = runningJobs(registry, sessionId);
    const rest = await next();
    if (jobs.length === 0) return rest;
    return [{
      kind: "job",
      items: jobs.map((job) => ({
        id: job.id,
        label: job.label
      }))
    }, ...rest];
  });
  ctx.on("workspace/session-stop", ({ sessionId }) => {
    for (const job of runningJobs(registry, sessionId)) try {
      registry.kill(job.id, sessionId, "session archived");
    } catch (error) {
      ctx.logger.warn(`jobs: killing "${job.id}" for an archived Session failed: ${String(error)}`);
    }
  });
}
function runningJobs(registry, owner) {
  return registry.list(owner).filter((job) => job.owner === owner && (job.status === "running" || job.status === "stopping"));
}
function JobId(id) {
  return id;
}
var JobRegistry = class JobRegistry2 extends Service {
  constructor(ctx) {
    if (new.target === JobRegistry2) throw new Error("@deepseek-ai/dsh-jobs is the abstract job registry seam; load an implementation such as @deepseek-ai/dsh-jobs-local instead");
    super(ctx, "jobs");
    installJobArchiveAdmission(ctx, this);
  }
};
export {
  JobId,
  JobRegistry,
  JobRegistry as default
};
