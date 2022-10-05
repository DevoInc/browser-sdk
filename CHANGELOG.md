# Devo Browser SDK

Change log.

## 3.0.5

Make streamFetch available to web workers (since they are not considered as a browser, they have no window object)
Allowed to set output format in stream calls.

## 3.0.4

Fix(node-fetch): wd 11834 fix node fetch vulnerability

## 3.0.3

fix(fetch_stream): WD-11366 fix detection of fetch stream radable native browsers

## 3.0.2

fix(error_fomat): WD-11228 error format in logs

Delete unused files:
* lib/oboeRequest.js
* test/query.js

## Version 3.0.1

Fix outdated README content

## Version 3.0.0

* Replaced `stream` for `streamFetch`, this method, to stream back query, returns data in arrays filled with multiple data objects that have been parsed in chunks. With this change we have noticeably improved the performance, and also made code more secure and efficient.

* Now is required to use Node.js version &ge; 14.0.0 and npm version &ge; 7.0.0


## Version 2.0.0

Move package scope from `@devo` to `@devoinc`

## Version 1.3.3

Remove clutter from package

## Version 1.3.2

Remove travis-ci pipeline and .npmrc

## Version 1.3.1

Upgraded dependencies in order to remove vulnerabilities

## Version 1.3.0

Added `table` method that allows to obtain a table's structure.

## Version 1.2.6

Avoid to map metadata on streaming with the opt-in parameter *mapMetadata*.

## Version 1.2.5

Do not use integration server for tests by default.

## Version 1.2.4

Patch for OboeRequest public methods return this.

## Version 1.2.3

Code cleanup.

## Version 1.2.2

Patch for streaming returns 0.

## Version 1.2.1

Patch the case where streaming returns 200 but status contains 500.

## Version 1.2.0

Added support for `skip` and `limit` options.

## Version 1.1.2

Removed mention of HTTP tokens.

## Version 1.1.1

[Retired]

## Version 1.1.0

* Read test configuration from environment variables.
* Enable Travis-CI continuous integration.

## Version 1.0.1

* Fix bundle generator.
* Improve documentation.

## Version 1.0.0

First public release.

