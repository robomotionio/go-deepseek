// .harness/packages/session/session-format-catalog/lib/index.js
import { KNOWN_SESSION_EVENT_TYPES, SESSION_FORMAT_VERSION, Session, SessionId, SessionLogOffset } from "@deepseek-ai/dsh-session";
import { SessionFormatUnsupportedMigrationError, createSessionFormatCatalog } from "@deepseek-ai/dsh-session-format";
import { imageOffloadProjection } from "@deepseek-ai/dsh-compaction-image-offload/projection";
import { releasedV0SessionFormatCodec, releasedV1SessionFormatCodec, sessionFormatV0ToV1 } from "@deepseek-ai/dsh-session-format-v0-to-v1";
import { releasedV2SessionFormatCodec, sessionFormatV1ToV2 } from "@deepseek-ai/dsh-session-format-v1-to-v2";
import { assertReleasedV3Header, releasedV3SessionFormatCodec, restoreReleasedV3Artifact, sessionFormatV2ToV3 } from "@deepseek-ai/dsh-session-format-v2-to-v3";
var currentSessionMessageProjections = [imageOffloadProjection];
function validateInstalledCurrentSessionHeader(header) {
  if (header.version !== SESSION_FORMAT_VERSION) throw new Error(`installed Session format is v${SESSION_FORMAT_VERSION}, got v${header.version}`);
  Session.fromRestore(SessionId(header.id), [], header, SessionLogOffset(0), "detached");
}
function validateInstalledCurrentSessionArtifact(artifact) {
  if (artifact.header.version !== SESSION_FORMAT_VERSION) throw new Error(`installed Session format is v${SESSION_FORMAT_VERSION}, got v${artifact.header.version}`);
  Session.fromRestore(SessionId(artifact.header.id), artifact.events, artifact.header, SessionLogOffset(artifact.inheritedEventCount), "detached", currentSessionMessageProjections);
}
var sessionFormatCatalog = createSessionFormatCatalog({
  currentVersion: 3,
  codecs: [
    releasedV0SessionFormatCodec,
    releasedV1SessionFormatCodec,
    releasedV2SessionFormatCodec,
    releasedV3SessionFormatCodec
  ],
  currentEncoder: releasedV3SessionFormatCodec,
  migrations: [
    sessionFormatV0ToV1,
    sessionFormatV1ToV2,
    sessionFormatV2ToV3
  ],
  restoreCurrent(artifact) {
    const restored = restoreReleasedV3Artifact(artifact, KNOWN_SESSION_EVENT_TYPES);
    validateInstalledCurrentSessionArtifact(restored);
    return restored;
  },
  restoreTransformedCurrent(artifact) {
    return restoreReleasedV3Artifact(artifact, KNOWN_SESSION_EVENT_TYPES);
  },
  restoreCurrentHeader(header) {
    assertReleasedV3Header(header);
    validateInstalledCurrentSessionHeader(header);
    return header;
  }
});
export {
  SessionFormatUnsupportedMigrationError,
  sessionFormatCatalog
};
