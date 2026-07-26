(() => {
  const {
    Messages,
    SelectionController,
    XAdapter
  } = globalThis.Xorcism;

  const adapter = new XAdapter();

  const safeBroadcastPageState = () => {
    try {
      const promise = chrome.runtime.sendMessage({
        type: Messages.PAGE_STATE_CHANGED,
        state: getPageState()
      });

      if (promise?.catch) {
        promise.catch(() => {});
      }
    } catch {
      // The popup is normally closed while the user selects cards.
    }
  };

  const selection = new SelectionController(safeBroadcastPageState);

  function getPageState() {
    return {
      pageSupported: true,
      selection: selection.getState()
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      return false;
    }

    switch (message.type) {
      case Messages.GET_PAGE_STATE:
        sendResponse({
          ok: true,
          state: getPageState()
        });
        return false;

      case Messages.ENABLE_SELECTION:
        selection.enable();
        sendResponse({
          ok: true,
          state: getPageState()
        });
        return false;

      case Messages.DISABLE_SELECTION:
        selection.disable();
        sendResponse({
          ok: true,
          state: getPageState()
        });
        return false;

      case Messages.CLEAR_SELECTION:
        selection.clear();
        sendResponse({
          ok: true,
          state: getPageState()
        });
        return false;

      case Messages.BLOCK_VISIBLE_ACCOUNT:
        void adapter.blockVisibleAccount(message.handle).then((result) => {
          sendResponse(result);
        });
        return true;

      case Messages.BLOCK_CURRENT_PROFILE:
        void adapter.blockCurrentProfile(message.handle).then((result) => {
          sendResponse(result);
        });
        return true;

      default:
        return false;
    }
  });
})();
