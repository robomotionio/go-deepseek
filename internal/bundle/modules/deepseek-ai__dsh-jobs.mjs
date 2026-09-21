// .harness/packages/jobs/jobs/lib/index.js
import { Service } from "@deepseek-ai/cordis";
function JobId(id) {
  return id;
}
var JobRegistry = class JobRegistry2 extends Service {
  constructor(ctx) {
    if (new.target === JobRegistry2) throw new Error("@deepseek-ai/dsh-jobs is the abstract job registry seam; load an implementation such as @deepseek-ai/dsh-jobs-local instead");
    super(ctx, "jobs");
  }
};
export {
  JobId,
  JobRegistry,
  JobRegistry as default
};
