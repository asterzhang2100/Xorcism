# Changelog

All notable changes to Xorcism will be documented here.

## [0.3.0] - 2026-07-26

### Added

- Persistent Chrome side-panel interface opened from the toolbar icon.
- Edge auto-scroll while drag-selecting accounts near the top or bottom of the page.
- Active-tab refresh handling for the persistent side panel.
- Chrome 114 minimum-version declaration.

### Changed

- Updated project metadata from v0.2.0 to v0.3.0.
- Removed the redundant `activeTab` permission; X-only host access already provides the required page access.
- Updated README, privacy, architecture, contribution, and manual-testing documentation for the side-panel workflow.
- Clarified in the side panel and documentation that the queue starts immediately after the user presses **Block selected**.

### Removed

- The additional Xorcism confirmation dialog before queue execution.

## [0.2.0] - 2026-07-25

### Added

- Drag-box multi-selection for visible post and People-search cards.
- Unit-tested marquee geometry.
- Manifest V3 background service worker for a finite queue.
- Fast inline blocking attempt on the source page.
- Reusable inactive profile-tab fallback for cards without an action menu.
- Session-persisted queue progress.
- Stage-specific failure diagnostics.
- Already-blocked account detection.
- Project-level manifest and JavaScript syntax check.
- Transparent purple toolbar icon with no opaque dark canvas.

### Changed

- Reduced the explicit between-account cooldown from a random 1.3–1.8 seconds to a fixed 300 milliseconds.
- Replaced source-page-only execution with a hybrid inline/profile strategy.
- Updated popup copy, architecture, privacy documentation, and test checklist.

### Removed

- The source-tab-only block runner.
- Randomised action delay.

## [0.1.0] - 2026-07-25

### Added

- Manifest V3 Chromium extension scaffold.
- Manual selection mode for visible post and user cards.
- Account-handle extraction and deduplication.
- Reviewable queue in the popup.
- Sequential blocking through the visible X interface.
- Default delay between actions.
- Stop, clear, progress, skipped, and failure states.
- Privacy, security, contribution, architecture, and manual-testing documentation.
