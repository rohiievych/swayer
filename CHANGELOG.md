# Changelog

## [Unreleased][unreleased]

### Added

- `src` folder to host core project files
- Js-framework-benchmark example for performance tests

### Changed

- Rewrite ReactivityManager: now reactions perform direct updates to DOM bindings without schema reflection
- Update Context API to not read schema props due to reflection removal
- Minor updates in Core, Binding, Reactivity, Styler, Router, Events, Channels, eslint.config.js
- Update Builder and HttpServer according to new `src` folder
- Update examples
- Update dependencies and version to alpha.6

### Removed

- Schema reflection mechanism due to prop descriptor overheads (previously updates were done through schema, but that led to redundant CPU consumption due to lots of property descriptors created to catch schema updates)

## [1.0.0-alpha.5][] - 2023-02-17

### Added

- CLI usage readme section
- New enginePath CLI option for specifying Swayer index.js module

### Changed

- Make CLI options more consistent
- Make basePath handling more stable

## [1.0.0-alpha.4][] - 2023-02-14

### Added

- New basePath CLI option
- Base URI module resolution
- GitHub Pages todo-app workflow for online demo

### Changed

- Replace source /node_modules/swayer path with JSPM CDN url

### Removed

- Deprecate node_modules for frontend build

## [1.0.0-alpha.3][] - 2023-02-13

### Changed

- Update readme code examples
- Optimize starter app icons
- Make LF as default line separator for all files

## [1.0.0-alpha.2][] - 2023-02-12

### Changed

- Improve starter application
- Write learning comments
- Change Telegram links
- Update types

## [1.0.0-alpha.1][] - 2023-02-11

### Added

- Implement initial engine features

[unreleased]: https://github.com/rohiievych/swayer/compare/v1.0.0-alpha.5...HEAD
[1.0.0-alpha.5]: https://github.com/rohiievych/swayer/compare/v1.0.0-alpha.4...v1.0.0-alpha.5
[1.0.0-alpha.4]: https://github.com/rohiievych/swayer/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/rohiievych/swayer/compare/v1.0.0-alpha.2...v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/rohiievych/swayer/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/rohiievych/swayer/releases/tag/v1.0.0-alpha.1
