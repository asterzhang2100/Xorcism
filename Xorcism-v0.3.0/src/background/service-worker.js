importScripts(
  "../shared/namespace.js",
  "../shared/messages.js",
  "../shared/handle-utils.js"
);

const { HandleUtils, Messages } = globalThis.Xorcism;

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true
  })
  .catch((error) => {
    console.error("Could not configure the Xorcism side panel:", error);
  });

const RUNNER_STORAGE_KEY = "xorcismRunnerState";
const PROFILE_LOAD_TIMEOUT_MS = 20_000;
const CONTENT_READY_TIMEOUT_MS = 12_000;
const BETWEEN_ACCOUNTS_DELAY_MS = 300;

let workerTabId = null;
let runGeneration = 0;
let runnerState = createInitialRunnerState();
let hydrationPromise = hydrateRunnerState();

function createInitialRunnerState() {
  return {
    running: false,
    stopRequested: false,
    status: "idle",
    current: 0,
    total: 0,
    succeeded: 0,
    skipped: 0,
    failed: 0,
    currentHandle: null,
    errors: [],
    sourceTabId: null,
    startedAt: null
  };
}

function serialisableState() {
  return {
    ...runnerState,
    errors: [...runnerState.errors]
  };
}

async function hydrateRunnerState() {
  const stored = await chrome.storage.session.get(RUNNER_STORAGE_KEY);
  const previous = stored[RUNNER_STORAGE_KEY];

  if (!previous) {
    return;
  }

  runnerState = {
    ...createInitialRunnerState(),
    ...previous,
    running: false,
    stopRequested: false,
    status: previous.running ? "interrupted" : previous.status,
    currentHandle: null
  };

  await persistAndBroadcast();
}

async function persistAndBroadcast() {
  const state = serialisableState();
  await chrome.storage.session.set({
    [RUNNER_STORAGE_KEY]: state
  });

  try {
    await chrome.runtime.sendMessage({
      type: Messages.RUNNER_STATE_CHANGED,
      state
    });
  } catch {
    // No extension page is currently listening.
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function profileUrl(handle) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

function tabIsAtHandle(tab, handle) {
  if (!tab?.url) {
    return false;
  }

  try {
    const url = new URL(tab.url);
    const [pathHandle] = url.pathname.split("/").filter(Boolean);
    return pathHandle?.toLowerCase() === handle.toLowerCase();
  } catch {
    return false;
  }
}

async function waitForProfileTab(tabId, handle) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < PROFILE_LOAD_TIMEOUT_MS) {
    const tab = await chrome.tabs.get(tabId);

    if (tab.status === "complete" && tabIsAtHandle(tab, handle)) {
      return;
    }

    await sleep(150);
  }

  throw new Error("Profile page did not finish loading in time.");
}

async function askProfileTabToBlock(tabId, handle) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < CONTENT_READY_TIMEOUT_MS) {
    try {
      return await chrome.tabs.sendMessage(tabId, {
        type: Messages.BLOCK_CURRENT_PROFILE,
        handle
      });
    } catch (error) {
      lastError = error;
      await sleep(200);
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Xorcism could not connect to the profile page: ${lastError.message}`
      : "Xorcism could not connect to the profile page."
  );
}

async function askSourceTabToBlock(tabId, handle) {
  if (!tabId) {
    return {
      status: "failed",
      stage: "source-tab",
      fallbackAllowed: true,
      reason: "The original X tab is no longer available."
    };
  }

  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: Messages.BLOCK_VISIBLE_ACCOUNT,
      handle
    });
  } catch (error) {
    return {
      status: "failed",
      stage: "source-tab",
      fallbackAllowed: true,
      reason:
        error instanceof Error
          ? `Could not use the source page: ${error.message}`
          : "Could not use the source page."
    };
  }
}

async function ensureWorkerTab(handle, sourceWindowId) {
  const url = profileUrl(handle);

  if (workerTabId !== null) {
    try {
      await chrome.tabs.update(workerTabId, {
        active: false,
        url
      });
      return workerTabId;
    } catch {
      workerTabId = null;
    }
  }

  const tab = await chrome.tabs.create({
    active: false,
    url,
    windowId: sourceWindowId
  });

  if (!tab.id) {
    throw new Error("Chrome did not create the profile worker tab.");
  }

  workerTabId = tab.id;
  return workerTabId;
}

async function closeWorkerTab() {
  if (workerTabId === null) {
    return;
  }

  const tabId = workerTabId;
  workerTabId = null;

  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // The user may already have closed it.
  }
}

function recordResult(handle, result) {
  if (result?.status === "blocked") {
    runnerState.succeeded += 1;
    return;
  }

  const kind = result?.status === "skipped" ? "skipped" : "failed";
  runnerState[kind] += 1;
  runnerState.errors.push({
    handle,
    kind,
    stage: result?.stage || "unknown",
    message: result?.reason || "Unknown profile automation error."
  });
}

async function clearSourceSelection() {
  if (!runnerState.sourceTabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(runnerState.sourceTabId, {
      type: Messages.CLEAR_SELECTION
    });
  } catch {
    // The source tab may have navigated or closed.
  }
}

async function runQueue(handles, sourceTabId, sourceWindowId, generation) {
  runnerState = {
    ...createInitialRunnerState(),
    running: true,
    status: "running",
    total: handles.length,
    sourceTabId,
    startedAt: Date.now()
  };
  await persistAndBroadcast();

  try {
    for (let index = 0; index < handles.length; index += 1) {
      if (generation !== runGeneration || runnerState.stopRequested) {
        runnerState.status = "stopped";
        break;
      }

      const handle = handles[index];
      runnerState.current = index + 1;
      runnerState.currentHandle = handle;
      await persistAndBroadcast();

      try {
        let result = await askSourceTabToBlock(sourceTabId, handle);

        if (result?.status !== "blocked" && result?.fallbackAllowed) {
          const tabId = await ensureWorkerTab(handle, sourceWindowId);
          await waitForProfileTab(tabId, handle);
          result = await askProfileTabToBlock(tabId, handle);
        }

        recordResult(handle, result);
      } catch (error) {
        recordResult(handle, {
          status: "failed",
          stage: "profile-worker",
          reason:
            error instanceof Error
              ? error.message
              : "Unknown profile worker error."
        });
      }

      await persistAndBroadcast();

      if (index < handles.length - 1 && !runnerState.stopRequested) {
        await sleep(BETWEEN_ACCOUNTS_DELAY_MS);
      }
    }

    if (runnerState.status === "running") {
      runnerState.status = "completed";
    }
  } finally {
    runnerState.running = false;
    runnerState.currentHandle = null;
    await closeWorkerTab();
    await clearSourceSelection();
    await persistAndBroadcast();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === Messages.GET_RUNNER_STATE) {
    void hydrationPromise.then(() => {
      sendResponse({
        ok: true,
        state: serialisableState()
      });
    });
    return true;
  }

  if (message.type === Messages.START_BLOCKING) {
    void hydrationPromise.then(async () => {
      if (runnerState.running) {
        sendResponse({
          ok: false,
          error: "A block queue is already running.",
          state: serialisableState()
        });
        return;
      }

      const handles = [
        ...new Set(
          (Array.isArray(message.handles) ? message.handles : [])
            .map(HandleUtils.normaliseHandle)
            .filter(Boolean)
        )
      ];

      if (handles.length === 0) {
        sendResponse({
          ok: false,
          error: "No valid accounts were supplied.",
          state: serialisableState()
        });
        return;
      }

      runGeneration += 1;
      const generation = runGeneration;
      const sourceTabId = Number.isInteger(message.sourceTabId)
        ? message.sourceTabId
        : sender.tab?.id || null;
      const sourceWindowId = Number.isInteger(message.sourceWindowId)
        ? message.sourceWindowId
        : sender.tab?.windowId;

      void runQueue(
        handles,
        sourceTabId,
        sourceWindowId,
        generation
      );

      sendResponse({
        ok: true,
        state: serialisableState()
      });
    });
    return true;
  }

  if (message.type === Messages.STOP_BLOCKING) {
    void hydrationPromise.then(async () => {
      if (runnerState.running) {
        runnerState.stopRequested = true;
        runnerState.status = "stopping";
        await persistAndBroadcast();
      }

      sendResponse({
        ok: true,
        state: serialisableState()
      });
    });
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === workerTabId) {
    workerTabId = null;
  }
});
