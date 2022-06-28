# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with some additions:
- For all changes include one of [PATCH | MINOR | MAJOR] with the scope of the change being made.

## [Unreleased]

### Added

### Changed

### Removed

## [0.5.9] - 2022-06-22

### Added
- [MINOR] added more functions to `requester`

## [0.5.8] - 2022-04-05

### Changed
- [MINOR] Updated dependencies

## [0.5.7] - 2021-12-26

### Added
- [MINOR] Updated `browserUtil` and `dateUtil` 

### Changed

- [MINOR] replace `numberUtil.numberWithCommas` to not use regex lookbehind 

## [0.5.6] - 2021-11-21

### Added
- [MINOR] Added `browserUtil`, `stringUtil` and `urlUtil`
- [MINOR] Added `copyFileSync` and `copyDirectorySync` to `fileUtil`

### Changed

- [MINOR] Updated  `browserUtil` for SSR

## [0.5.5] - 2021-07-23

### Changed
- [MINOR] Updated `requester` to not set content-type header for formdata request

### Removed
- [MINOR] Removed `undefined` before converting GET request data to query params

## [0.5.4] - 2021-07-06

### Added
- [MINOR] Updated `Requester` to set `content-type` if not set

### Changed
- [MINOR] Updated pull request template
- [MINOR] Updated `build-js` version

## [0.5.3] - 2021-01-07

### Added
- [MINOR] Updated  `serviceClient` typing

## [0.5.2] - 2020-12-31

### Added
- [MAJOR] Updated CI to include next version deployment + linting + type-check
- [MINOR] Added `publish-next` script


## [0.5.1] - 2020-12-29

### Added
- [MINOR] Updated package metadata and cleaned up pull request template
- [MINOR] Updated dependencies
- [MINOR] Updated type-check in `classNameUtil` and `dateUtil`

## [0.5.0] - 2020-11-25

### Added

Initial Commit - extracted from everypage
