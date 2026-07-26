# Privacy Policy

Last updated: 26 July 2026

Xorcism is designed to operate locally inside the user's browser.

## Data Xorcism handles locally

During an active browser session, Xorcism may temporarily hold:

- X account handles selected by the user;
- the identifier of the source X tab;
- selection state;
- queue progress;
- success, skip, and error messages.

Selection information remains in the source page's memory. Queue state is stored in Chrome's session-only extension storage so progress survives closing and reopening the side panel. It is not intended to persist after the browser session ends.

## Data collection and sharing

Xorcism does not:

- collect analytics;
- create a user profile;
- read passwords;
- read authentication cookies or tokens;
- read direct messages;
- sell or share data;
- send selected handles to the developer or another service;
- load remote executable code.

Xorcism uses locally handled information only to provide its disclosed purpose: letting the user select visible X accounts and run a finite blocking queue.

## Network activity

Xorcism does not initiate developer-server, advertising, or third-party analytics requests. When it opens an X profile or clicks X's own Block controls, the X page performs its normal authenticated network requests.

## Permissions

Xorcism requests:

- `storage` to retain queue progress for the current browser session;
- `sidePanel` to display the extension's controls, review list, progress, and errors in Chrome's side panel.

Chrome's Tabs API is used to query the active tab and to create, navigate, message, and close the temporary X profile tab. Xorcism does not request the broad `tabs` permission; it relies on its X-only host access instead.

Its page access is limited to:

- `https://x.com/*`
- `https://twitter.com/*`

## User control and deletion

The user can clear the current selection from the side panel. Selection also disappears when the source page reloads. Queue state is stored only for the browser session and is not transmitted to the developer.

## Changes

Material privacy changes should be documented in the repository changelog and release notes before distribution.
