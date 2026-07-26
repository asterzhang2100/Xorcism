# Contributing to Xorcism

Thank you for helping make Xorcism safer and less fragile.

## Before opening a pull request

1. Create a focused branch.
2. Keep X-specific selectors inside `src/content/x-adapter.js`.
3. Preserve explicit user initiation, the reviewable queue, and the visible stop control.
4. Do not add telemetry or remote code.
5. Run:

```powershell
npm run check
```

6. Complete the relevant checks in `docs/MANUAL_TESTING.md`.

## Code style

- Use two-space indentation.
- Prefer small functions with descriptive names.
- Treat page text and DOM structure as untrusted input.
- Avoid broad selectors that could click an unrelated destructive control.
- Return structured outcomes instead of swallowing errors.
- Add comments for why a workaround exists, not for what obvious code does.

## Pull request description

Explain:

- the user-facing problem;
- the proposed behaviour;
- platform assumptions;
- safety implications;
- testing performed;
- screenshots or recordings with personal information removed.

## Feature policy

A contribution should not:

- run automated actions without explicit user initiation;
- bypass X safety mechanisms or hidden account controls;
- collect credentials or authentication material;
- use remote executable code;
- add harassment, mass-reporting, or platform-manipulation features.
