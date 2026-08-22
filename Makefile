# Regenerating the embedded harness.
#
# The bundle under internal/bundle/ is a generated artifact, committed like any
# other generated file: using it needs nothing but this repository, and building
# it needs a machine with node, pnpm and git. That asymmetry is the point — the
# tools are a maintainer's problem, not a deployment's.
#
#   make update     fetch upstream, rebuild it, regenerate the bundle, run tests
#   make sync       fetch upstream into .harness/ at HARNESS_REF
#   make build      build the harness's libraries in .harness/
#   make bundle     regenerate internal/bundle/ from .harness/
#   make verify     go test ./... (every bundled module must still evaluate)
#   make upstream-check  how far upstream has moved since UPSTREAM.lock.json
#   make show       what the committed bundle was built from
#
# Point it at a checkout you already have instead of cloning:
#   make bundle HARNESS_DIR=../deepseek-harness
#
# Move to a different upstream revision:
#   make update HARNESS_REF=v0.1.0-rc.8

HARNESS_REPO ?= https://github.com/deepseek-ai/deepseek-harness.git
# The revision to build. Pinned by default, because dsh is a developer preview
# that says breaking changes will happen and its session format is still version
# zero — "latest" is a decision to take deliberately, not one to inherit from
# whenever the last build happened to run.
HARNESS_REF  ?= dsh-v0.1.1-rc.2
HARNESS_DIR  ?= .harness
# Where the generated bundle lands. This must stay pointed at the directory
# that bundle.go actually embeds. It read `bundle` until 0.3.0, which is where
# the embedded copy lived before 528db2f moved it under internal/ — and every
# consequence of the stale default was silent: `make bundle` filled a fresh
# untracked ./bundle/, `make verify` passed because it was still testing the
# old embedded copy, `git diff --stat $(OUT)` showed nothing, and `make show`
# read a manifest that was not the shipped one.
OUT          ?= internal/bundle

# Node's default heap is generous enough to hide a runaway from you until the
# machine is swapping. Bundling 60 packages needs nothing like this much.
NODE_HEAP_MB ?= 3072

NODE  ?= node
PNPM  ?= pnpm
GIT   ?= git

.PHONY: update sync build bundle verify fmtcheck crosscheck upstream-check upstream-drift-report show clean-harness help

help:
	@sed -n '1,30p' $(MAKEFILE_LIST) | sed 's/^# \{0,1\}//'

update: sync build bundle verify
	@echo
	@echo "Bundle regenerated. Review the diff before committing:"
	@echo "  git diff --stat $(OUT)"

# sync fetches upstream at HARNESS_REF. A tag, a branch or a commit all work;
# the checkout is detached, because this directory is a build input rather than
# somewhere to develop.
sync:
	@command -v $(GIT) >/dev/null || { echo "make sync needs git"; exit 1; }
	@if [ -d "$(HARNESS_DIR)/.git" ]; then \
		echo "==> fetching $(HARNESS_REPO)"; \
		$(GIT) -C "$(HARNESS_DIR)" fetch --tags --force origin; \
	else \
		echo "==> cloning $(HARNESS_REPO) into $(HARNESS_DIR)"; \
		$(GIT) clone --filter=blob:none "$(HARNESS_REPO)" "$(HARNESS_DIR)"; \
	fi
	@echo "==> checking out $(HARNESS_REF)"
	@$(GIT) -C "$(HARNESS_DIR)" -c advice.detachedHead=false checkout --force "$(HARNESS_REF)" \
		|| $(GIT) -C "$(HARNESS_DIR)" -c advice.detachedHead=false checkout --force "origin/$(HARNESS_REF)"
	@$(GIT) -C "$(HARNESS_DIR)" --no-pager log -1 --format='    %h %d %s'

# build produces each package's lib/*.js, which is what the bundler reads. Only
# the host face: the web frontend is a separate build and nothing here loads it.
build:
	@command -v $(PNPM) >/dev/null || { echo "make build needs pnpm (https://pnpm.io)"; exit 1; }
	@command -v $(NODE) >/dev/null || { echo "make build needs node"; exit 1; }
	@echo "==> pnpm install"
	@cd "$(HARNESS_DIR)" && $(PNPM) install --frozen-lockfile
	@echo "==> pnpm run build:lib:host"
	@cd "$(HARNESS_DIR)" && $(PNPM) run build:lib:host

bundle:
	@command -v $(NODE) >/dev/null || { echo "make bundle needs node"; exit 1; }
	@test -d "$(HARNESS_DIR)/packages" || { \
		echo "no harness checkout at $(HARNESS_DIR) — run 'make sync' or pass HARNESS_DIR=<path>"; exit 1; }
	@echo "==> generating $(OUT)/ from $(HARNESS_DIR)"
	$(NODE) --max-old-space-size=$(NODE_HEAP_MB) tools/bundle/build.mjs \
		--harness "$(HARNESS_DIR)" --out "$(OUT)"

# The test that matters after a regeneration: every bundled module must still
# evaluate on the engine. A new upstream revision reaching for a Node API this
# runtime does not have fails here, naming the module, rather than later during
# a plugin mount.
verify: fmtcheck crosscheck
	go test ./... -count=1
	@$(MAKE) --no-print-directory upstream-drift-report

# Drift is REPORTED here, not enforced.
#
# A gate you cannot satisfy is a gate people learn to skip, and drift is not
# fixable by editing this repository — somebody else committed. So `make verify`
# stays a statement about this repository's own correctness and prints the
# drift underneath it, where a maintainer who is already here will read it. The
# weekly workflow is what escalates, by opening an issue that survives being
# ignored; `make upstream-check` is the strict form, and exits non-zero.
upstream-drift-report:
	@echo
	@$(NODE) tools/upstream/check.mjs --quiet || true

# upstream-check answers one question: what has changed upstream, since the pin,
# in a path this bundle actually carries — with anything that reads like security
# work raised to the top. Exit 1 on drift, 2 if the check itself could not run.
upstream-check:
	@command -v $(NODE) >/dev/null || { echo "make upstream-check needs node"; exit 1; }
	@$(NODE) tools/upstream/check.mjs

# Every platform a Robomotion package ships to. Tests alone run on the host
# only, so a unix-only symbol -- syscall.Stat_t was the one that got through --
# compiles clean here and fails in CI on a runner nobody watches. Building each
# target is the cheapest way to find that before a release rather than after.
CROSS_TARGETS := linux/amd64 linux/arm64 windows/amd64 darwin/amd64 darwin/arm64

# gofmt is not a matter of taste here, it is a matter of noticing. An
# unformatted file makes `gofmt -l` non-empty, and a non-empty `gofmt -l` that
# is always non-empty is one nobody reads — so the next genuinely odd
# formatting, the kind that usually means a bad merge, arrives invisible.
fmtcheck:
	@unformatted=$$(gofmt -l . 2>/dev/null); \
	if [ -n "$$unformatted" ]; then \
		echo "gofmt would change:"; echo "$$unformatted" | sed 's/^/  /'; \
		echo "run: gofmt -w ."; exit 1; \
	fi
	@echo "  ok gofmt"

crosscheck:
	@for t in $(CROSS_TARGETS); do \
		GOOS=$${t%%/*} GOARCH=$${t##*/} go build ./... || { echo "CROSS-COMPILE FAILED: $$t"; exit 1; }; \
		echo "  ok $$t"; \
	done

show:
	@$(NODE) -e "const m=require('./$(OUT)/manifest.json'); \
		console.log('harness', m.harness.version, '@', m.harness.commit); \
		console.log(Object.keys(m.modules).length, 'modules,', m.entries.length, 'entry packages'); \
		const refused=Object.entries(m.modules).filter(([,v])=>v.refused); \
		for (const [name, v] of refused) console.log('refused:', name, '—', v.refused);"

clean-harness:
	rm -rf "$(HARNESS_DIR)"
