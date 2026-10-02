// .harness/packages/jobs/tool-jobs/lib/index.js
import z from "@deepseek-ai/schemastery";
import { boundContextSummary, createUserMessage } from "@deepseek-ai/dsh-llm";
import { TextRetainer } from "@deepseek-ai/dsh-output-retention";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { JobId } from "@deepseek-ai/dsh-jobs";
function jobDetail(job) {
  return job.progress ?? job.detail;
}
function publicJob(job) {
  const detail = jobDetail(job);
  return {
    id: job.id,
    kind: job.kind,
    label: job.label,
    status: job.status,
    ...detail !== void 0 ? { detail } : {},
    startedAt: job.startedAt,
    ...job.finishedAt !== void 0 ? { finishedAt: job.finishedAt } : {}
  };
}
function statusLine(snapshot) {
  return snapshot.detail !== void 0 ? `[status: ${snapshot.status}, ${snapshot.detail}]` : `[status: ${snapshot.status}]`;
}
function renderModelDelta(chunks, lossy, spillPaths) {
  const visible = chunks.filter((chunk) => chunk.channel !== "log");
  const out = visible.filter((chunk) => chunk.channel !== "stderr").map((chunk) => chunk.text).join("");
  const err = visible.filter((chunk) => chunk.channel === "stderr").map((chunk) => chunk.text).join("");
  const separator = out.length > 0 && !out.endsWith("\n") ? "\n" : "";
  const body = out + (err.length > 0 ? `${separator}[stderr]
${err}` : "");
  if (!lossy && !visible.some((chunk) => chunk.gapBefore === true)) return body;
  const notice = `[some output was dropped from memory; full output: ${spillPaths.length > 0 ? spillPaths.join(", ") : "(unavailable)"}]`;
  return `${body}${body.length > 0 && !body.endsWith("\n") ? "\n" : ""}${notice}`;
}
var name = "tool-jobs";
var inject = [
  "tools",
  "jobs",
  "systemPrompt"
];
var Config = z.object({
  waitTimeoutMs: z.number().min(1).default(3e4),
  maxWaitTimeoutMs: z.number().min(1).default(6e5),
  completionDelivery: z.union(["quiet", "wakeup"]).default("wakeup"),
  maxConsecutiveWakes: z.number().min(1)
});
var PUBLIC_JOB_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      required: true
    },
    kind: {
      type: "string",
      required: true
    },
    label: {
      type: "string",
      required: true
    },
    status: {
      type: "string",
      required: true,
      enum: [
        "running",
        "stopping",
        "completed",
        "killed",
        "failed"
      ]
    },
    detail: { type: "string" },
    startedAt: {
      type: "integer",
      required: true
    },
    finishedAt: { type: "integer" }
  }
};
var encoder = new TextEncoder();
function retainTail(text, maxBytes) {
  const retainer = new TextRetainer({
    kind: "tail",
    maxBytes
  });
  retainer.push(text);
  return retainer.finish().text;
}
function retainHead(text, maxBytes) {
  const retainer = new TextRetainer({
    kind: "head",
    maxBytes
  });
  retainer.push(text);
  return retainer.finish().text;
}
function fitWithSuffix(content, suffix, maxBytes, omitted) {
  const complete = `${content}${suffix}`;
  if (maxBytes === void 0 || encoder.encode(complete).byteLength <= maxBytes) return complete;
  const fixed = `${content.endsWith(omitted.trimStart()) ? "" : omitted}${suffix}`;
  const fixedBytes = encoder.encode(fixed).byteLength;
  if (fixedBytes >= maxBytes) return retainTail(fixed, maxBytes);
  return `${retainTail(content, maxBytes - fixedBytes)}${fixed}`;
}
function completionSummary(job) {
  return boundContextSummary(`${job.kind} ${job.label} ${statusLine(publicJob(job))}`);
}
function fitCompletionNotice(job) {
  const prefix = `background job ${job.id}`;
  const detail = ` (${job.kind}: ${job.label}) finished ${statusLine(publicJob(job))}`;
  const action = "\nDone; job_output.";
  const complete = `${prefix}${detail}. Read its output with job_output.`;
  const maxBytes = job.outputLimitBytes;
  if (maxBytes === void 0 || encoder.encode(complete).byteLength <= maxBytes) return complete;
  const omitted = "\n[notice truncated]";
  const fixed = `${prefix}${omitted}${action}`;
  const fixedBytes = encoder.encode(fixed).byteLength;
  if (fixedBytes <= maxBytes) return fixedBytes === maxBytes ? fixed : `${prefix}${retainHead(detail, maxBytes - fixedBytes)}${omitted}${action}`;
  const compact = `${prefix}${action}`;
  if (encoder.encode(compact).byteLength <= maxBytes) return compact;
  const actionBytes = encoder.encode(action).byteLength;
  if (actionBytes >= maxBytes) return retainTail(action, maxBytes);
  return `${retainHead(prefix, maxBytes - actionBytes)}${action}`;
}
function rawSingleText(content) {
  if (content.length !== 1) return void 0;
  const block = content[0];
  if (block?.type !== "text") return void 0;
  return block.text;
}
function boundSingleText(content, maxBytes) {
  const text = rawSingleText(content);
  if (text === void 0) return void 0;
  return [{
    type: "text",
    text: fitWithSuffix(text, "", maxBytes, "\n[result truncated]")
  }];
}
function visibleOutputLimit(ctx, exec) {
  if (exec.name !== "job_output" && exec.name !== "job_kill") return void 0;
  const jobId = exec.arguments?.job_id;
  if (typeof jobId !== "string" || jobId.length === 0) return void 0;
  return ctx.jobs.list(exec.agent?.id).find((job) => job.id === jobId)?.outputLimitBytes;
}
function validateJobId(value) {
  if (value.length === 0) throw new Error(`invalid job_id: expected a non-empty string, got ${JSON.stringify(value)}`);
  return JobId(value);
}
function presentJobCall(title, kind, rawInput) {
  return {
    card: "generic",
    title,
    kind,
    ...rawInput !== void 0 ? { rawInput } : {}
  };
}
function readBody(read) {
  const delta = renderModelDelta(read.chunks, read.lossy, read.job.output.spillPaths ?? []);
  return {
    text: read.result === void 0 ? delta : `${delta}${delta.length > 0 && !delta.endsWith("\n") ? "\n" : ""}${read.result}`,
    job: publicJob(read.job)
  };
}
function apply(ctx, config) {
  const waitDefault = config.waitTimeoutMs ?? 3e4;
  const waitCap = config.maxWaitTimeoutMs ?? 6e5;
  const delivery = config.completionDelivery ?? "wakeup";
  const wakeBudget = config.maxConsecutiveWakes;
  const spentWakes = /* @__PURE__ */ new WeakMap();
  if (waitDefault > waitCap) throw new Error(`tool-jobs: waitTimeoutMs (${waitDefault}) exceeds maxWaitTimeoutMs (${waitCap})`);
  if (wakeBudget !== void 0 && !Number.isSafeInteger(wakeBudget)) throw new Error(`tool-jobs: maxConsecutiveWakes (${wakeBudget}) must be a whole number of turns`);
  if (delivery === "wakeup" && wakeBudget !== void 0) ctx.on("agent/inbox/claimed", ({ agent, message }) => {
    if (message.source.kind === "user") spentWakes.delete(agent);
  });
  const outputLimits = /* @__PURE__ */ new WeakMap();
  ctx.on("tools/pre-execute", (exec, next) => {
    const maxBytes = visibleOutputLimit(ctx, exec);
    if (maxBytes !== void 0) outputLimits.set(exec, maxBytes);
    return next();
  }, { prepend: true });
  const finalizeJobContent = (exec, result) => {
    const maxBytes = outputLimits.get(exec) ?? visibleOutputLimit(ctx, exec);
    outputLimits.delete(exec);
    if (maxBytes === void 0) return void 0;
    if (exec.name === "job_output" && !result.isError) {
      const value = result.value;
      const body = value.text.length > 0 ? value.text : "(no new output)";
      const content = body.endsWith("\n") ? body.slice(0, -1) : body;
      const suffix = `
${statusLine(value.job)}`;
      if (rawSingleText(result.content) === `${content}${suffix}`) return [{
        type: "text",
        text: fitWithSuffix(content, suffix, maxBytes, "\n[output truncated]")
      }];
    }
    return boundSingleText(result.content, maxBytes);
  };
  ctx.jobs.attachController("tool-jobs");
  ctx.systemPrompt.section({
    name: "tool:jobs",
    order: ctx.systemPrompt.getSectionOrder("TOOL_JOBS"),
    text: "Track every background job id you start. You are notified in-session when a job finishes \u2014 do not busy-poll or sleep on one; keep working on independent steps and do not duplicate a running job's work. Before giving a final answer, collect every still-relevant job with job_output (set wait: true only when you are genuinely blocked on it), and job_kill jobs that stopped mattering."
  });
  const killedByModel = /* @__PURE__ */ new Set();
  ctx.jobs.events.subscribe({ owners: "scope" }, (event) => {
    if (event.type === "removed") {
      killedByModel.delete(event.job.id);
      return;
    }
    if (event.type !== "settled") return;
    if (killedByModel.delete(event.job.id) || event.awaited || event.cause === "teardown" || event.job.owner === void 0) return;
    const owner = ctx.get("agents")?.get(event.job.owner);
    if (owner === void 0) return;
    const message = createUserMessage({
      content: [{
        type: "text",
        text: fitCompletionNotice(event.job)
      }],
      source: {
        kind: "tool-jobs",
        form: "notice",
        summary: completionSummary(event.job)
      }
    });
    if (delivery === "wakeup" && owner.status === "idle") {
      if (wakeBudget === void 0) {
        owner.followup(message);
        return;
      }
      const spent = spentWakes.get(owner) ?? 0;
      if (spent < wakeBudget) {
        spentWakes.set(owner, spent + 1);
        owner.followup(message);
        return;
      }
    }
    owner.inject(message);
  });
  ctx.tools.register(defineTool({
    name: "job_output",
    description: "Read a background job: output since the previous read for stream jobs, or the result of a finished final-output job.",
    parameters: {
      job_id: {
        type: "string",
        required: true,
        description: "Job id returned by the tool that started the background work."
      },
      wait: {
        type: "boolean",
        description: "Block until the job finishes or the timeout expires; a timed-out wait leaves the job running. Defaults to false."
      },
      timeout_ms: {
        type: "number",
        description: "Max wait in milliseconds with wait: true. Defaults to and is capped by configuration."
      }
    },
    finalizeContent: finalizeJobContent,
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: {
            type: "string",
            required: true
          },
          job: {
            ...PUBLIC_JOB_SCHEMA,
            required: true
          }
        }
      },
      render: (_args, value) => {
        const body = value.text.length > 0 ? value.text : "(no new output)";
        return [{
          type: "text",
          text: `${body}${body.endsWith("\n") ? "" : "\n"}${statusLine(value.job)}`
        }];
      }
    },
    async execute(args, exec) {
      const id = validateJobId(args.job_id);
      const jobs = ctx.jobs;
      if (args.wait === true) await jobs.wait(id, Math.min(args.timeout_ms ?? waitDefault, waitCap), exec.agent?.id, exec.signal);
      return readBody(jobs.read(id, exec.agent?.id));
    },
    presentCall: (args) => presentJobCall(`Read output from background job ${args.job_id}`, "read", args.job_id)
  }));
  ctx.tools.register(defineTool({
    name: "job_list",
    description: "List your background jobs (running and finished) with their ids, kinds, and statuses.",
    parameters: {},
    output: {
      schema: {
        type: "array",
        items: PUBLIC_JOB_SCHEMA
      },
      render: (_args, jobs) => [{
        type: "text",
        text: jobs.length === 0 ? "(no background jobs)" : jobs.map((t) => `${t.id} [${t.kind}] ${t.status} \u2014 ${t.label}`).join("\n")
      }]
    },
    execute(_args, exec) {
      const jobs = ctx.jobs.list(exec.agent?.id);
      return Promise.resolve(jobs.map(publicJob));
    },
    presentCall: () => presentJobCall("List background jobs", "read")
  }));
  ctx.tools.register(defineTool({
    name: "job_kill",
    description: "Request cancellation of a running background job.",
    parameters: {
      job_id: {
        type: "string",
        required: true,
        description: "Job id returned by the tool that started the background work."
      },
      reason: {
        type: "string",
        description: "Optional short reason, recorded in the log and forwarded to the job."
      }
    },
    finalizeContent: finalizeJobContent,
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          outcome: {
            type: "string",
            required: true,
            enum: ["cancellation-requested", "already-finished"]
          },
          job: {
            ...PUBLIC_JOB_SCHEMA,
            required: true
          }
        }
      },
      render: (_args, value) => [{
        type: "text",
        text: value.outcome === "already-finished" ? `job ${value.job.id} had already finished ${statusLine(value.job)}` : `requested cancellation of job ${value.job.id}`
      }]
    },
    execute(args, exec) {
      const id = validateJobId(args.job_id);
      const jobs = ctx.jobs;
      const result = jobs.kill(id, exec.agent?.id, args.reason);
      if (result === "requested") killedByModel.add(id);
      const job = publicJob(jobs.get(id, exec.agent?.id));
      return Promise.resolve({
        outcome: result === "already-finished" ? "already-finished" : "cancellation-requested",
        job
      });
    },
    presentCall: (args) => presentJobCall(`Kill background job ${args.job_id}`, "execute", args.job_id)
  }));
}
export {
  Config,
  apply,
  inject,
  name
};
