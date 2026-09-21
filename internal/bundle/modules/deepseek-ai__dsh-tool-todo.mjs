// .harness/packages/todo/tool-todo/lib/index.js
import z from "@deepseek-ai/schemastery";
import { z as z$1 } from "zod";
import { defineTool } from "@deepseek-ai/dsh-tools";
var name = "tool-todo";
var inject = ["tools", "sessionProjections"];
var STATUSES = [
  "pending",
  "in_progress",
  "completed"
];
var Config = z.object({ allowParallelInProgress: z.boolean().required() });
var DESCRIPTION_HEAD = "Record and update a structured task list for the current work. Send the ENTIRE list every call \u2014 it REPLACES the previous list (there are no partial updates, no per-item edits). Use it to plan multi-step work and show progress: add one todo per concrete step before you start. ";
var DESCRIPTION_PARALLEL = "Mark every todo being actively worked on `in_progress` \u2014 several at once when work genuinely runs in parallel (e.g. concurrent subagents or background commands), one for sequential work; while work remains, at least one task should be `in_progress`. ";
var DESCRIPTION_SINGLE = "Keep AT MOST ONE todo `in_progress` at a time; while work remains, exactly one active task should be `in_progress`. ";
var DESCRIPTION_TAIL = "Mark a todo `completed` the moment it is done (do not batch completions), and allow no `in_progress` item only once all work is complete. Skip the list for trivial single-step tasks. Statuses: `pending` (not started), `in_progress` (being worked on now), `completed` (finished).";
function describe(allowParallel) {
  return DESCRIPTION_HEAD + (allowParallel ? DESCRIPTION_PARALLEL : DESCRIPTION_SINGLE) + DESCRIPTION_TAIL;
}
function toTodoList(raw, allowParallel) {
  const todos = [];
  const seen = /* @__PURE__ */ new Set();
  let active = 0;
  for (const item of raw) {
    const content = item.content.trim();
    if (content.length === 0) throw new Error("invalid todo: `content` must be a non-empty string");
    if (seen.has(content)) throw new Error(`invalid todos: duplicate content ${JSON.stringify(content)}`);
    seen.add(content);
    if (item.status === "in_progress") active++;
    todos.push({
      content,
      status: item.status
    });
  }
  if (!allowParallel && active > 1) throw new Error(`invalid todos: at most one task may be in_progress (got ${active})`);
  return todos;
}
var todosProjectionSchema = z$1.union([z$1.array(z$1.object({
  content: z$1.string(),
  status: z$1.union([
    z$1.literal("pending"),
    z$1.literal("in_progress"),
    z$1.literal("completed")
  ])
})), z$1.null()]);
function apply(ctx, config) {
  const allowParallel = config.allowParallelInProgress;
  ctx.sessionProjections.register({
    key: "todos",
    stateSchema: todosProjectionSchema,
    init: () => null,
    apply: (state, event) => {
      if (event.type === "todo/write") return event.data.todos;
      if (event.type === "turn/start") return null;
      return state;
    },
    wire: {
      viewSchema: todosProjectionSchema,
      view: (state) => state
    },
    stateVersion: 2
  });
  ctx.tools.register(defineTool({
    name: "todo_write",
    description: describe(allowParallel),
    parameters: { todos: {
      type: "array",
      required: true,
      description: "The COMPLETE task list, replacing any previous list.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          content: {
            type: "string",
            required: true,
            description: "What the task is \u2014 a short imperative line."
          },
          status: {
            type: "string",
            required: true,
            enum: [...STATUSES],
            description: "pending (not started) | in_progress (now) | completed (done)."
          }
        }
      }
    } },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          todos: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                content: {
                  type: "string",
                  required: true
                },
                status: {
                  type: "string",
                  required: true,
                  enum: [...STATUSES]
                }
              }
            }
          },
          counts: {
            type: "object",
            additionalProperties: false,
            required: true,
            properties: {
              pending: {
                type: "integer",
                required: true
              },
              inProgress: {
                type: "integer",
                required: true
              },
              completed: {
                type: "integer",
                required: true
              }
            }
          }
        }
      },
      render: (_args, value) => [{
        type: "text",
        text: `Updated todo list: ${value.counts.pending} pending, ${value.counts.inProgress} in progress, ${value.counts.completed} completed.`
      }]
    },
    execute(args, exec) {
      const todos = toTodoList(args.todos, allowParallel);
      if (!exec.agent) throw new Error("todo_write requires an owning agent session");
      exec.agent.session.append("todo/write", { todos });
      const count = (status) => todos.filter((t) => t.status === status).length;
      return Promise.resolve({
        todos: todos.map((todo) => ({
          content: todo.content,
          status: todo.status
        })),
        counts: {
          pending: count("pending"),
          inProgress: count("in_progress"),
          completed: count("completed")
        }
      });
    },
    presentCall: (args) => ({
      card: "generic",
      title: "Update todo list",
      kind: "other",
      rawInput: args.todos
    })
  }));
}
export {
  Config,
  apply,
  inject,
  name
};
