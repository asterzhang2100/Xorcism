const test = require("node:test");
const assert = require("node:assert/strict");

const {
  intersectionArea,
  meaningfullyIntersects,
  normaliseRect
} = require("../src/shared/geometry-utils.js");

test("normalises a drag rectangle in any direction", () => {
  assert.deepEqual(normaliseRect(100, 80, 20, 10), {
    left: 20,
    top: 10,
    right: 100,
    bottom: 80,
    width: 80,
    height: 70
  });
});

test("calculates intersection area", () => {
  assert.equal(
    intersectionArea(
      { left: 0, top: 0, right: 10, bottom: 10 },
      { left: 5, top: 4, right: 12, bottom: 9 }
    ),
    25
  );
});

test("selects a card when its centre is inside the marquee", () => {
  assert.equal(
    meaningfullyIntersects(
      { left: 40, top: 40, right: 70, bottom: 70 },
      { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }
    ),
    true
  );
});

test("ignores a tiny accidental edge overlap", () => {
  assert.equal(
    meaningfullyIntersects(
      { left: 99, top: 0, right: 102, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }
    ),
    false
  );
});
