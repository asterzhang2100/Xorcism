# Manual Testing Checklist

Use a test account or a non-critical account. Start with one account.

## Installation and upgrade

- [ ] The extension loads without manifest errors on Chrome 114 or newer.
- [ ] The toolbar icon has transparent corners and no dark square canvas.
- [ ] Clicking the toolbar icon opens the Xorcism side panel.
- [ ] A non-X tab shows a clear unsupported-page message.
- [ ] Switching between X and non-X tabs refreshes the side panel correctly.
- [ ] Switching between two X tabs does not let one tab's selection overwrite the other tab's UI.
- [ ] Reloading the unpacked extension and X tab loads v0.3.0.

## Click selection

- [ ] Select mode activates from the side panel.
- [ ] The in-page instruction bar appears.
- [ ] Hovering a supported card produces a preview outline.
- [ ] Clicking a post card selects its author.
- [ ] Clicking a People-search user card selects its account.
- [ ] Clicking the selected card again removes it.
- [ ] Selecting two cards from the same account produces one handle.
- [ ] Pressing `Esc` exits selection mode.
- [ ] Clearing removes all selected styling.

## Drag selection

- [ ] Holding the primary mouse button and moving more than six pixels creates a marquee.
- [ ] The normal text-selection cursor does not take over while dragging.
- [ ] Cards inside the marquee show a preview outline.
- [ ] Releasing the pointer adds all previewed account handles.
- [ ] Dragging from bottom-right to top-left works.
- [ ] Holding near the top or bottom edge scrolls the page while preserving the marquee.
- [ ] A tiny accidental edge overlap does not select a card.
- [ ] `Esc` cancels an active marquee without leaving selection mode.
- [ ] A normal click still toggles one card after a drag.

## Queue start behaviour

- [ ] Starting an empty queue is impossible.
- [ ] **Block selected** is disabled while selection mode is active.
- [ ] Pressing **Block selected** starts the queue immediately without an extra Xorcism confirmation dialog.
- [ ] The selected handles shown immediately before the click match the queue that starts.

## Inline blocking on post and reply pages

- [ ] One selected post author blocks through its card menu.
- [ ] Reply-thread cards are processed successfully.
- [ ] The correct account handle appears in the Block action when X displays it.
- [ ] X's confirmation control is clicked once.
- [ ] The next account begins only after the confirmation UI closes.
- [ ] A selector failure does not click another menu item.

## People-search fallback

- [ ] Selecting People-search results creates the correct queue.
- [ ] A result with no card menu falls back to an inactive profile tab.
- [ ] Only one temporary profile tab is reused for the queue.
- [ ] The source X tab stays active.
- [ ] The profile handle is verified before blocking.
- [ ] The temporary tab closes when the queue completes.
- [ ] Closing the temporary tab manually produces a useful failure and does not crash the queue.

## Queue and stop behaviour

- [ ] Progress survives closing and reopening the side panel.
- [ ] The current handle and counts update.
- [ ] Stop finishes the current account and prevents the next one.
- [ ] The runner stops automatically at the end.
- [ ] Already-blocked accounts are marked skipped.
- [ ] A suspended or missing account produces a stage-specific error.
- [ ] One failure does not crash the remaining queue.
- [ ] The source selection clears when the run ends.

## Developer diagnostics

Record:

- Xorcism version and commit;
- browser and browser version;
- X interface language;
- source page type;
- selected account count;
- failure stage from the side panel;
- service-worker console error;
- source-tab console error;
- temporary-profile-tab console error;
- screenshot with personal data removed.
