(() => {
  const { GeometryUtils, HandleUtils } = globalThis.Xorcism;

  const DRAG_THRESHOLD_PX = 6;
  const AUTO_SCROLL_EDGE_PX = 90;
  const AUTO_SCROLL_MAX_SPEED_PX = 24;
  const SELECTABLE_CARD_SELECTOR =
    'article[data-testid="tweet"], [data-testid="UserCell"]';

  class SelectionController {
    constructor(onChange) {
      this.active = false;
      this.selectedCardsByHandle = new Map();
      this.hoveredCard = null;
      this.drag = null;
      this.dragPreviewCards = new Set();
      this.suppressNextClick = false;
      this.autoScrollFrame = null;
      this.onChange = onChange;

      this.handleClick = this.handleClick.bind(this);
      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.handleMouseOut = this.handleMouseOut.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.autoScrollTick = this.autoScrollTick.bind(this);
      this.handleNativeDragStart = this.handleNativeDragStart.bind(this);
      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    enable() {
      if (this.active) {
        return;
      }

      this.active = true;
      document.body.classList.add("xorcism-selection-mode");
      document.addEventListener("click", this.handleClick, true);
      document.addEventListener("mouseover", this.handleMouseOver, true);
      document.addEventListener("mouseout", this.handleMouseOut, true);
      document.addEventListener("pointerdown", this.handlePointerDown, true);
      document.addEventListener("pointermove", this.handlePointerMove, true);
      document.addEventListener("pointerup", this.handlePointerUp, true);
      document.addEventListener("pointercancel", this.handlePointerUp, true);
      document.addEventListener("dragstart", this.handleNativeDragStart, true);
      document.addEventListener("selectstart", this.handleSelectStart, true);
      document.addEventListener("keydown", this.handleKeyDown, true);
      this.ensureOverlay();
      this.updateOverlay();
      this.emitChange();
    }

    disable() {
      if (!this.active) {
        return;
      }

      this.active = false;
      document.body.classList.remove(
        "xorcism-selection-mode",
        "xorcism-dragging"
      );
      document.removeEventListener("click", this.handleClick, true);
      document.removeEventListener("mouseover", this.handleMouseOver, true);
      document.removeEventListener("mouseout", this.handleMouseOut, true);
      document.removeEventListener("pointerdown", this.handlePointerDown, true);
      document.removeEventListener("pointermove", this.handlePointerMove, true);
      document.removeEventListener("pointerup", this.handlePointerUp, true);
      document.removeEventListener("pointercancel", this.handlePointerUp, true);
      document.removeEventListener("dragstart", this.handleNativeDragStart, true);
      document.removeEventListener("selectstart", this.handleSelectStart, true);
      document.removeEventListener("keydown", this.handleKeyDown, true);
      this.cancelDrag();
      this.setHoveredCard(null);
      this.removeOverlay();
      this.emitChange();
    }

    clear() {
      for (const cards of this.selectedCardsByHandle.values()) {
        for (const card of cards) {
          card.removeAttribute("data-xorcism-selected");
        }
      }

      this.selectedCardsByHandle.clear();
      this.updateOverlay();
      this.emitChange();
    }

    getHandles() {
      return [...this.selectedCardsByHandle.keys()];
    }

    getState() {
      return {
        active: this.active,
        handles: this.getHandles(),
        selectedCount: this.selectedCardsByHandle.size
      };
    }

    handleClick(event) {
      if (!this.active) {
        return;
      }

      if (this.suppressNextClick) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.suppressNextClick = false;
        return;
      }

      const card = HandleUtils.findSelectableCard(event.target);

      if (!card) {
        return;
      }

      const handle = HandleUtils.findHandleInElement(card);

      if (!handle) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      this.toggleCard(handle, card);
    }

    handleMouseOver(event) {
      if (!this.active || this.drag?.isDragging) {
        return;
      }

      const card = HandleUtils.findSelectableCard(event.target);
      this.setHoveredCard(card);
    }

    handleMouseOut(event) {
      if (!this.active || !this.hoveredCard || this.drag?.isDragging) {
        return;
      }

      if (
        event.relatedTarget instanceof Node &&
        this.hoveredCard.contains(event.relatedTarget)
      ) {
        return;
      }

      this.setHoveredCard(null);
    }

    handlePointerDown(event) {
      if (
        !this.active ||
        event.button !== 0 ||
        event.isPrimary === false ||
        this.shouldIgnoreDragStart(event.target)
      ) {
        return;
      }

      this.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        endX: event.clientX,
        endY: event.clientY,
        isDragging: false
      };
    }

    handlePointerMove(event) {
      if (
        !this.active ||
        !this.drag ||
        event.pointerId !== this.drag.pointerId
      ) {
        return;
      }

      this.drag.endX = event.clientX;
      this.drag.endY = event.clientY;

      const distance = Math.hypot(
        this.drag.endX - this.drag.startX,
        this.drag.endY - this.drag.startY
      );

      if (!this.drag.isDragging && distance < DRAG_THRESHOLD_PX) {
        return;
      }

      if (!this.drag.isDragging) {
        this.drag.isDragging = true;
        this.setHoveredCard(null);
        document.body.classList.add("xorcism-dragging");
        this.ensureMarquee();
        this.startAutoScroll();
      }

      event.preventDefault();
      event.stopPropagation();
      this.updateMarqueeAndPreview();
    }

startAutoScroll() {
  if (this.autoScrollFrame !== null) {
    return;
  }

  this.autoScrollFrame = window.requestAnimationFrame(
    this.autoScrollTick
  );
}

stopAutoScroll() {
  if (this.autoScrollFrame === null) {
    return;
  }

  window.cancelAnimationFrame(this.autoScrollFrame);
  this.autoScrollFrame = null;
}

autoScrollTick() {
  if (!this.drag?.isDragging) {
    this.autoScrollFrame = null;
    return;
  }

  const pointerY = this.drag.endY;
  const viewportHeight = window.innerHeight;
  const bottomEdge = viewportHeight - AUTO_SCROLL_EDGE_PX;

  let scrollAmount = 0;

  if (pointerY < AUTO_SCROLL_EDGE_PX) {
    const strength = Math.min(
      1,
      (AUTO_SCROLL_EDGE_PX - pointerY) /
        AUTO_SCROLL_EDGE_PX
    );

    scrollAmount = -Math.ceil(
      AUTO_SCROLL_MAX_SPEED_PX * strength
    );
  } else if (pointerY > bottomEdge) {
    const strength = Math.min(
      1,
      (pointerY - bottomEdge) /
        AUTO_SCROLL_EDGE_PX
    );

    scrollAmount = Math.ceil(
      AUTO_SCROLL_MAX_SPEED_PX * strength
    );
  }

  if (scrollAmount !== 0) {
    const previousScrollY = window.scrollY;

    window.scrollBy({
      top: scrollAmount,
      left: 0,
      behavior: "auto"
    });

    if (window.scrollY !== previousScrollY) {
      this.updateMarqueeAndPreview();
    }
  }

  this.autoScrollFrame = window.requestAnimationFrame(
    this.autoScrollTick
  );
}

    handlePointerUp(event) {
      if (!this.drag || event.pointerId !== this.drag.pointerId) {
        return;
      }

      if (this.drag.isDragging) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const cards = [...this.dragPreviewCards];
        this.cancelDrag();

        for (const card of cards) {
          this.addCard(card);
        }

        this.suppressNextClick = true;
        window.setTimeout(() => {
          this.suppressNextClick = false;
        }, 0);
        this.updateOverlay();
        this.emitChange();
        return;
      }

      this.drag = null;
    }

    handleNativeDragStart(event) {
      if (this.active) {
        event.preventDefault();
      }
    }

    handleSelectStart(event) {
      if (this.drag?.isDragging) {
        event.preventDefault();
      }
    }

    handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        if (this.drag?.isDragging) {
          this.cancelDrag();
          return;
        }

        this.disable();
      }
    }

    shouldIgnoreDragStart(target) {
      if (!(target instanceof Element)) {
        return true;
      }

      return Boolean(
        target.closest(
          '#xorcism-selection-overlay, input, textarea, select, [contenteditable="true"]'
        )
      );
    }

    addCard(card) {
      const handle = HandleUtils.findHandleInElement(card);

      if (!handle) {
        return false;
      }

      const cards = this.selectedCardsByHandle.get(handle) || new Set();
      cards.add(card);
      card.setAttribute("data-xorcism-selected", "true");
      this.selectedCardsByHandle.set(handle, cards);
      return true;
    }

    toggleCard(handle, card) {
      const cards = this.selectedCardsByHandle.get(handle) || new Set();

      if (cards.has(card)) {
        cards.delete(card);
        card.removeAttribute("data-xorcism-selected");

        if (cards.size === 0) {
          this.selectedCardsByHandle.delete(handle);
        }
      } else {
        cards.add(card);
        card.setAttribute("data-xorcism-selected", "true");
        this.selectedCardsByHandle.set(handle, cards);
      }

      this.updateOverlay();
      this.emitChange();
    }

    updateMarqueeAndPreview() {
      if (!this.drag) {
        return;
      }

      const rectangle = GeometryUtils.normaliseRect(
        this.drag.startX,
        this.drag.startY,
        this.drag.endX,
        this.drag.endY
      );
      const marquee = this.ensureMarquee();

      Object.assign(marquee.style, {
        left: `${rectangle.left}px`,
        top: `${rectangle.top}px`,
        width: `${rectangle.width}px`,
        height: `${rectangle.height}px`
      });

      for (const card of document.querySelectorAll(SELECTABLE_CARD_SELECTOR)) {
        const cardRect = card.getBoundingClientRect();

        if (
          cardRect.width > 0 &&
          cardRect.height > 0 &&
          GeometryUtils.meaningfullyIntersects(rectangle, cardRect)
        ) {
          this.dragPreviewCards.add(card);
          card.setAttribute("data-xorcism-drag-preview", "true");
        }
      }
    }

    cancelDrag() {
      this.stopAutoScroll();
      this.drag = null;
      document.body.classList.remove("xorcism-dragging");
      document.getElementById("xorcism-selection-marquee")?.remove();

      for (const card of this.dragPreviewCards) {
        card.removeAttribute("data-xorcism-drag-preview");
      }

      this.dragPreviewCards.clear();
    }

    ensureMarquee() {
      let marquee = document.getElementById("xorcism-selection-marquee");

      if (!marquee) {
        marquee = document.createElement("div");
        marquee.id = "xorcism-selection-marquee";
        document.documentElement.append(marquee);
      }

      return marquee;
    }

    setHoveredCard(card) {
      if (this.hoveredCard === card) {
        return;
      }

      if (this.hoveredCard) {
        this.hoveredCard.removeAttribute("data-xorcism-hovered");
      }

      this.hoveredCard = card;

      if (this.hoveredCard) {
        this.hoveredCard.setAttribute("data-xorcism-hovered", "true");
      }
    }

    ensureOverlay() {
      if (document.getElementById("xorcism-selection-overlay")) {
        return;
      }

      const overlay = document.createElement("div");
      overlay.id = "xorcism-selection-overlay";
      overlay.setAttribute("role", "status");
      overlay.setAttribute("aria-live", "polite");

      const title = document.createElement("strong");
      title.textContent = "Xorcism selection mode";

      const instruction = document.createElement("span");
      instruction.textContent =
        "Click one card, or drag across many. Hold near an edge to scroll. Press Esc when done.";

      const count = document.createElement("span");
      count.id = "xorcism-selection-count";

      overlay.append(title, instruction, count);
      document.documentElement.append(overlay);
    }

    updateOverlay() {
      const count = document.getElementById("xorcism-selection-count");

      if (count) {
        const amount = this.selectedCardsByHandle.size;
        count.textContent = `${amount} unique account${amount === 1 ? "" : "s"} selected`;
      }
    }

    removeOverlay() {
      document.getElementById("xorcism-selection-overlay")?.remove();
    }

    emitChange() {
      this.onChange?.();
    }
  }

  globalThis.Xorcism.SelectionController = SelectionController;
})();
