const Messages = Object.freeze({
  GET_PAGE_STATE: "XORCISM_GET_PAGE_STATE",
  ENABLE_SELECTION: "XORCISM_ENABLE_SELECTION",
  DISABLE_SELECTION: "XORCISM_DISABLE_SELECTION",
  CLEAR_SELECTION: "XORCISM_CLEAR_SELECTION",
  GET_RUNNER_STATE: "XORCISM_GET_RUNNER_STATE",
  START_BLOCKING: "XORCISM_START_BLOCKING",
  STOP_BLOCKING: "XORCISM_STOP_BLOCKING",
  PAGE_STATE_CHANGED: "XORCISM_PAGE_STATE_CHANGED",
  RUNNER_STATE_CHANGED: "XORCISM_RUNNER_STATE_CHANGED"
});

const elements = {
  unsupported: document.querySelector("#unsupported"),
  workspace: document.querySelector("#workspace"),
  selectionStatus: document.querySelector("#selection-status"),
  selectedCount: document.querySelector("#selected-count"),
  selectButton: document.querySelector("#select-button"),
  doneButton: document.querySelector("#done-button"),
  clearButton: document.querySelector("#clear-button"),
  emptyState: document.querySelector("#empty-state"),
  handleList: document.querySelector("#handle-list"),
  runLabel: document.querySelector("#run-label"),
  runProgress: document.querySelector("#run-progress"),
  progressBar: document.querySelector("#progress-bar"),
  runSummary: document.querySelector("#run-summary"),
  blockButton: document.querySelector("#block-button"),
  stopButton: document.querySelector("#stop-button"),
  errorDetails: document.querySelector("#error-details"),
  errorList: document.querySelector("#error-list")
};

let activeTab = null;
let pageState = null;
let runnerState = null;
let refreshGeneration = 0;

function defaultPageState() {
  return {
    pageSupported: false,
    selection: {
      active: false,
      handles: [],
      selectedCount: 0
    }
  };
}

function defaultRunnerState() {
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
    errors: []
  };
}

async function getActiveXTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (
    !tab?.id ||
    !/^https:\/\/(x\.com|twitter\.com)\//i.test(tab.url || "")
  ) {
    throw new Error("The active tab is not an X page.");
  }

  return tab;
}

async function sendToContent(type) {
  const tab = activeTab || (await getActiveXTab());
  return chrome.tabs.sendMessage(tab.id, { type });
}

async function sendToBackground(type, payload = {}) {
  return chrome.runtime.sendMessage({
    type,
    ...payload
  });
}

function setSupported(supported) {
  elements.unsupported.hidden = supported;
  elements.workspace.hidden = !supported;
}

function renderHandles(handles) {
  elements.handleList.replaceChildren();

  for (const handle of handles) {
    const item = document.createElement("li");
    item.textContent = `@${handle}`;
    elements.handleList.append(item);
  }

  elements.emptyState.hidden = handles.length > 0;
}

function describeRunner(runner) {
  if (runner.running) {
    return runner.status === "stopping"
      ? "Stopping after the current account…"
      : runner.currentHandle
        ? `Blocking @${runner.currentHandle}…`
        : "Starting the queue…";
  }

  if (runner.status === "completed") {
    return `Finished: ${runner.succeeded} blocked, ${runner.skipped} skipped, ${runner.failed} failed.`;
  }

  if (runner.status === "stopped") {
    return `Stopped: ${runner.succeeded} blocked, ${runner.skipped} skipped, ${runner.failed} failed.`;
  }

  if (runner.status === "interrupted") {
    return "The previous queue was interrupted when Chrome stopped the extension worker.";
  }

  return "Review the queue before starting.";
}

function renderErrors(errors) {
  elements.errorList.replaceChildren();

  for (const error of errors) {
    const item = document.createElement("li");
    const stage = error.stage ? ` [${error.stage}]` : "";
    item.textContent = `@${error.handle}${stage}: ${error.message}`;
    elements.errorList.append(item);
  }

  elements.errorDetails.hidden = errors.length === 0;
}

function render() {
  const page = pageState || defaultPageState();
  const runner = runnerState || defaultRunnerState();
  const supported = page.pageSupported || runner.running;

  setSupported(supported);

  if (!supported) {
    return;
  }

  const selection = page.selection;
  const selectedCount = selection.handles.length;

  const progress =
    runner.total > 0
      ? Math.round((runner.current / runner.total) * 100)
      : 0;

  elements.selectionStatus.textContent = selection.active
    ? "Active — click or drag across cards"
    : "Inactive";

  elements.selectedCount.textContent = String(selectedCount);

  elements.selectButton.disabled =
    selection.active || runner.running;

  elements.doneButton.disabled =
    !selection.active || runner.running;

  elements.clearButton.disabled =
    selectedCount === 0 || runner.running;

  elements.blockButton.disabled =
    selectedCount === 0 ||
    runner.running ||
    selection.active;

  elements.blockButton.hidden = runner.running;
  elements.stopButton.hidden = !runner.running;
  elements.stopButton.disabled = runner.stopRequested;

  renderHandles(selection.handles);

  elements.runLabel.textContent = runner.running
    ? runner.status === "stopping"
      ? "Stopping"
      : "Running"
    : runner.status === "completed"
      ? "Completed"
      : runner.status === "stopped"
        ? "Stopped"
        : runner.status === "interrupted"
          ? "Interrupted"
          : "Ready";

  elements.runProgress.textContent =
    `${runner.current} / ${runner.total}`;

  elements.progressBar.style.width =
    `${progress}%`;

  elements.runSummary.textContent =
    describeRunner(runner);

  renderErrors(runner.errors);
}

async function refresh() {
  const generation = ++refreshGeneration;
  let nextRunnerState = defaultRunnerState();
  let nextActiveTab = null;
  let nextPageState = defaultPageState();

  try {
    const runnerResponse = await sendToBackground(
      Messages.GET_RUNNER_STATE
    );

    if (runnerResponse?.ok && runnerResponse.state) {
      nextRunnerState = runnerResponse.state;
    }
  } catch {
    // Render page controls even if the service worker is restarting.
  }

  try {
    nextActiveTab = await getActiveXTab();

    const pageResponse = await chrome.tabs.sendMessage(
      nextActiveTab.id,
      {
        type: Messages.GET_PAGE_STATE
      }
    );

    if (!pageResponse?.ok) {
      throw new Error(
        pageResponse?.error ||
        "Xorcism content script unavailable."
      );
    }

    nextPageState = pageResponse.state;
  } catch {
    nextActiveTab = null;
    nextPageState = defaultPageState();
  }

  if (generation !== refreshGeneration) {
    return;
  }

  runnerState = nextRunnerState;
  activeTab = nextActiveTab;
  pageState = nextPageState;
  render();
}

async function runContentAction(type) {
  try {
    const response = await sendToContent(type);

    if (response?.state) {
      pageState = response.state;
      render();
    }
  } catch {
    pageState = defaultPageState();
    render();
  }
}

async function startBlocking() {
  const handles =
    pageState?.selection.handles || [];

  if (
    handles.length === 0 ||
    !activeTab?.id
  ) {
    return;
  }

  await runContentAction(
    Messages.DISABLE_SELECTION
  );

  try {
    const response = await sendToBackground(
      Messages.START_BLOCKING,
      {
        handles,
        sourceTabId: activeTab.id,
        sourceWindowId: activeTab.windowId
      }
    );

    if (response?.state) {
      runnerState = response.state;
    }

    if (
      !response?.ok &&
      response?.error
    ) {
      elements.runSummary.textContent =
        response.error;
    }

    render();
  } catch {
    elements.runSummary.textContent =
      "Could not start the background queue.";
  }
}

elements.selectButton.addEventListener(
  "click",
  () => {
    void runContentAction(
      Messages.ENABLE_SELECTION
    );
  }
);

elements.doneButton.addEventListener(
  "click",
  () => {
    void runContentAction(
      Messages.DISABLE_SELECTION
    );
  }
);

elements.clearButton.addEventListener(
  "click",
  () => {
    void runContentAction(
      Messages.CLEAR_SELECTION
    );
  }
);

elements.blockButton.addEventListener(
  "click",
  () => {
    void startBlocking();
  }
);

elements.stopButton.addEventListener(
  "click",
  async () => {
    try {
      const response = await sendToBackground(
        Messages.STOP_BLOCKING
      );

      if (response?.state) {
        runnerState = response.state;
        render();
      }
    } catch {
      elements.runSummary.textContent =
        "Could not send the stop request.";
    }
  }
);

chrome.runtime.onMessage.addListener(
  (message, sender) => {
    if (
      message?.type ===
        Messages.PAGE_STATE_CHANGED &&
      message.state &&
      sender.tab?.id === activeTab?.id
    ) {
      pageState = message.state;
      render();
    }

    if (
      message?.type ===
        Messages.RUNNER_STATE_CHANGED &&
      message.state
    ) {
      runnerState = message.state;
      render();
    }
  }
);

chrome.tabs.onActivated.addListener(() => {
  void refresh();
});

chrome.tabs.onUpdated.addListener(
  (_tabId, changeInfo, tab) => {
    if (
      tab.active &&
      (changeInfo.status || changeInfo.url)
    ) {
      void refresh();
    }
  }
);

void refresh();
