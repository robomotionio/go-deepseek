// .harness/packages/credentials/credentials/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { brandString } from "@deepseek-ai/dsh-brand";
var REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
var KEY_SEGMENT_PATTERN = /^[a-z][a-z0-9-]*$/;
function credentialRef(value) {
  if (!isCredentialRefName(value)) throw new TypeError(`credential ref "${value}" must match ${String(REF_PATTERN)}`);
  return brandString(value);
}
function isCredentialRefName(value) {
  return REF_PATTERN.test(value);
}
function isCredentialKeySegment(value) {
  return KEY_SEGMENT_PATTERN.test(value);
}
function credentialKey(scope, id) {
  for (const segment of [scope, id]) if (!KEY_SEGMENT_PATTERN.test(segment)) throw new TypeError(`credential key segment "${segment}" must match ${String(KEY_SEGMENT_PATTERN)}`);
  return brandString(`${scope}/${id}`);
}
function parseCredentialKey(value) {
  const segments = value.split("/");
  const [scope, id] = segments;
  if (segments.length !== 2 || scope === void 0 || id === void 0) throw new TypeError(`credential key "${value}" must be "<scope>/<id>"`);
  return credentialKey(scope, id);
}
function credentialKeyScope(key) {
  return key.slice(0, key.indexOf("/"));
}
function credentialKeyId(key) {
  return key.slice(key.indexOf("/") + 1);
}
var CredentialProvider = class extends Service {
  constructor(ctx) {
    super(ctx, "credentials");
  }
  /**
  * Fan `credentials/reference-updated` out with contained listener failures: every
  * listener runs, and a sync throw or async rejection is logged without
  * changing the committed operation's outcome — except `INVARIANT`-coded
  * failures, which rethrow after every listener ran (the rethrow reaches the
  * caller only from synchronous listeners, so invariant checks on this event
  * must not be async functions). Providers call this only after the write or
  * reload actually committed, so a broken observer can never make a durable
  * change look failed.
  * @param ref - the reference whose stored value changed.
  */
  notifyUpdated(ref) {
    this.fanOut("credentials/reference-updated", ref);
  }
  /**
  * Fan `credentials/record-updated` out on exactly the terms
  * {@link notifyUpdated} documents, for the record half of the seam.
  * @param key - the record whose stored value changed.
  */
  notifyRecordUpdated(key) {
    this.fanOut("credentials/record-updated", key);
  }
  /** The contained dispatch both notifications run through; see {@link notifyUpdated}. */
  fanOut(event, subject) {
    let invariantFailure;
    const args = [event, subject];
    for (const listener of this.ctx.events.dispatch("emit", args)) try {
      const returned = listener(subject);
      if (returned != null && typeof returned.then === "function") Promise.resolve(returned).then(void 0, (error) => {
        this.warnListenerFailure(event, subject, error);
      });
    } catch (error) {
      if (error?.code === "INVARIANT") {
        invariantFailure ??= error;
        continue;
      }
      this.warnListenerFailure(event, subject, error);
    }
    if (invariantFailure !== void 0) throw invariantFailure;
  }
  /** Contained-listener diagnostic shared by the sync and async failure paths. */
  warnListenerFailure(event, subject, error) {
    this.ctx.logger.warn('credentials: a %s listener for "%s" failed', event, subject);
    this.ctx.logger.warn(error);
  }
};
export {
  CredentialProvider,
  credentialKey,
  credentialKeyId,
  credentialKeyScope,
  credentialRef,
  CredentialProvider as default,
  isCredentialKeySegment,
  isCredentialRefName,
  parseCredentialKey
};
