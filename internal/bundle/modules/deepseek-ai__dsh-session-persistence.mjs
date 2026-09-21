// .harness/packages/session/session-persistence/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { KNOWN_SESSION_EVENT_TYPES, SESSION_FORMAT_VERSION, adoptSessionEvent } from "@deepseek-ai/dsh-session";
import { snapshotJsonValue } from "@deepseek-ai/dsh-util-values";
function SessionPersistenceRevision(value) {
  return value;
}
var SessionPersistenceNotFoundError = class extends Error {
  sessionId;
  /** @param sessionId - absent durable Session identity. */
  constructor(sessionId) {
    super(`session "${sessionId}" not found`);
    this.sessionId = sessionId;
    this.name = "SessionPersistenceNotFoundError";
  }
};
var SessionAlreadyExistsError = class extends Error {
  sessionId;
  /** @param sessionId - the occupied durable Session identity. */
  constructor(sessionId) {
    super(`session "${sessionId}" already exists`);
    this.sessionId = sessionId;
    this.name = "SessionAlreadyExistsError";
  }
};
var SessionAlreadyOwnedError = class extends Error {
  sessionId;
  /** @param sessionId - the session whose write ownership is taken. */
  constructor(sessionId) {
    super(`session "${sessionId}" is already owned by an active write handle`);
    this.sessionId = sessionId;
    this.name = "SessionAlreadyOwnedError";
  }
};
var SessionReadOnlyError = class extends Error {
  sessionId;
  /**
  * @param sessionId - the session the read handle observes.
  * @param operation - the refused mutating operation name.
  */
  constructor(sessionId, operation) {
    super(`session "${sessionId}": ${operation} is not available on a read handle`);
    this.sessionId = sessionId;
    this.name = "SessionReadOnlyError";
  }
};
var SessionOwnershipLostError = class extends Error {
  sessionId;
  /** @param sessionId - the session whose write ownership this handle lost. */
  constructor(sessionId) {
    super(`session "${sessionId}": write ownership was lost; close this handle and reopen`);
    this.sessionId = sessionId;
    this.name = "SessionOwnershipLostError";
  }
};
var SessionHandleClosedError = class extends Error {
  sessionId;
  /**
  * @param sessionId - the session the closed handle addressed.
  * @param operation - the refused operation name.
  */
  constructor(sessionId, operation) {
    super(`session "${sessionId}": ${operation} on a closed handle`);
    this.sessionId = sessionId;
    this.name = "SessionHandleClosedError";
  }
};
var SessionPersistenceCorruptionError = class extends Error {
  /**
  * @param message - stable corruption context.
  * @param options - original validation failure.
  */
  constructor(message, options) {
    super(message, options);
    this.name = "SessionPersistenceCorruptionError";
  }
};
var SessionFormatUnsupportedError = class extends Error {
  location;
  /**
  * @param message - stable reason the log cannot be interpreted, already
  *   including the raw-log path when one exists.
  * @param location - the backend's artifact location, when one exists.
  */
  constructor(message, location) {
    super(message);
    this.location = location;
    this.name = "SessionFormatUnsupportedError";
  }
};
function sessionFormatVersionRefusal(id, version) {
  return version > SESSION_FORMAT_VERSION ? `session "${id}" uses log format v${version}, but this harness reads only v${SESSION_FORMAT_VERSION}: the log was written by a newer harness \u2014 upgrade the harness to open it` : `session "${id}" uses log format v${version}, older than the supported v${SESSION_FORMAT_VERSION}, and this build ships no upgrade path for it`;
}
function unsupported(reason, location) {
  return new SessionFormatUnsupportedError(location === void 0 ? reason : `${reason} (raw log: ${location.path})`, location);
}
function assertStoredId(id, meta) {
  if (meta.id !== id) throw new Error(`stored session identity mismatch: requested "${id}", header contains "${meta.id}"`);
}
function assertVersion(meta, location) {
  if (meta.version !== SESSION_FORMAT_VERSION) throw unsupported(sessionFormatVersionRefusal(meta.id, meta.version), location);
}
function validateStoredEvents(meta, events, location) {
  for (const event of events) {
    if (!KNOWN_SESSION_EVENT_TYPES.has(event.type) && event.ignorable !== true) throw unsupported(`session "${meta.id}" contains event type "${event.type}" (seq ${event.seq}) unknown to this harness and not marked ignorable; refusing to interpret the log \u2014 it was likely written by a newer harness`, location);
    if (event.type === "request/header") {
      const data = event.data;
      if (typeof data === "object" && data !== null && data["reason"] === "fallback") throw unsupported(`session "${meta.id}" contains a request/header event (seq ${event.seq}) with the unsupported legacy reason "fallback"; refusing to interpret the log \u2014 it was written by a retired pre-release harness`, location);
    }
  }
  try {
    for (const [index, event] of events.entries()) events[index] = adoptSessionEvent(event);
  } catch (error) {
    if (error instanceof SessionFormatUnsupportedError) throw error;
    throw new SessionPersistenceCorruptionError(`stored session "${meta.id}" failed validation: ${String(error)}`, { cause: error });
  }
  return events;
}
function materializeCreateHeader(header) {
  const snapshot = snapshotJsonValue(header);
  if (snapshot === void 0) throw new TypeError("session metadata must be losslessly JSON-serializable");
  if (!Number.isSafeInteger(snapshot.createdAt) || snapshot.createdAt < 0) throw new TypeError("session metadata createdAt must be a non-negative safe integer");
  return snapshot;
}
function materializeAppendBatch(events) {
  const batch = snapshotJsonValue(events);
  if (batch === void 0) throw new TypeError("session event batch is not losslessly JSON-serializable because it contains non-JSON-serializable data");
  return batch;
}
function assertContiguous(id, events, cursor) {
  for (const [index, event] of events.entries()) if (event.seq !== cursor + index) throw new Error(`append seq mismatch for "${id}": expected ${cursor + index} at index ${index}, got ${event.seq}`);
}
var SessionPersistence = class extends Service {
  constructor(ctx) {
    super(ctx, "sessionPersistence");
  }
};
export {
  SessionAlreadyExistsError,
  SessionAlreadyOwnedError,
  SessionFormatUnsupportedError,
  SessionHandleClosedError,
  SessionOwnershipLostError,
  SessionPersistence,
  SessionPersistenceCorruptionError,
  SessionPersistenceNotFoundError,
  SessionPersistenceRevision,
  SessionReadOnlyError,
  assertContiguous,
  assertStoredId,
  assertVersion,
  SessionPersistence as default,
  materializeAppendBatch,
  materializeCreateHeader,
  sessionFormatVersionRefusal,
  validateStoredEvents
};
