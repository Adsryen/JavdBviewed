# Security Policy

## Supported Versions

Security fixes target the latest released version and the current `main` branch.

## Reporting a Vulnerability

Please report security issues privately by opening a GitHub Security Advisory for this repository.

Include:

- Affected version or commit
- Browser and operating system
- Steps to reproduce
- Impact and affected data
- Screenshots, logs, or proof of concept when safe to share

Please avoid posting exploitable details in public issues before a fix is available.

## Sensitive Areas

Security-sensitive changes include:

- WebDAV sync, backup, and restore
- 115 integration and authentication flows
- Password, lock screen, recovery, and privacy blur features
- IndexedDB and Chrome Storage migrations
- External network requests and proxy routes
- Import/export of user data

## Maintainer Response

Maintainers should acknowledge valid private reports, assess impact, prepare a fix, and publish release notes that describe user impact and upgrade guidance.
