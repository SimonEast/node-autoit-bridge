# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.0](https://github.com/SimonEast/node-autoit-bridge/compare/v1.1.0...v1.2.0) (2026-08-14)

### Features

* New `config.debug` option ([dfe087e](https://github.com/SimonEast/node-autoit-bridge/commit/dfe087e17fb0f93c3280778baf22f24ee1a73181))

### Bug Fixes

* Special UTF-8 characters and `undefined` are now passed through correctly ([60a1f93](https://github.com/SimonEast/node-autoit-bridge/commit/60a1f93ac188b30a05b619c14b5cc67df6c81f90))
## [1.1.0](https://github.com/SimonEast/node-autoit-bridge/compare/877b180023e1e2cb59f4477612feb8a4af7c7643...v1.1.0) (2026-07-14)

### ⚠ BREAKING CHANGES

* All functions are now fully asynchronous

### Features

* All functions are now fully asynchronous ([2d842bf](https://github.com/SimonEast/node-autoit-bridge/commit/2d842bfeb0ef448b4c7857d7ef9a59a1772b2cfc))
* Now throws exceptions properly when AutoIt script fails ([de7ba1d](https://github.com/SimonEast/node-autoit-bridge/commit/de7ba1dbffd3bc587eb6004f188c68bec4829361))
* Now using `execFile` instead of `exec`, which is safer (less prone to injections) and slightly faster ([7dd5862](https://github.com/SimonEast/node-autoit-bridge/commit/7dd5862e96c1e90054577311b02886e7d35d3c7d))
* Now working with multi-line string as parameters and return values. Also added vitest tests. ([877b180](https://github.com/SimonEast/node-autoit-bridge/commit/877b180023e1e2cb59f4477612feb8a4af7c7643))

### Bug Fixes

* Arrays and Maps (objects) work nicely, and are included in test suite ([665bb63](https://github.com/SimonEast/node-autoit-bridge/commit/665bb6368325958b8d37c621d266ff88da237937))
* Patched json.au3 to keep `CRLF` as `\r\n` ([7d9ccb9](https://github.com/SimonEast/node-autoit-bridge/commit/7d9ccb9ea68e7997bf891c93f1cea132181ff161))
