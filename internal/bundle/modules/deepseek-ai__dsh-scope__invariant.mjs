// .harness/packages/core/scope/lib/invariant.js
import { carrierKeyOf, isScopeCarrier } from "@deepseek-ai/dsh-scope";
var scopedSubjectResolvers = Object.freeze({
  "agent/assistant-stream": (args) => args[0]["agent"],
  "agent/created": (args) => args[0]["agent"],
  "agent/disposed": (args) => args[0]["agent"],
  "agent/error": (args) => args[0]["agent"],
  "agent/inbox/claimed": (args) => args[0]["agent"],
  "agent/inbox/discarded": (args) => args[0]["agent"],
  "agent/inbox/inserted": (args) => args[0]["agent"],
  "agent/pre-step": (args) => args[0]["agent"],
  "agent/request": (args) => args[0]["agent"],
  "agent/request-error": (args) => args[0]["agent"],
  "agent/status": (args) => args[0]["agent"],
  "agent/turn-stopping": (args) => args[0]["agent"],
  "approval/request": (args) => args[0]["agent"],
  "goal/changed": (args) => args[0]["agent"],
  "session/created": null,
  "session/disposed": null,
  "session/event": null,
  "session/flush": null,
  "subagent/end": null,
  "subagent/start": null,
  "system-prompt/assemble": (args) => args[1]["scope"],
  "tools/execute": (args) => args[0]["agent"],
  "tools/post-execute": (args) => args[0]["agent"],
  "tools/pre-execute": (args) => args[0]["agent"],
  "tools/ptc-dispatch-log": (args) => args[0]["agent"],
  "tools/result": (args) => args[0]["agent"],
  "user-questions/request": (args) => args[0]["agent"]
});
function scopedSubjectResolverFor(event) {
  return scopedSubjectResolvers[event];
}
var PACKAGE_NAME = "@deepseek-ai/dsh-scope";
var name = "scope-invariant";
var inject = ["invariants"];
var install = (ctx, fail) => {
  ctx.on("internal/dispatch", (_mode, eventName, args, thisArg) => {
    const subjectOf = scopedSubjectResolverFor(eventName);
    if (subjectOf === void 0) return;
    if (!isScopeCarrier(thisArg)) fail(`"${eventName}" is a scope-filtered event but was dispatched without a scope carrier \u2014 pass scopeTarget(base, subject) as the dispatch thisArg (agent events: use agentEvents(ctx, agent))`);
    if (subjectOf !== null && carrierKeyOf(thisArg) !== subjectOf(args)) fail(`"${eventName}" was dispatched with a scope carrier keyed to a DIFFERENT subject than its arguments name \u2014 the carrier key and the event's subject must be the same object (use agentEvents(ctx, agent))`);
  }, { global: true });
};
var apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
export {
  apply,
  inject,
  name
};
