# Debugging Xorcism

Xorcism runs in three browser contexts. Check the context that owns the failing behaviour.

## 1. Source X tab

Use this for:

- click or drag selection;
- card-handle extraction;
- inline post/reply blocking;
- page styling.

Steps:

1. Open the X page.
2. Press `F12`.
3. Open **Console**.
4. Reproduce the issue.
5. Look for messages or exceptions from files under `src/content/`.

Reload both the extension and the X tab after changing a content script.

## 2. Extension service worker

Use this for:

- queue progress;
- temporary profile-tab creation and navigation;
- source-page to profile-page fallback;
- stop behaviour;
- session state.

Steps:

1. Open `chrome://extensions`.
2. Find Xorcism.
3. Select the **service worker** inspection link.
4. Keep the DevTools window open.
5. Start a small queue.

Reload the extension after changing `src/background/service-worker.js`.

## 3. Temporary profile tab

Use this for:

- profile action-menu selectors;
- Block or Unblock detection;
- confirmation selectors.

The tab is normally inactive and closes automatically. To inspect it:

1. Start with one People-search result.
2. Switch to the temporary profile tab before it closes.
3. Press `F12`.
4. Reproduce with the queue stopped if necessary.

## Failure stages

The popup includes a stage beside each failed or skipped handle.

| Stage | Meaning |
|---|---|
| `inline-card` | The selected card is no longer mounted on the source page. |
| `inline-menu` | The card exists but exposes no safe account action menu. |
| `inline-block-item` | A menu opened, but Block or Unblock was not identified. |
| `inline-confirmation` | Block was selected, but the confirmation control was not identified. |
| `profile-worker` | The temporary tab could not be created, loaded, or contacted. |
| `profile-verification` | The opened profile handle did not match the queued handle. |
| `profile-menu` | The profile action menu was not identified. |
| `profile-block-item` | The profile menu opened, but Block or Unblock was not identified. |
| `profile-confirmation` | The profile confirmation control was not identified. |
| `already-blocked` | X exposed Unblock, so the account was skipped safely. |

## Useful issue report

Include:

- Xorcism version and commit;
- Chrome or Edge version;
- X interface language;
- source page type;
- one affected handle with identifying details redacted when necessary;
- popup failure stage;
- relevant console stack trace;
- screenshot with private information removed.

Do not include cookies, tokens, passwords, or private messages.
