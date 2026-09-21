// .harness/packages/shell/shell-env/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { DSH_ENV_PREFIX } from "@deepseek-ai/dsh-shell";
import { DSH_HOME_ENV, resolveDshHome } from "@deepseek-ai/dsh-home-paths";
var name = "shell-env";
var inject = [];
var Config = z.object({ dshHome: z.string() });
var DSH_SHELL_KEY = `${DSH_ENV_PREFIX}SHELL`;
var DSH_SESSION_ID_KEY = `${DSH_ENV_PREFIX}SESSION_ID`;
var RESERVED_BASH_ENV_KEYS = /* @__PURE__ */ new Set([
  DSH_HOME_ENV,
  DSH_SHELL_KEY,
  DSH_SESSION_ID_KEY
]);
var BASH_ENV_KEY_SUFFIX = /^[A-Z][A-Z0-9_]*$/;
var ShellEnvRegistry = class extends Service {
  contributors = /* @__PURE__ */ new Map();
  keyOwners = /* @__PURE__ */ new Map();
  dshHome;
  /**
  * Create and install the `ctx.shellEnv` service.
  * @param ctx - Cordis context that owns the service and registrations.
  * @param config - home-directory configuration for the built-in variables.
  */
  constructor(ctx, config = {}) {
    super(ctx, "shellEnv");
    this.dshHome = resolveDshHome(config.dshHome);
  }
  /**
  * Register one environment contributor. Names and keys are unique; built-in
  * keys are reserved. Registration is disposed with the calling plugin fiber.
  * @param contributor - declared key ownership and per-execution resolver.
  * @returns the disposer that unregisters the contribution.
  */
  register(contributor) {
    const dispose = this.ctx.effect(function* () {
      if (contributor.name.trim().length === 0) throw new Error("bash env contributor name must be non-empty");
      if (this.contributors.has(contributor.name)) throw new Error(`bash env contributor "${contributor.name}" is already registered`);
      const variables = Object.entries(contributor.variables);
      for (const [key, variable] of variables) {
        if (!key.startsWith(DSH_ENV_PREFIX) || !BASH_ENV_KEY_SUFFIX.test(key.slice(DSH_ENV_PREFIX.length))) throw new Error(`bash env contributor "${contributor.name}" declared invalid key "${key}"`);
        if (RESERVED_BASH_ENV_KEYS.has(key)) throw new Error(`bash env contributor "${contributor.name}" cannot own reserved key "${key}"`);
        if (variable.description.trim().length === 0) throw new Error(`bash env contributor "${contributor.name}" must describe "${key}"`);
        const owner = this.keyOwners.get(key);
        if (owner !== void 0) throw new Error(`bash env key "${key}" is already owned by contributor "${owner}"; contributor "${contributor.name}" cannot also own it`);
      }
      this.contributors.set(contributor.name, contributor);
      for (const [key] of variables) this.keyOwners.set(key, contributor.name);
      yield () => {
        this.contributors.delete(contributor.name);
        for (const [key] of variables) this.keyOwners.delete(key);
      };
    }.bind(this), "bashEnv.register()");
    return () => void dispose();
  }
  /**
  * Build the trusted `DSH_*` snapshot for one shell tool execution.
  * @param execution - the current tool execution.
  * @returns an immutable environment overlay containing built-ins and current contributions.
  */
  collect(execution) {
    const values = {
      [DSH_HOME_ENV]: this.dshHome,
      [DSH_SHELL_KEY]: "1"
    };
    if (execution.agent !== void 0) values[DSH_SESSION_ID_KEY] = execution.agent.session.header.id;
    for (const contributor of [...this.contributors.values()].sort((left, right) => left.name.localeCompare(right.name))) {
      const resolved = contributor.resolve(execution);
      for (const [rawKey, value] of Object.entries(resolved)) {
        const key = rawKey;
        if (!Object.hasOwn(contributor.variables, key)) throw new Error(`bash env contributor "${contributor.name}" returned undeclared key "${key}"`);
        if (typeof value !== "string") throw new Error(`bash env contributor "${contributor.name}" returned a non-string value for "${key}"`);
        values[key] = value;
      }
    }
    return Object.freeze(Object.fromEntries(Object.entries(values).sort(([left], [right]) => left.localeCompare(right))));
  }
  /**
  * Enumerate plugin-contributed variables without executing their resolvers.
  * @returns declarations sorted by environment variable name.
  */
  list() {
    return [...this.contributors.values()].flatMap((contributor) => Object.entries(contributor.variables).map(([key, variable]) => ({
      contributor: contributor.name,
      description: variable.description,
      key
    }))).sort((left, right) => left.key.localeCompare(right.key));
  }
};
function apply(ctx, config = {}) {
  new ShellEnvRegistry(ctx, config);
}
export {
  Config,
  ShellEnvRegistry,
  apply,
  inject,
  name
};
