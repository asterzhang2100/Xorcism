# Security Policy

## Supported versions

Xorcism is experimental. Security fixes are applied to the latest release on the default branch.

## Reporting a vulnerability

Please use GitHub's private security advisory feature when available. Do not publish:

- account cookies or tokens;
- login details;
- private X content;
- screenshots containing sensitive personal information;
- a working exploit before maintainers have had a reasonable chance to respond.

A useful report includes:

- affected version and commit;
- browser and browser version;
- exact reproduction steps;
- expected and actual behaviour;
- security impact;
- a minimal proof of concept with secrets removed.

## Security principles

Xorcism should:

- request the minimum browser permissions;
- keep all executable code inside the extension package;
- avoid `eval`, inline script injection, and remote code;
- avoid undocumented authenticated endpoints;
- never collect credentials, cookies, or tokens;
- require explicit user initiation for account actions;
- provide a visible stop mechanism;
- fail closed when page elements cannot be identified confidently.
