// .harness/packages/llm/llm-deepseek-api-key/lib/index.js
import { LlmError, assertUsableApiKey } from "@deepseek-ai/dsh-llm";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { catalogModelInfo, deepSeekConfigFields, plainOptions as plainOptions$1, registerDeepSeekProvider, resolveAdapterOptions as resolveAdapterOptions$1 } from "@deepseek-ai/dsh-llm-deepseek";
import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
var Config = z.object({
  ...deepSeekConfigFields,
  apiKeyEnv: z.string().role("credential-ref").default("DEEPSEEK_API_KEY").volatile()
});
function plainOptions(config) {
  return {
    ...plainOptions$1(config),
    apiKeyEnv: config.apiKeyEnv.get()
  };
}
function resolveAdapterOptions(config, environment) {
  return {
    ...resolveAdapterOptions$1(config, environment),
    apiKeyEnv: credentialRef(config.apiKeyEnv ?? "DEEPSEEK_API_KEY")
  };
}
var name = "llm-deepseek-api-key";
var inject = ["llm"];
var PROVIDER = "deepseek-official";
function apply(ctx, config) {
  const options = () => resolveAdapterOptions(plainOptions(config), launchEnvironmentOf(ctx));
  options();
  const resolveApiKey = async (connection) => {
    const ref = connection.apiKeyEnv;
    const credentials = ctx.get("credentials");
    if (credentials !== void 0) {
      const hit = await credentials.resolve(ref);
      if (hit !== void 0) return assertUsableApiKey(hit.value, "llm-deepseek", ref);
    } else {
      const ambient = launchEnvironmentOf(ctx).get(ref);
      if (ambient !== void 0 && ambient.value.length > 0) return assertUsableApiKey(ambient.value, "llm-deepseek", ref);
    }
    throw new LlmError(`llm-deepseek: no API key for provider route "${PROVIDER}"; store ${ref} through the credentials service (the web Models page writes it), or export ${ref} in the launching environment`, "MISSING_CREDENTIAL");
  };
  ctx.llm.registerConfigurableProviders([{
    provider: PROVIDER,
    displayName: "DeepSeek",
    settingsNs: ctx.fiber.entry?.options.id ?? "llm-deepseek-api-key",
    settingsPath: []
  }]);
  registerDeepSeekProvider(ctx, PROVIDER, {
    options,
    providerName: "DeepSeek",
    resolveAuth: async (connection) => ({ headers: { "x-api-key": await resolveApiKey(connection) } }),
    discoverModels: (provider) => {
      const connection = options();
      return Promise.resolve(connection.models.map((model) => catalogModelInfo(provider, model)));
    }
  });
}
export {
  Config,
  apply,
  inject,
  name,
  plainOptions,
  resolveAdapterOptions
};
