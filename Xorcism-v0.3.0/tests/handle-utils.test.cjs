const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractHandleFromHref,
  normaliseHandle
} = require("../src/shared/handle-utils.js");

test("normalises a valid X handle", () => {
  assert.equal(normaliseHandle("@Xorcism_dev"), "Xorcism_dev");
});

test("rejects invalid handles", () => {
  assert.equal(normaliseHandle("has a space"), null);
  assert.equal(normaliseHandle("abcdefghijklmnop"), null);
  assert.equal(normaliseHandle("hello-world"), null);
});

test("rejects reserved X routes", () => {
  assert.equal(normaliseHandle("home"), null);
  assert.equal(normaliseHandle("@settings"), null);
});

test("extracts a handle from an X profile URL", () => {
  assert.equal(
    extractHandleFromHref("https://x.com/Xorcism_dev"),
    "Xorcism_dev"
  );
  assert.equal(
    extractHandleFromHref("/AsterZhang", "https://x.com/home"),
    "AsterZhang"
  );
});

test("does not treat post and settings URLs as profile handles", () => {
  assert.equal(
    extractHandleFromHref("https://x.com/Xorcism_dev/status/123"),
    null
  );
  assert.equal(
    extractHandleFromHref("https://x.com/settings"),
    null
  );
});

test("rejects links outside X", () => {
  assert.equal(
    extractHandleFromHref("https://example.com/Xorcism_dev"),
    null
  );
});
