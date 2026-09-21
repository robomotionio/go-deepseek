// .harness/packages/core/agent/lib/invariant.js
var PACKAGE_NAME = "@deepseek-ai/dsh-agent";
var name = "agent-invariant";
var inject = ["invariants"];
var install = (ctx, fail) => {
  const lastStatus = /* @__PURE__ */ new WeakMap();
  ctx.on("agent/status", ({ agent, status }) => {
    if (lastStatus.get(agent) === status) fail(`agent/status repeated ${status} (no-op transition)`);
    lastStatus.set(agent, status);
  }, { global: true });
};
var apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
export {
  apply,
  inject,
  name
};
