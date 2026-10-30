# Security Policy

## About this project

Browser Arcade is a static browser game site (2048, Snake, Tetris, and chess).
There is no server, no backend, no user account, and no database. The site
does not collect, store, or send user data to a server. High scores are kept
only in the visitor's own browser via `localStorage`.

## Supported versions

Security fixes are made for the latest version on the `main` branch, which
is what is deployed to the live site. Older commits and branches are not
supported.

## Reporting a vulnerability

Please report vulnerabilities through GitHub's private vulnerability
reporting for this repository (Security tab > Report a vulnerability).

If private reporting is unavailable, open a brief issue that says you have
found a security issue and asks for a private contact method, without
including exploit details, proof-of-concept code, or anyone's personal
information.

Please do not open a public issue with exploit details.

## Scope

In scope, for example:

- Cross-site scripting (XSS) or code injection through game input, board
  rendering, or the chess move history.
- A way for one game to read or modify another game's `localStorage` data
  beyond what the browser normally allows.
- A vulnerability in the bundled chess rules library (`chess-engine.js`).
  If the issue is in the upstream chess.js project, it should also be
  reported upstream.

Out of scope, for example:

- Reports that the site works offline, or that high scores are stored
  locally in the browser (that is by design).
- Social engineering, phishing, or issues in a visitor's own browser
  or device.

## What happens after a report

This is a solo, non-commercial project, so there is no guaranteed response
time. A report made privately will be reviewed, and a fix will be made on
`main` when one is needed. If a fix changes gameplay, it will be noted in
the pull request that makes the fix.
