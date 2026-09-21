// .harness/packages/core/agent-loop/lib/invariant.js
import { isAgentLoopRequest } from "@deepseek-ai/dsh-llm";
import { foldRequestHeader } from "@deepseek-ai/dsh-session";
var PACKAGE_NAME = "@deepseek-ai/dsh-agent-loop";
var name = "agent-loop-invariant";
var inject = ["invariants"];
var install = Object.assign((ctx, fail) => {
  ctx.on("llm/stream", (options, next) => {
    if (!isAgentLoopRequest(options)) return next();
    if (!Object.isFrozen(options)) fail("a loop-built request must be frozen");
    if (options.sessionId === void 0) fail("a loop-built request must carry a session id");
    const session = ctx.sessions.get(options.sessionId);
    if (!session) fail(`a loop-built request must carry a live session id, got "${String(options.sessionId)}"`);
    if (!Object.isFrozen(options.messages)) fail("a loop-built request must carry a frozen messages array");
    const events = session.snapshotEvents();
    if (!events.some((event) => event.type === "step/start")) return fail("a loop-built request with no step/start in its session log");
    const header = foldRequestHeader(events);
    if (header === void 0) return fail("a loop-built request with no request/header event in its session log");
    const expected = session.deriveMessages();
    if (JSON.stringify(options.messages) !== JSON.stringify(expected)) fail(`llm request for session "${String(session.id)}" diverges from the dispatch-time durable derivation (log-reconstruction desync)`);
    if (!(options.model === header.config.model && options.system === void 0 && options.temperature === header.config.temperature && options.maxTokens === header.config.maxTokens && JSON.stringify(options.stop) === JSON.stringify(header.config.stop) && JSON.stringify(options.tools ?? []) === JSON.stringify(header.tools ?? []))) fail(`llm request for session "${String(session.id)}" diverges from the folded request header`);
    return next();
  }, {
    global: true,
    prepend: true
  });
}, { inject: ["sessions"] });
var apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
export {
  apply,
  inject,
  name
};
