(function attachGeometryUtils(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.Xorcism = root.Xorcism || {};
  root.Xorcism.GeometryUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function normaliseRect(startX, startY, endX, endY) {
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const right = Math.max(startX, endX);
    const bottom = Math.max(startY, endY);

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  function intersectionArea(first, second) {
    const width = Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left)
    );
    const height = Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
    );

    return width * height;
  }

  function centreInside(container, target) {
    const centreX = target.left + target.width / 2;
    const centreY = target.top + target.height / 2;

    return (
      centreX >= container.left &&
      centreX <= container.right &&
      centreY >= container.top &&
      centreY <= container.bottom
    );
  }

  function meaningfullyIntersects(selectionRect, targetRect) {
    const targetArea = Math.max(1, targetRect.width * targetRect.height);
    const overlapRatio = intersectionArea(selectionRect, targetRect) / targetArea;

    return centreInside(selectionRect, targetRect) || overlapRatio >= 0.08;
  }

  return Object.freeze({
    intersectionArea,
    meaningfullyIntersects,
    normaliseRect
  });
});
