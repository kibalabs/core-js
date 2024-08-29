# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with some additions:
- For all changes include one of [PATCH | MINOR | MAJOR] with the scope of the change being made.

## [Unreleased]

### Added

### Changed

### Removed

## [0.6.2] - 2024-08-29

### Changed
- [MINOR] Added `shouldRemoveTrailingDecimals` and `shouldAddCommas` to `longFormatEther`

## [0.6.1] - 2023-04-11

### Changed
- [MAJOR] Fix for lack of exported files in package

## [0.6.0] - 2023-04-11

### Added
- [MINOR] Added `updateQueryString` to `urlUtil`
- [MINOR] Added `arrayWithRange` to `listUtil`
- [MINOR] Added `getChunks` to `listUtil`
- [MINOR] Added `base64DecodeUnicode` to `stringUtil`
- [MINOR] Added `startOfDay` and `endOfDay` to `dateUtil`

### Changed
- [MAJOR] Updated `chainUtil` to use BigInt instead of BigNumber
- [MINOR] Updated `longFormatNumber` to have new parameters `fractionDigits`, `shouldRemoveTrailingDecimals` and `shouldAddCommas`

## [0.5.10] - 2022-10-11

### Added
- [MINOR] Added `createSearchParams` to `urlUtil`

### Changed
- [MINOR] Updated `Requester` to support multiple values for query params
- [MINOR] Updated `ServiceClient` to expose baseUrl

## [0.5.9] - 2022-06-22

### Added
- [MINOR] Added `makeFormPutRequest` to `requester`
- [MINOR] Added `getRequest`, `posttRequest`, `puttRequest`, `deleteRequest` to `requester`

## [0.5.8] - 2022-04-05

### Added
- [MINOR] Added `dateToRelativeString`, `dateToRelativeShortString` to `dateUtil`
- [MINOR] Added `etherToNumber`, `shortFormatEther`, `longFormatEther` to `chainUtil`
- [MINOR] Added `etherToNumber`, `shortFormatNumber`, `longFormatNumber` to `numberUtil`
- [MINOR] Added `truncateEnd` to `stringUtil`
- [MINOR] Added `resolveUrl` to `urlUtil`

### Changed
- [MINOR] Remove reference to `window` in `Requester` (#22)

## [0.5.7] - 2021-12-26

### Added
- [MINOR] Added `isSameDay`, `isToday`, `isYesterday` to `dateUtil`
- [MINOR] Added `numberWithCommas` to `numberUtil`

### Changed
- [MINOR] Updated `numberUtil.numberWithCommas` to not use regex lookbehind

## [0.5.6] - 2021-11-21

### Added
- [MINOR] Created `browserUtil`, `stringUtil` and `urlUtil`
- [MINOR] Added `copyFileSync`, `copyDirectorySync` to `fileUtil`

### Changed

- [MINOR] Fixed `browserUtil` for SSR

## [0.5.5] - 2021-07-23

### Changed
- [MINOR] Updated `Requester` to not set content-type header for formdata request

## [0.5.4] - 2021-07-06

### Changed
- [MINOR] Updated `Requester` to set `content-type` if not set

## [0.5.3] - 2021-01-07

### Changed
- [MINOR] Updated `serviceClient` typing

## [0.5.2] - 2020-12-31

## [0.5.1] - 2020-12-29

### Changed
- [PATCH] Updated type-check in `classNameUtil` and `dateUtil`

## [0.5.0] - 2020-11-25

### Added

Initial Commit - extracted from everypage
