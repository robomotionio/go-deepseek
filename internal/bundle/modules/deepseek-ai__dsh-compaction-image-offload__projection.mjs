// .harness/packages/compaction/compaction-image-offload/lib/types/project-message.js
import { deepFreeze } from "@deepseek-ai/dsh-util-values";
function offloadMessageImages(message, indexes) {
  let imageIndex = 0;
  let selected = 0;
  const visit = (blocks) => {
    let next;
    for (const [index, block] of blocks.entries()) {
      let projected = block;
      if (block.type === "image") {
        if (imageIndex === indexes[selected]) {
          if (block.offloaded === true)
            throw new Error(`image/offload: image index ${imageIndex} is already offloaded`);
          projected = { ...block, offloaded: true };
          selected += 1;
        }
        imageIndex += 1;
      } else if (block.type === "tool-result") {
        const content2 = visit(block.content);
        if (content2 !== block.content)
          projected = { ...block, content: content2 };
      }
      if (projected !== block)
        next ??= blocks.slice(0, index);
      next?.push(projected);
    }
    return next ?? blocks;
  };
  const content = visit(message.content);
  if (selected !== indexes.length)
    throw new Error(`image/offload: image index ${indexes[selected]} does not exist`);
  return deepFreeze({ ...message, content });
}

// .harness/packages/compaction/compaction-image-offload/lib/types/projection.js
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isIndex(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
}
var imageOffloadProjection = {
  type: "image/offload",
  project(event, context) {
    const data = event.data;
    if (!isRecord(data) || Object.keys(data).length !== 1 || !Array.isArray(data["targets"]) || data["targets"].length === 0) {
      throw new Error("image/offload: data must contain a nonempty targets array");
    }
    const messages = /* @__PURE__ */ new Map();
    const nodes = new Set(context.nodes);
    for (const target of data["targets"]) {
      if (!isRecord(target) || Object.keys(target).length !== 2 || !isIndex(target["seq"]) || !Array.isArray(target["imageIndexes"]) || target["imageIndexes"].length === 0) {
        throw new Error("image/offload: each target must contain a seq and nonempty imageIndexes");
      }
      const seq = target["seq"];
      if (messages.has(seq))
        throw new Error(`image/offload: duplicate target seq ${seq}`);
      if (!nodes.has(seq))
        throw new Error(`image/offload: target seq ${seq} is not a current surface node`);
      const source = context.events[seq - context.baseSeq];
      if (source?.type !== "user/message" && source?.type !== "tool/result") {
        throw new Error(`image/offload: target seq ${seq} must be user/message or tool/result`);
      }
      let previous = -1;
      for (const index of target["imageIndexes"]) {
        if (!isIndex(index) || index <= previous) {
          throw new Error("image/offload: imageIndexes must be strictly increasing non-negative safe integers");
        }
        previous = index;
      }
      const message = context.messages.get(seq) ?? (source.type === "user/message" ? source.data : source.data.message);
      messages.set(seq, offloadMessageImages(message, target["imageIndexes"]));
    }
    return messages;
  }
};
export {
  imageOffloadProjection
};
