# Architecture

## Product premise

Xorcism is a user-controlled productivity tool, not an autonomous moderation system.

The user decides which visible accounts enter the queue. Xorcism performs a finite sequence of visible actions and then stops.

## Components

### Side panel: control plane

Files:

- `src/popup/popup.html`
- `src/popup/popup.css`
- `src/popup/popup.js`

The directory retains its original `popup` name, but the page is displayed through Chrome's Side Panel API.

Responsibilities:

- verify that the active tab is an X page;
- refresh when the active browser tab changes or navigates;
- start and stop selection mode;
- show selected handles;
- let the user start the reviewed queue;
- start and stop the background queue;
- display progress and stage-specific errors.

Pressing **Block selected** is the explicit start action. There is no additional Xorcism confirmation dialog. Queue execution does not depend on the side panel remaining open.

### Selection controller: click and marquee intent capture

File:

- `src/content/selection-controller.js`

Responsibilities:

- switch the source page into selection mode;
- toggle one supported card on click;
- create a drag-selection marquee after a movement threshold;
- auto-scroll when the pointer is held near a viewport edge;
- preview cards that meaningfully intersect the rectangle;
- add all previewed cards on pointer release;
- extract and deduplicate account handles;
- leave selection mode on `Esc`.

Selection state is held in memory in the source tab. Geometry calculations live in `src/shared/geometry-utils.js` so they can be unit tested without a browser DOM.

### Background service worker: finite queue coordinator

File:

- `src/background/service-worker.js`

Responsibilities:

- freeze and validate the selected handle list;
- persist queue state in `chrome.storage.session`;
- process one handle at a time;
- request a fast inline attempt from the source page;
- open or reuse one inactive profile tab when inline blocking is unavailable;
- honour stop requests between accounts;
- close the temporary profile tab;
- publish progress to the side panel;
- clear the source selection when the run ends.

The queue has no infinite discovery loop. Every run is bounded by the user-selected handle list.

### X adapter: fragile platform boundary

File:

- `src/content/x-adapter.js`

Responsibilities:

- find a selected visible card by handle;
- identify a card-level account action menu conservatively;
- identify a profile-level action menu conservatively;
- distinguish Block from Unblock;
- identify X's confirmation control;
- wait for confirmation UI to close;
- return structured outcomes with stages and fallback eligibility.

All assumptions about X's current DOM belong here. When X changes its interface, repair this adapter before touching product logic.

### Shared utilities

Files:

- `src/shared/handle-utils.js`
- `src/shared/geometry-utils.js`
- `src/shared/messages.js`

Responsibilities:

- validate and parse account handles;
- reject known reserved routes;
- find author profile links inside supported cards;
- calculate and test marquee intersections;
- define message names shared across extension contexts.

## Execution flow

```text
User opens side panel
      │
      ▼
Enable selection in source X tab
      │
      ├── click one card
      └── drag marquee over many cards
      │
      ▼
Review deduplicated handles
      │
      ▼
Press Block selected
      │
      ▼
Background service worker
      │
      ├── Ask source tab to block inline
      │       └── success → next account
      │
      └── No safe inline action
              │
              ▼
        Reuse inactive profile tab
              │
              ▼
        Block through profile menu
              │
              ▼
        Next account / stop / finish
```

## State model

```text
source page
└─ selection
   ├─ active
   ├─ handles[]
   └─ selectedCount

background
└─ runner
   ├─ running
   ├─ stopRequested
   ├─ status
   ├─ current
   ├─ total
   ├─ succeeded
   ├─ skipped
   ├─ failed
   ├─ currentHandle
   ├─ sourceTabId
   └─ errors[]
      ├─ handle
      ├─ kind
      ├─ stage
      └─ message
```

Queue state is stored in session storage so reopening the side panel does not lose progress. Selection remains intentionally ephemeral.

## Why the profile-tab fallback exists

Some X surfaces expose a per-account action menu directly. People-search result cells often expose only profile navigation and a Follow button. Broadly searching the page for another destructive control would be unsafe.

The fallback therefore opens the exact selected profile in one inactive tab, verifies the profile handle, uses that profile's own action menu, and closes the tab when the queue ends.

## Timing model

Xorcism does not add a random human-emulation delay.

It waits only for:

- X menus and confirmation dialogs to appear;
- the confirmation dialog to close;
- profile navigation when fallback is required;
- a fixed 300 ms cooldown between completed accounts.

The profile-page load, rather than the fixed cooldown, is normally the largest source of waiting.

## Failure philosophy

Xorcism fails closed:

- no confident author handle → do not select;
- no selected card mounted → use profile fallback;
- no safe card menu → use profile fallback;
- profile handle mismatch → fail;
- no confident Block or Unblock action → fail;
- no confirmation control → fail;
- already blocked → skip;
- user requests stop → finish the current account, then stop.

The extension should never compensate for uncertainty by clicking a broader destructive selector.

## Future repeated-text suggestions

A future detector should remain a separate local analysis layer:

```text
visible posts
   │
   ▼
local feature extraction
   │
   ▼
candidate clusters + reasons
   │
   ▼
user review and selection
   │
   ▼
existing finite block queue
```

The detector may suggest. The user must decide.
