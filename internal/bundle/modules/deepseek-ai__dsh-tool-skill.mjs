// .harness/packages/skill/tool-skill/lib/index.js
import { createHash } from "node:crypto";
import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import "@deepseek-ai/cordis";
import { escapeText, isModelInvocable, isSkillName, isUserInvocable, renderSkillContent } from "@deepseek-ai/dsh-skill";
function brandNumber(value) {
  return value;
}
function SessionSeq(value) {
  if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) throw new TypeError(`SessionSeq must be a non-negative safe integer, got ${String(value)}`);
  return brandNumber(value);
}
var name = "tool-skill";
var inject = [
  "agents",
  "tools",
  "skills"
];
var DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH = 500;
function catalogSourceEntries(skills, descriptionMaxLength) {
  return skills.map((skill) => ({
    name: skill.name,
    description: catalogDescription(skill.description, descriptionMaxLength)
  }));
}
var Config = z.object({ catalogDescriptionMaxLength: z.number().default(DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH) });
function apply(ctx, config = {}) {
  const catalogDescriptionMaxLength = config.catalogDescriptionMaxLength ?? DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH;
  assertPositiveInteger("catalogDescriptionMaxLength", catalogDescriptionMaxLength, 3);
  const skillTool = defineTool({
    name: "skill",
    description: "Load the full instructions for an available skill. Call this with the exact skill name from the session skill catalog before acting on a task that names or clearly matches that skill.",
    parameters: { name: {
      type: "string",
      required: true,
      description: "The exact skill name from the available skills list."
    } },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            required: true
          },
          provider: {
            type: "string",
            required: true
          },
          resourceBase: { oneOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                kind: {
                  type: "string",
                  required: true,
                  const: "directory"
                },
                path: {
                  type: "string",
                  required: true
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                kind: {
                  type: "string",
                  required: true,
                  const: "url"
                },
                url: {
                  type: "string",
                  required: true
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                kind: {
                  type: "string",
                  required: true,
                  const: "opaque"
                },
                description: {
                  type: "string",
                  required: true
                }
              }
            }
          ] },
          content: {
            type: "string",
            required: true
          }
        }
      },
      render: (_args, value) => [{
        type: "text",
        text: renderSkillContent(value)
      }]
    },
    async execute(args, exec) {
      if (!isSkillName(args.name)) throw new Error(`invalid skill name "${args.name}"`);
      const lookup = {
        cwd: exec.agent?.session.header.cwd,
        signal: exec.signal,
        scope: exec.agent
      };
      const summary = (await ctx.skills.list(lookup)).find((skill2) => skill2.name === args.name);
      if (!summary) throw new Error(`skill "${args.name}" is unknown or no longer available`);
      if (!isModelInvocable(summary)) throw new Error(`skill "${args.name}" is not available for model invocation`);
      const skill = await ctx.skills.get(args.name, lookup);
      if (!skill) throw new Error(`skill "${args.name}" is unknown or no longer available`);
      if (!isModelInvocable(skill)) throw new Error(`skill "${args.name}" is not available for model invocation`);
      return {
        name: skill.name,
        provider: skill.provider,
        ...skill.resourceBase !== void 0 ? { resourceBase: { ...skill.resourceBase } } : {},
        content: skill.content
      };
    },
    presentCall(args) {
      return {
        card: "generic",
        title: `Load skill ${args.name}`,
        kind: "read",
        rawInput: args.name
      };
    }
  });
  ctx.tools.register(skillTool);
  ctx.on("agent/pre-step", async ({ agent, messages, signal }, next) => {
    const decision = await next();
    if (decision.kind === "reject") return decision;
    const names = invokedSkillNames(messages);
    if (names.length === 0) return decision;
    signal.throwIfAborted();
    const lookup = {
      cwd: agent.session.header.cwd,
      signal,
      scope: agent
    };
    const injections = [];
    for (const name2 of names) {
      const skill = await ctx.skills.get(name2, lookup);
      signal.throwIfAborted();
      if (skill === void 0 || !isUserInvocable(skill)) continue;
      const source = {
        kind: "skill-invocation",
        name: name2,
        form: "instructions"
      };
      injections.push(createUserMessage({
        content: [{
          type: "text",
          text: renderSkillContent(skill)
        }],
        source
      }));
    }
    if (injections.length === 0) return decision;
    return {
      ...decision,
      messages: [...decision.messages, ...injections]
    };
  });
  ctx.on("agent/pre-step", async ({ agent, signal }, next) => {
    const decision = await next();
    if (decision.kind === "reject") return decision;
    signal.throwIfAborted();
    const snapshot = ctx.tools.get(skillTool.name, agent) === skillTool ? await ctx.skills.snapshot({
      cwd: agent.session.header.cwd,
      signal,
      scope: agent
    }) : {
      skills: [],
      complete: true
    };
    signal.throwIfAborted();
    if (!snapshot.complete) return decision;
    const skills = snapshot.skills.filter(isModelInvocable);
    const entries = catalogSourceEntries(skills, catalogDescriptionMaxLength);
    const digest = digestCatalogEntries(entries);
    const history = catalogHistory(agent);
    const existing = catalogMessage(decision.messages);
    if (history.visibleDigest === digest) return existing === void 0 ? decision : {
      ...decision,
      messages: decision.messages.filter((message) => message.id !== existing.message.id)
    };
    if (existing !== void 0 && digestCatalogEntries(existing.entries) === digest) return decision;
    if (!history.published && skills.length === 0) return existing === void 0 ? decision : {
      ...decision,
      messages: decision.messages.filter((message) => message.id !== existing.message.id)
    };
    const catalog = history.published ? renderCatalogUpdate(entries) : renderCatalogMessage(entries);
    return {
      ...decision,
      messages: existing === void 0 ? [...decision.messages, catalog] : decision.messages.map((message) => message.id === existing.message.id ? catalog : message)
    };
  });
}
function renderCatalogMessage(entries) {
  return createUserMessage({
    content: [{
      type: "text",
      text: [
        "<system-reminder>",
        "A skill is a reusable set of task-specific instructions. The following skills are available in this session:",
        "",
        "<available_skills>",
        ...renderCatalogEntries(entries),
        "</available_skills>",
        "",
        "If the user names a skill, or the task clearly matches a skill's description, call the `skill` tool with the exact skill name before taking task actions. Load all applicable skills, then follow their full instructions. This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.",
        "A user may also invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool again for that skill.",
        "</system-reminder>"
      ].join("\n")
    }],
    source: {
      kind: "skill-catalog",
      form: "catalog",
      entries
    }
  });
}
function renderCatalogUpdate(entries) {
  const availability = entries.length === 0 ? ["No skills are currently available through the `skill` tool. Do not use names from earlier skill catalogs.", "A user may still invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool for it."] : ["Use only names in this replacement catalog. If the user names a listed skill, or the task clearly matches its description, call the `skill` tool with the exact name before acting.", "A user may also invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool again for that skill."];
  return createUserMessage({
    content: [{
      type: "text",
      text: [
        "<system-reminder>",
        "The available skill catalog changed. This complete catalog replaces every earlier available-skills list in this session:",
        "",
        "<available_skills>",
        ...renderCatalogEntries(entries),
        "</available_skills>",
        "",
        ...availability,
        "</system-reminder>"
      ].join("\n")
    }],
    source: {
      kind: "skill-catalog",
      form: "catalog",
      update: true,
      entries
    }
  });
}
function renderCatalogEntries(entries) {
  return entries.map((entry) => `- \`${entry.name}\`: ${escapeText(entry.description)}`);
}
function digestCatalogEntries(entries) {
  const canonical = entries.map((entry) => JSON.stringify([entry.name, entry.description])).join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}
function readCatalogEntries(source) {
  const entries = source.entries;
  if (!Array.isArray(entries)) return void 0;
  const readable = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) return void 0;
    const { name: name2, description } = entry;
    if (typeof name2 !== "string" || name2 === "" || typeof description !== "string") return void 0;
    readable.push({
      name: name2,
      description
    });
  }
  return readable;
}
function catalogHistory(agent) {
  const visible = new Set(agent.session.surface.nodes);
  let published = false;
  for (let index = agent.session.seq - 1; index >= 0; index -= 1) {
    const event = agent.session.eventAt(SessionSeq(index));
    if (event === void 0) throw new Error(`skill catalog cannot read seq ${String(index)} below the current Session length`);
    if (event.type !== "user/message" || event.data.source.kind !== "skill-catalog") continue;
    const entries = readCatalogEntries(event.data.source);
    if (entries === void 0) continue;
    const digest = digestCatalogEntries(entries);
    published = true;
    if (visible.has(event.seq)) return {
      visibleDigest: digest,
      published
    };
  }
  return { published };
}
function catalogMessage(messages) {
  for (const message of messages) {
    if (message.source.kind !== "skill-catalog") continue;
    const entries = readCatalogEntries(message.source);
    if (entries !== void 0) return {
      message,
      entries
    };
  }
}
function catalogDescription(value, maxLength) {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}
function assertPositiveInteger(name2, value, minimum = 1) {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`tool-skill: ${name2} must be an integer greater than or equal to ${minimum}`);
}
var SKILL_GESTURE = /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g;
function invokedSkillNames(messages) {
  const names = [];
  for (const message of messages) {
    if (message.source.kind !== "user") continue;
    for (const block of message.content) {
      if (block.type !== "text") continue;
      for (const match of block.text.matchAll(SKILL_GESTURE)) {
        const name2 = match[2];
        if (name2 !== void 0 && !names.includes(name2)) names.push(name2);
      }
    }
  }
  return names;
}
export {
  Config,
  apply,
  inject,
  name
};
