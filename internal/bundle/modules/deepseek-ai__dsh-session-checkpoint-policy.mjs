// .harness/packages/session/session-checkpoint-policy/lib/index.js
import { TOOL_ABORTED_BEFORE_DISPATCH } from "@deepseek-ai/dsh-tools";
var name = "session-checkpoint-policy";
var inject = [
  "llm",
  "sessionPersistence",
  "sessions",
  "tools"
];
function afterCheckpoint(ctx, session, next) {
  return (async function* () {
    await ctx.sessions.flush(session);
    yield* next();
  })();
}
function abortedBeforeDispatchResult() {
  return {
    content: [{
      type: "text",
      text: "Error: tool call aborted before dispatch"
    }],
    isError: true,
    error: {
      message: "tool call aborted before dispatch",
      info: {
        name: "AbortError",
        code: TOOL_ABORTED_BEFORE_DISPATCH
      }
    }
  };
}
function apply(ctx) {
  ctx.on("llm/stream", (options, next) => {
    if (options.sessionId === void 0) return next();
    const session = ctx.sessions.get(options.sessionId);
    return session === void 0 ? next() : afterCheckpoint(ctx, session, next);
  });
  ctx.on("tools/execute", async (exec, next) => {
    if (exec.agent === void 0 || exec.parent !== void 0) return next();
    await ctx.sessions.flush(exec.agent.session);
    if (exec.signal.aborted) return abortedBeforeDispatchResult();
    return next();
  });
  ctx.on("agent/pre-step", async ({ agent }, next) => {
    await ctx.sessions.flush(agent.session);
    return next();
  });
}
export {
  apply,
  inject,
  name
};
