# 01 · hello — one turn

`sdk.Open` → `h.Run` → the final response, the finish reason, the duration.
The smallest possible proof that **an agent runs inside your process**: no
service to start, no runtime to install, no subprocess. The DeepSeek Harness
is compiled into the binary, on a pure-Go JavaScript engine, so this
cross-compiles like any other Go program.

It prints `sdk.HarnessVersion()` first, so you can see which upstream
revision is in the binary you just built.

## Run it

```sh
export DEEPSEEK_API_KEY=...                             # read by the SDK itself
export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1   # optional; unset = DeepSeek
export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731   # optional; unset = deepseek-v4-flash
go run ./examples/01-hello
```

## What to look for

- The version banner: the harness is *in* the binary, not beside it.
- With no `CWD` set, the agent works in the process's working directory and
  its session log lands in `./.sessions` there. Example 03 sets that fence
  deliberately.

Part of [the examples tour](../README.md).
