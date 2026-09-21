// .harness/packages/session/session-format/lib/index.js
import { deepFreeze, snapshotJsonValue } from "@deepseek-ai/dsh-util-values";
var SessionFormatError = class extends Error {
  name = "SessionFormatError";
};
var SessionFormatUnsupportedMigrationError = class extends SessionFormatError {
  name = "SessionFormatUnsupportedMigrationError";
};
function isSessionFormatJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function sessionFormatCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) throw new SessionFormatError(`${label} must be a non-negative safe integer`);
  return value;
}
function sessionFormatSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || Object.is(value, -0)) throw new SessionFormatError(`${label} must be a safe integer`);
  return value;
}
function sessionFormatVersion(value, label = "Session format version") {
  return sessionFormatCount(value, label);
}
function inspectSessionFormatVersion(headerValue) {
  if (!isSessionFormatJsonObject(headerValue)) throw new SessionFormatError("Session header must be a JSON object");
  return sessionFormatVersion(headerValue["version"]);
}
function snapshotSessionFormatJson(value, label = "Session value") {
  const snapshot = snapshotJsonValue(value);
  if (snapshot === void 0) throw new SessionFormatError(`${label} is not lossless JSON`);
  return deepFreeze(snapshot);
}
function snapshotSessionFormatHeader(header, label = "Session header") {
  const snapshot = snapshotSessionFormatJson(header, label);
  if (!isSessionFormatJsonObject(snapshot)) throw new SessionFormatError(`${label} must be a JSON object`);
  inspectSessionFormatVersion(snapshot);
  if (typeof snapshot["id"] !== "string") throw new SessionFormatError(`${label} id must be a string`);
  sessionFormatCount(snapshot["createdAt"], `${label} createdAt`);
  if (typeof snapshot["isSeeded"] !== "boolean") throw new SessionFormatError(`${label} isSeeded must be a boolean`);
  sessionFormatCount(snapshot["delegationDepth"], `${label} delegationDepth`);
  return snapshot;
}
function defineSessionFormatMigration(migration) {
  if (typeof migration.name !== "string" || migration.name.length === 0) throw new SessionFormatError("Session migration name must be a non-empty string");
  const from = sessionFormatVersion(migration.fromVersion, `${migration.name} fromVersion`);
  if (sessionFormatVersion(migration.toVersion, `${migration.name} toVersion`) !== from + 1) throw new SessionFormatError(`${migration.name} must declare adjacent v${from}->v${from + 1}`);
  return Object.freeze({ ...migration });
}
function createSessionFormatChain(options) {
  return new CompiledSessionFormatChain(options);
}
var CompiledSessionFormatChain = class {
  currentVersion;
  migrations;
  restoreCurrentHeader;
  constructor(options) {
    this.currentVersion = sessionFormatVersion(options.currentVersion, "current Session format version");
    this.restoreCurrentHeader = options.restoreCurrentHeader;
    const byFrom = /* @__PURE__ */ new Map();
    const names = /* @__PURE__ */ new Set();
    for (const candidate of options.migrations) {
      const migration = defineSessionFormatMigration(candidate);
      if (byFrom.has(migration.fromVersion)) throw new SessionFormatError(`Session migration v${migration.fromVersion}->v${migration.toVersion} is duplicated`);
      if (names.has(migration.name)) throw new SessionFormatError(`Session migration name ${JSON.stringify(migration.name)} is duplicated`);
      byFrom.set(migration.fromVersion, migration);
      names.add(migration.name);
    }
    const ordered = [];
    for (let version = 0; version < this.currentVersion; version += 1) {
      const migration = byFrom.get(version);
      if (migration === void 0) throw new SessionFormatUnsupportedMigrationError(`Session migration v${version}->v${version + 1} is missing`);
      ordered.push(migration);
    }
    if (byFrom.size !== ordered.length) throw new SessionFormatError(`Session migration from v${[...byFrom.keys()].find((version) => version >= this.currentVersion)} does not lead to current v${this.currentVersion}`);
    this.migrations = Object.freeze(ordered);
  }
  plan(fromVersion) {
    const from = sessionFormatVersion(fromVersion, "stored Session format version");
    if (from > this.currentVersion) throw new SessionFormatUnsupportedMigrationError(`stored Session uses newer format v${from}; this build writes v${this.currentVersion}`);
    return Object.freeze(this.migrations.slice(from));
  }
  createStream(sourceHeader, sourceCut, output) {
    let header = sourceHeader;
    const validatedSourceCut = sourceCut === void 0 ? void 0 : sessionFormatCount(sourceCut, "Session inherited event count");
    let inheritedEventCount = validatedSourceCut;
    const stages = [];
    const plan = this.plan(header.version);
    for (const [index, migration] of plan.entries()) {
      const targetHeader = this.advanceHeader(migration, header);
      let stage;
      try {
        stage = migration.createStage({
          sourceHeader: header,
          targetHeader,
          sourceInheritedEventCount: inheritedEventCount,
          sourceKind: index === 0 ? "decoded" : "transformed"
        });
      } catch (error) {
        throwUnsupportedRefusal(migration, error);
      }
      header = targetHeader;
      stages.push({
        migration,
        stage
      });
      inheritedEventCount = stage.headerInheritedEventCount;
    }
    return new CompiledSessionFormatMigrationStream(header, validatedSourceCut, stages, output);
  }
  migrateHeader(source) {
    let current = snapshotSessionFormatHeader(source, "stored Session header");
    for (const migration of this.plan(current.version)) current = this.advanceHeader(migration, current);
    current = snapshotSessionFormatHeader(this.restoreCurrentHeader(current), "current Session header restoration");
    if (current.version !== this.currentVersion) throw new SessionFormatError(`current Session header restorer returned v${current.version}; expected v${this.currentVersion}`);
    return current;
  }
  advanceHeader(migration, source) {
    let target;
    try {
      target = migration.migrateHeader(snapshotSessionFormatHeader(source, `${migration.name} header input`));
    } catch (error) {
      throwUnsupportedRefusal(migration, error, "Session header");
    }
    const current = snapshotSessionFormatHeader(target, `${migration.name} header output`);
    if (current.version !== migration.toVersion) throw new SessionFormatError(`${migration.name} header returned v${current.version}; expected v${migration.toVersion}`);
    try {
      migration.validateTargetHeader(current);
    } catch (error) {
      throwUnsupportedRefusal(migration, error, "Session header");
    }
    return current;
  }
};
var ChainedMigrationContext = class {
  entry;
  output;
  constructor(entry, output) {
    this.entry = entry;
    this.output = output;
  }
  emitEvent(event) {
    try {
      this.entry.stage.transformEvent(event, this.output);
    } catch (error) {
      throwUnsupportedRefusal(this.entry.migration, error);
    }
  }
  emitRun(run) {
    try {
      this.entry.stage.transformRun(run, this.output);
    } catch (error) {
      throwUnsupportedRefusal(this.entry.migration, error);
    }
  }
  finish() {
    let targetCut;
    try {
      targetCut = this.entry.stage.finish(this.output);
    } catch (error) {
      throwUnsupportedRefusal(this.entry.migration, error);
    }
    if (this.entry.stage.headerInheritedEventCount !== void 0 && this.entry.stage.headerInheritedEventCount !== targetCut) throw new SessionFormatError(`${this.entry.migration.name} changed its predeclared inherited cut`);
    return targetCut;
  }
};
var CompiledSessionFormatMigrationStream = class {
  header;
  sourceInheritedEventCount;
  input;
  stages;
  constructor(header, sourceInheritedEventCount, entries, output) {
    this.header = header;
    this.sourceInheritedEventCount = sourceInheritedEventCount;
    const stages = new Array(entries.length);
    let downstream = output;
    for (const [offset, entry] of entries.toReversed().entries()) {
      const context = new ChainedMigrationContext(entry, downstream);
      stages[entries.length - offset - 1] = context;
      downstream = context;
    }
    this.input = downstream;
    this.stages = stages;
  }
  emitEvent(event) {
    this.input.emitEvent(event);
  }
  emitRun(run) {
    this.input.emitRun(run);
  }
  finish() {
    let inheritedEventCount = this.sourceInheritedEventCount;
    for (const stage of this.stages) inheritedEventCount = stage.finish();
    return sessionFormatCount(inheritedEventCount, "finished Session inherited event count");
  }
};
function throwUnsupportedRefusal(migration, error, subject = "Session") {
  if (error instanceof SessionFormatUnsupportedMigrationError) throw error;
  const detail = error instanceof Error ? error.message : String(error);
  throw new SessionFormatUnsupportedMigrationError(`${migration.name} refuses this format v${migration.fromVersion} ${subject}: ${detail}`, { cause: error });
}
var SessionFormatEventCollector = class {
  /** Events retained by this collector in source order. */
  values = [];
  /**
  * Retain one settled event.
  * @param event - settled event emitted by the upstream stage.
  */
  emitEvent(event) {
    this.values.push(event);
  }
  /**
  * Expand one compact run directly into retained events.
  * @param run - compact event run emitted by the upstream stage.
  */
  emitRun(run) {
    for (const event of run.expand()) this.values.push(event);
  }
};
function createSessionFormatCatalog(options) {
  const chain = createSessionFormatChain(options);
  const codecs = /* @__PURE__ */ new Map();
  for (const codec of options.codecs) {
    const version = sessionFormatVersion(codec.version, "Session format codec version");
    if (codecs.has(version)) throw new SessionFormatError(`Session format codec v${version} is duplicated`);
    codecs.set(version, Object.freeze({ ...codec }));
  }
  for (let version = 0; version <= chain.currentVersion; version += 1) if (!codecs.has(version)) throw new SessionFormatError(`Session format codec v${version} is missing`);
  if (codecs.size !== chain.currentVersion + 1) throw new SessionFormatError(`Session format codec v${[...codecs.keys()].find((version) => version > chain.currentVersion)} is newer than current v${chain.currentVersion}`);
  function readHeader(headerValue) {
    let storedVersion;
    try {
      storedVersion = inspectSessionFormatVersion(headerValue);
    } catch (error) {
      return malformed(chain.currentVersion, error);
    }
    if (storedVersion > chain.currentVersion) return Object.freeze({
      status: "unsupported",
      storedVersion,
      targetVersion: chain.currentVersion,
      reason: `stored Session uses newer format v${storedVersion}; this build writes v${chain.currentVersion}`
    });
    const codec = codecs.get(storedVersion);
    if (codec === void 0) return Object.freeze({
      status: "unsupported",
      storedVersion,
      targetVersion: chain.currentVersion,
      reason: `this build has no Session format codec for v${storedVersion}`
    });
    try {
      const decoded = snapshotSessionFormatHeader(codec.decodeHeader(headerValue), `format v${storedVersion} header`);
      const header = chain.migrateHeader(decoded);
      return Object.freeze({
        status: storedVersion === chain.currentVersion ? "current" : "migration-required",
        storedVersion,
        targetVersion: chain.currentVersion,
        header
      });
    } catch (error) {
      if (error instanceof SessionFormatUnsupportedMigrationError) return Object.freeze({
        status: "unsupported",
        storedVersion,
        targetVersion: chain.currentVersion,
        reason: error.message
      });
      return malformed(chain.currentVersion, error, storedVersion);
    }
  }
  function artifactCodec(headerValue) {
    const storedVersion = inspectSessionFormatVersion(headerValue);
    if (storedVersion > chain.currentVersion) throw new SessionFormatUnsupportedMigrationError(`stored Session uses newer format v${storedVersion}; this build writes v${chain.currentVersion}`);
    const codec = codecs.get(storedVersion);
    if (codec === void 0) throw new SessionFormatUnsupportedMigrationError(`this build has no Session format codec for v${storedVersion}`);
    return {
      storedVersion,
      codec
    };
  }
  function encodeCurrentHeader(header, inheritedEventCount) {
    if (inspectSessionFormatVersion(header) !== chain.currentVersion) throw new SessionFormatError(`encodeCurrent requires Session format v${chain.currentVersion}`);
    const encoded = options.currentEncoder.encodeHeader(header, inheritedEventCount);
    if (inspectSessionFormatVersion(encoded) !== chain.currentVersion) throw new SessionFormatError("current Session codec returned a non-current header");
    return encoded;
  }
  function createRestore(headerValue, restoreOptions) {
    const { storedVersion, codec } = artifactCodec(headerValue);
    const decoder = codec.createDecoder(headerValue, restoreOptions.recovery);
    const sourceCut = decoder.headerInheritedEventCount;
    if (storedVersion === chain.currentVersion) return new CurrentSessionFormatRestore(decoder, sourceCut, restoreOptions.validation === "current" ? options.restoreCurrent : identityArtifact, chain.currentVersion);
    const collector = new SessionFormatEventCollector();
    return new MigratingSessionFormatRestore(decoder, sourceCut, chain.createStream(decoder.header, sourceCut, collector), collector, restoreOptions.validation === "current" ? options.restoreCurrent : options.restoreTransformedCurrent, restoreOptions.validation, storedVersion, chain.currentVersion);
  }
  return Object.freeze({
    currentVersion: chain.currentVersion,
    readHeader,
    createRestore,
    encodeCurrentHeader,
    encodeCurrentEvent: options.currentEncoder.encodeEvent.bind(options.currentEncoder)
  });
}
var CurrentSessionFormatRestore = class {
  decoder;
  sourceInheritedEventCount;
  restoreArtifact;
  currentVersion;
  header;
  collector = new SessionFormatEventCollector();
  constructor(decoder, sourceInheritedEventCount, restoreArtifact, currentVersion) {
    this.decoder = decoder;
    this.sourceInheritedEventCount = sourceInheritedEventCount;
    this.restoreArtifact = restoreArtifact;
    this.currentVersion = currentVersion;
    this.header = decoder.header;
  }
  decodeRow(rowValue) {
    this.decoder.decodeRow(rowValue, this.collector);
  }
  finish() {
    const inheritedEventCount = finishDecoder(this.decoder, this.collector, this.sourceInheritedEventCount);
    return restoreCurrentVersion(this.restoreArtifact({
      header: this.header,
      inheritedEventCount,
      events: this.collector.values
    }), this.currentVersion);
  }
};
var MigratingSessionFormatRestore = class {
  decoder;
  sourceInheritedEventCount;
  migration;
  collector;
  restoreArtifact;
  validation;
  sourceVersion;
  currentVersion;
  header;
  constructor(decoder, sourceInheritedEventCount, migration, collector, restoreArtifact, validation, sourceVersion, currentVersion) {
    this.decoder = decoder;
    this.sourceInheritedEventCount = sourceInheritedEventCount;
    this.migration = migration;
    this.collector = collector;
    this.restoreArtifact = restoreArtifact;
    this.validation = validation;
    this.sourceVersion = sourceVersion;
    this.currentVersion = currentVersion;
    this.header = migration.header;
  }
  decodeRow(rowValue) {
    this.decoder.decodeRow(rowValue, this);
  }
  emitEvent(event) {
    this.migration.emitEvent(event);
  }
  emitRun(run) {
    this.migration.emitRun(run);
  }
  finish() {
    finishDecoder(this.decoder, this, this.sourceInheritedEventCount);
    const artifact = {
      header: this.header,
      inheritedEventCount: this.migration.finish(),
      events: this.collector.values
    };
    let restored;
    try {
      restored = this.restoreArtifact(artifact);
    } catch (error) {
      if (this.validation === "current" || error instanceof SessionFormatUnsupportedMigrationError) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new SessionFormatUnsupportedMigrationError(`Session migration from v${this.sourceVersion} to v${this.currentVersion} refuses the transformed artifact: ${detail}`, { cause: error });
    }
    return restoreCurrentVersion(restored, this.currentVersion);
  }
};
function finishDecoder(decoder, context, sourceInheritedEventCount) {
  const inheritedEventCount = decoder.finish(context);
  if (sourceInheritedEventCount !== void 0 && inheritedEventCount !== sourceInheritedEventCount) throw new SessionFormatError("streaming decoder changed its predeclared inherited cut");
  return inheritedEventCount;
}
function restoreCurrentVersion(artifact, currentVersion) {
  if (artifact.header.version !== currentVersion) throw new SessionFormatError(`current Session restorer returned v${artifact.header.version}; expected v${currentVersion}`);
  return artifact;
}
function identityArtifact(artifact) {
  return artifact;
}
function malformed(targetVersion, error, storedVersion) {
  return Object.freeze({
    status: "malformed",
    ...storedVersion === void 0 ? {} : { storedVersion },
    targetVersion,
    reason: error instanceof Error ? error.message : String(error)
  });
}
var CANONICAL_LOG_FILENAME = /^session(?:\.v([1-9][0-9]*))?\.jsonl$/u;
function sessionFormatLogFilename(version) {
  const generation = sessionFormatVersion(version, "Session log generation version");
  return generation === 0 ? "session.jsonl" : `session.v${generation}.jsonl`;
}
function parseSessionFormatLogFilename(filename) {
  const match = CANONICAL_LOG_FILENAME.exec(filename);
  if (match === null) return void 0;
  if (match[1] === void 0) return 0;
  const version = Number(match[1]);
  return Number.isSafeInteger(version) ? version : void 0;
}
export {
  SessionFormatError,
  SessionFormatEventCollector,
  SessionFormatUnsupportedMigrationError,
  createSessionFormatCatalog,
  createSessionFormatChain,
  defineSessionFormatMigration,
  inspectSessionFormatVersion,
  isSessionFormatJsonObject,
  parseSessionFormatLogFilename,
  sessionFormatCount,
  sessionFormatLogFilename,
  sessionFormatSafeInteger,
  sessionFormatVersion,
  snapshotSessionFormatHeader,
  snapshotSessionFormatJson
};
