(() => {
  const { HandleUtils } = globalThis.Xorcism;

  const BLOCK_PREFIXES = [
    "block",
    "屏蔽",
    "封鎖",
    "封锁",
    "ブロック",
    "bloquear",
    "bloquer",
    "blockieren",
    "blocca",
    "блокировать"
  ];

  const UNBLOCK_PREFIXES = [
    "unblock",
    "取消屏蔽",
    "解除封鎖",
    "解除封锁",
    "ブロック解除",
    "desbloquear",
    "débloquer",
    "entsperren",
    "sblocca",
    "разблокировать"
  ];

  const MORE_LABELS = [
    "more",
    "more actions",
    "更多",
    "更多操作",
    "もっと見る",
    "más",
    "plus",
    "mehr"
  ];

  function delay(milliseconds) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function isVisible(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);

    return (
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      element.getClientRects().length > 0
    );
  }

  async function waitFor(find, options = {}) {
    const timeoutMs = options.timeoutMs ?? 7_000;
    const intervalMs = options.intervalMs ?? 100;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const value = find();

      if (value) {
        return value;
      }

      await delay(intervalMs);
    }

    throw new Error(options.errorMessage || "Timed out waiting for X interface.");
  }

  function currentProfileHandle() {
    const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
    return HandleUtils.normaliseHandle(firstSegment || "");
  }

  function normaliseText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function startsWithKnownLabel(text, prefixes) {
    const normalised = normaliseText(text);
    return prefixes.some((prefix) => normalised.startsWith(prefix));
  }

  function startsWithBlockLabel(text) {
    return startsWithKnownLabel(text, BLOCK_PREFIXES);
  }

  function startsWithUnblockLabel(text) {
    return startsWithKnownLabel(text, UNBLOCK_PREFIXES);
  }

  function hasMoreLabel(element) {
    const labels = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.textContent
    ]
      .map(normaliseText)
      .filter(Boolean);

    return labels.some((label) =>
      MORE_LABELS.some(
        (known) => label === known || label.startsWith(`${known} `)
      )
    );
  }

  function getMountedCards() {
    return [
      ...document.querySelectorAll(
        'article[data-testid="tweet"], [data-testid="UserCell"]'
      )
    ];
  }

  function findCardByHandle(handle) {
    const expected = handle.toLowerCase();

    return (
      getMountedCards().find((card) => {
        const cardHandle = HandleUtils.findHandleInElement(card);
        return cardHandle?.toLowerCase() === expected;
      }) || null
    );
  }

  function findCardActionMenuButton(card) {
    const strongSelectors = [
      'button[data-testid="caret"]',
      '[data-testid="caret"][role="button"]',
      'button[aria-haspopup="menu"]'
    ];

    for (const selector of strongSelectors) {
      const candidate = [...card.querySelectorAll(selector)].find(isVisible);

      if (candidate) {
        return candidate;
      }
    }

    return (
      [...card.querySelectorAll('button, [role="button"]')]
        .filter(isVisible)
        .find(hasMoreLabel) || null
    );
  }

  function findProfileActionMenuButton() {
    const strongSelectors = [
      '[data-testid="primaryColumn"] button[data-testid="userActions"]',
      '[data-testid="primaryColumn"] [data-testid="userActions"][role="button"]',
      'button[data-testid="userActions"]',
      '[data-testid="userActions"][role="button"]'
    ];

    for (const selector of strongSelectors) {
      const candidate = [...document.querySelectorAll(selector)].find(isVisible);

      if (candidate) {
        return candidate;
      }
    }

    const primaryColumn =
      document.querySelector('[data-testid="primaryColumn"]') || document;

    return (
      [...primaryColumn.querySelectorAll('button, [role="button"]')]
        .filter(isVisible)
        .find(hasMoreLabel) || null
    );
  }

  function findBlockMenuDecision(handle) {
    const candidates = [
      ...document.querySelectorAll(
        '[role="menuitem"], [data-testid="block"], [data-testid="Dropdown"] [role="button"]'
      )
    ].filter(isVisible);

    const expectedHandle = `@${handle.toLowerCase()}`;
    const exactBlock = candidates.find((candidate) => {
      const text = normaliseText(candidate.textContent);
      return startsWithBlockLabel(text) && text.includes(expectedHandle);
    });

    if (exactBlock) {
      return {
        kind: "block",
        element: exactBlock
      };
    }

    const exactUnblock = candidates.find((candidate) => {
      const text = normaliseText(candidate.textContent);
      return startsWithUnblockLabel(text) && text.includes(expectedHandle);
    });

    if (exactUnblock) {
      return {
        kind: "unblock",
        element: exactUnblock
      };
    }

    const genericBlock = candidates.find((candidate) =>
      startsWithBlockLabel(candidate.textContent || "")
    );

    if (genericBlock) {
      return {
        kind: "block",
        element: genericBlock
      };
    }

    const genericUnblock = candidates.find((candidate) =>
      startsWithUnblockLabel(candidate.textContent || "")
    );

    if (genericUnblock) {
      return {
        kind: "unblock",
        element: genericUnblock
      };
    }

    return null;
  }

  function findConfirmationButton() {
    const strongSelectors = [
      'button[data-testid="confirmationSheetConfirm"]',
      '[data-testid="confirmationSheetConfirm"][role="button"]'
    ];

    for (const selector of strongSelectors) {
      const candidate = [...document.querySelectorAll(selector)].find(isVisible);

      if (candidate) {
        return candidate;
      }
    }

    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(
      isVisible
    );

    for (const dialog of dialogs) {
      const candidate = [
        ...dialog.querySelectorAll('button, [role="button"]')
      ]
        .filter(isVisible)
        .find((button) =>
          startsWithBlockLabel(
            button.textContent || button.getAttribute("aria-label") || ""
          )
        );

      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  function dismissTransientUi() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true
      })
    );
  }

  async function waitForConfirmationToClose(confirmButton) {
    await waitFor(
      () => !confirmButton.isConnected || !isVisible(confirmButton),
      {
        timeoutMs: 5_000,
        errorMessage:
          "X did not close the confirmation dialog after the Block click."
      }
    );
  }

  async function executeBlockThroughMenu(handle, menuButton, context) {
    menuButton.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "auto"
    });
    await delay(100);
    menuButton.click();

    const decision = await waitFor(
      () => findBlockMenuDecision(handle),
      {
        timeoutMs: 4_500,
        errorMessage: `Opened the ${context} menu but could not identify Block or Unblock.`
      }
    );

    if (decision.kind === "unblock") {
      dismissTransientUi();
      return {
        status: "skipped",
        stage: "already-blocked",
        fallbackAllowed: false,
        reason: "This account is already blocked."
      };
    }

    decision.element.click();

    const confirmButton = await waitFor(findConfirmationButton, {
      timeoutMs: 5_000,
      errorMessage:
        "Selected Block but could not identify X's confirmation button."
    });

    confirmButton.click();
    await waitForConfirmationToClose(confirmButton);

    return {
      status: "blocked",
      stage: "completed",
      fallbackAllowed: false
    };
  }

  function failureResult(error, stage, fallbackAllowed) {
    dismissTransientUi();

    return {
      status: "failed",
      stage,
      fallbackAllowed,
      reason:
        error instanceof Error ? error.message : "Unknown X interface error."
    };
  }

  class XAdapter {
    async blockVisibleAccount(rawHandle) {
      const handle = HandleUtils.normaliseHandle(rawHandle);

      if (!handle) {
        return {
          status: "failed",
          stage: "validation",
          fallbackAllowed: false,
          reason: "The supplied account handle is invalid."
        };
      }

      const card = findCardByHandle(handle);

      if (!card) {
        return {
          status: "failed",
          stage: "inline-card",
          fallbackAllowed: true,
          reason: "The selected account is no longer mounted on the source page."
        };
      }

      const menuButton = findCardActionMenuButton(card);

      if (!menuButton) {
        return {
          status: "failed",
          stage: "inline-menu",
          fallbackAllowed: true,
          reason: "This card has no account action menu."
        };
      }

      try {
        return await executeBlockThroughMenu(handle, menuButton, "card");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const fallbackAllowed = message.includes("Block or Unblock");
        const stage = fallbackAllowed
          ? "inline-block-item"
          : message.includes("confirmation")
            ? "inline-confirmation"
            : "inline-ui";
        return failureResult(error, stage, fallbackAllowed);
      }
    }

    async blockCurrentProfile(rawHandle) {
      const handle = HandleUtils.normaliseHandle(rawHandle);

      if (!handle) {
        return {
          status: "failed",
          stage: "validation",
          fallbackAllowed: false,
          reason: "The supplied account handle is invalid."
        };
      }

      const pageHandle = currentProfileHandle();

      if (!pageHandle || pageHandle.toLowerCase() !== handle.toLowerCase()) {
        return {
          status: "failed",
          stage: "profile-verification",
          fallbackAllowed: false,
          reason: `The worker opened @${pageHandle || "unknown"}, not @${handle}.`
        };
      }

      try {
        const menuButton = await waitFor(findProfileActionMenuButton, {
          timeoutMs: 10_000,
          errorMessage:
            "Could not find the profile action menu. The account may be unavailable, suspended, or X changed its profile layout."
        });

        return await executeBlockThroughMenu(handle, menuButton, "profile");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const stage = message.includes("Block or Unblock")
          ? "profile-block-item"
          : message.includes("confirmation")
            ? "profile-confirmation"
            : "profile-menu";
        return failureResult(error, stage, false);
      }
    }
  }

  globalThis.Xorcism.XAdapter = XAdapter;
})();
