# Devo Browser SDK

This is the SDK to access Devo directly from client code in browsers.
It can be used to query Devo, and to manage deferred tasks.

A modern Node.js installation (version 14 or later) is required.

## Quick Start

These steps will allow you to use the SDK right away.
First clone the repo:

```
git clone https://github.com/devoinc/browser-sdk
```

Install all dependencies:

```
cd browser-sdk
npm ci
```

Run the webpack task:

    $ npm run webpack:prod

Now include the generated file `dist/devo-bundle.js` directly in your HTML pages.
You can also minify it or embed it in your software.
From your code invoke `devo` as a global:

```
const client = devo.client(credentials);
// do something with the client
```

## Credentials

There are several ways to use the Devo SDK in the browser.
All of them require a working set of credentials.
You can obtain your API key and API secret from [Devo](https://www.devo.com/):
go to the "Administration/Credentials" section,
and then to
["Access
Keys"](https://docs.devo.com/confluence/docs/system-configuration/relays/credentials#Credentials-AccessKeys).
Alternatively you can get an
API token
instead.
Note: API tokens are only supported on Devo 5.3 or later.

### Initialization

An object containing access credentials must be passed to the constructor.
Example:

``` js
const devo = require('@devoinc/browser-sdk')
const client = devo.client({
  url: 'https://api-us.logtrust.com/search',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
})
```

The `credentials` parameter to `devo.client()` will have the following attributes.

#### `url`

Parameter `url` is the Devo endpoint you want to connect to.
We currently have the following endpoints:

* USA: [https://api-us.logtrust.com/search](https://api-us.logtrust.com/search)
* EU: [https://api-eu.logtrust.com/search](https://api-eu.logtrust.com/search)

#### `apiKey`

API key, obtained from Devo.

#### `apiSecret`

API secret, obtained from Devo.

#### `apiToken`

An alternative to API key and secret,
API tokens are a simple way of authenticating.
They are also obtained from Devo.

## Examples

The
[demo pages](examples/index.html)
show the capabilities of the Devo SDK.
To generate them first clone the repo:

```
git clone https://github.com/devoinc/browser-sdk
```

Install all dependencies:

```
cd browser-sdk
npm install
```

Place your Devo [credentials](#Credentials) in the root of the project
`credentials.json`.
It should look like this:

```json
{
  "url": "https://api-us.logtrust.com/search",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret"
}
```

Then run the task:

    $ npm run webpack:dev

This will generate the examples with the right credentials:
Open this page in a browser in localhost to try out the capabilities in action.

### Installation



To install the SDK use `npm`:

    $ npm install @devoinc/browser-sdk

Place this code including your
[credentials](#Credentials)
in a file called e.g. `credentials.json`:

``` js
const devo = require('@devoinc/browser-sdk')
// create object with credentials
const client = devo.client(credentials)
// do something with the clients
```

``` sh
npm run webpack:prod
```


And finally include the generated file in ```dist/``` in your web page:

```
<script src="mybundle.js"></script>
```

API usage follows.

## Querying

The client can be used to send queries to Devo,
either in regular or streaming mode.

### Simple Querying

Use the function `client.query(options, callback)` to send a query.
It will accept an object with options specifying how the query is performed
(see below),
and will return a promise that will resolve to the query results.
Example:

``` js
const devo = require('@devoinc/browser-sdk')
const client = devo.client(credentials)
client.query({
  query: 'from demo.ecommerce.data select eventdate,protocol,statusCode,method',
  dateFrom: new Date(Date.now() - 60 * 1000),
  dateTo: new Date()
}).then(result => console.log('Received %s', result))
.catch(error => console.error('Query failed: %s', error))
```

The result object will have the following attributes:

* `msg`: an optional message.
* `status`: a status code, 0 means success.
* `object`: an array with one element per data row.

Example result object:

``` json
{
  "msg": "",
  "status": 0,
  "object": [{
    "eventdate": 1519339261018,
    "protocol": "HTTP 1.1",
    "statusCode": 404,
    "method": "POST"
  },{
    "eventdate": 1519339261089,
    "protocol": "HTTP 1.1",
    "statusCode": 200,
    "method": "GET"
  },{
    "eventdate": 1519339261161,
    "protocol": "HTTP 1.1",
    "statusCode": 200,
    "method": "GET"
  }]
}
```

### Streaming

Instead of receiving all results in the promise,
they can be streamed back to the client.

  * Use the function `client.streamFetch(options, callbacks)` to stream back query results in array filled with multiple data objects, parsed in chunks.

It will accept an options parameter (see below)
and a callbacks parameter that will contain four callbacks:

* `data`: callback to receive data rows.
* `meta`: optional callback to receive a custom object with field definitions.
* `error`: optional callback to receive any errors.
* `done`: optional callback to invoke once the streaming has finished.
* `progress`: optional callback to invoke every time a progress event is sent.
* `abort`: optional callback to invoke when query is aborted from client.

The first `data` callback will recieve an object with the data from a row with several fields.
Example data:

``` json
{
  "eventdate": 1519339261018,
  "protocol": "HTTP 1.1",
  "statusCode": 404,
  "method": "POST"
}
```

The `meta` callback will receive an object with field definitions.
Each field will have a `type` and an `index` specifying its position.
Example:

``` json
{
  "eventdate":{"type":"timestamp","index":0},
  "protocol":{"type":"str","index":1},
  "statusCode":{"type":"int8","index":2},
  "method":{"type":"str","index":3}
}
```

where `type` can be one of the following:

* `timestamp`: the number of milliseconds since 1970-01-01T00:00:00Z.
* `str`: a string.
* `int8`: a byte-sized integer.

Full example:

``` js
const devo = require('@devoinc/browser-sdk')
const client = devo.client(credentials)
client.streamFetch({
  query: 'from demo.ecommerce.data select eventdate,protocol,statusCode,method',
  dateFrom: new Date(),
  dateTo: -1
}, {
  meta: data => console.log('Received metadata: %s', data),
  data: data => console.log('Received data: %s', data),
  error: error => console.error('Query failed: %s', error),
  done: () => console.log('Finished receiving query results'),
  progress: () => console.log('Progress event is sent'),
  abort: () => console.log('Abort action made')
})
```

Streaming is mandatory when the ending date is `-1`,
which means that new results will be sent in near real time to the client.

### Download

The utility function `client.download(options)`
directly sends the requested results as a file to the browser.
It also returns a promise to catch for errors.
Example:

``` js
const devo = require('@devoinc/browser-sdk')
const client = devo.client(credentials)
client.download({
  query: 'from demo.ecommerce.data select eventdate,protocol,statusCode,method',
  dateFrom: new Date(Date.now() - 60 * 1000),
  dateTo: new Date(),
  format: 'csv',
}).catch(error => console.error('Download failed: %s', error))
```

### Table

With `client.table(tableName)` method you be able to obtain a table structure (field name and its type).
It also returns a promise to catch for errors.

Example:

```js
const devo = require('@devoinc/browser-sdk')
const client = devo.client(credentials)
client.table('demo.ecommerce.data')
  .then(result => console.log(result.object))
  .catch(error => console.error('Request failed: %s', error))
```


### Query Options

All query functions have the following attributes in the `options` parameter.

#### `query`

String with query to send, in [linq](https://en.wikipedia.org/wiki/Language_Integrated_Query)
format.
Example:

```
from demo.ecommerce.data select eventdate,protocol,statusCode,method
```

#### `queryId`

Alternatively identifies a particular query in the server.

#### `format`

Response format, can be one of:

* `json`: [JSON](https://en.wikipedia.org/wiki/JSON), one object per row of data.
* `json/compact`: a JSON with a header row and an array per row of data.
* `json/simple`: one JSON per row of data separated by newlines. [Spec](http://jsonlines.org/).
* `json/simple/compact`: one JSON for the header and one with an array per row,
same [spec](http://jsonlines.org/).
* `msgpack`: [MessagePack](https://en.wikipedia.org/wiki/MessagePack).
* `xls`: [Microsoft Excel format](https://en.wikipedia.org/wiki/Microsoft_Excel#File_formats).
* `csv`: [comma-separated values](https://en.wikipedia.org/wiki/Comma-separated_values).
* `tsv`: [tab-separated values](https://en.wikipedia.org/wiki/Tab-separated_values).

Default is `json`.
When streaming the format is always `json/compact`.

#### `dateFrom`

Starting date for the query.
Can be either a JavaScript
[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
or a string in ISO-8601 format.
If not present will use the current date.

#### `dateTo`

Ending date for the query.
Can be either a JavaScript
[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
or a string in ISO-8601 format, default is current date.
If not present, or set to the special value `-1`,
it will start a never-ending query that returns results
as they are generated (streaming only).

#### `skip`

Number of registers to skip from the beginning of the query.
Optional parameter.

#### `limit`

Max number of registers to return.
Optional parameter.

#### `destination`

Optional destination for the data:
an object with a given string `type`
and a `params` array.
The special `donothing` type is only used for tests.
Example:

```
client.query({
  query: 'from demo.ecommerce.data select eventdate,protocol,statusCode,method',
  destination: {
    type: 'donothing',
    params: {
      param0: '1',
    },
  },
})
```

When `destination` is present
the server will not return the results in the response.
Instead a task will be created,
the results will be sent to the desired destination
and the response will contain the task ID.
The client can then be used to check the state of the task.

For instance, you may want to stream the results to the Amazon object storage,
AWS S3.
In this case you will send a query with a destination for S3
and the required parameters to authenticate.
The server will reply with the task ID,
and you can query with this ID for completion.
See below for details on task management.

#### `mapMetadata`
*(only for streaming)*

Optional parameter to avoid that events will mapped with its columns and send to `onData` callback the raw event. Default value: true

Example:

**mapMetadata: *true***
```
meta:
  { colA: { index: 0, type: 'int8' }}
rawData:
  [[0], [1]]
onData(ev): 
  ev -> { colA: 0 }
  ev -> { colA: 1 }
  ev -> { colA: 2}
```

**mapMetadata: *false***
```
meta:
  { colA: { index: 0, type: 'int8' }}
rawData:
  [[0], [1]]
onData(ev): 
  ev -> [0]
  ev -> [1]
  ev -> [2]
```


## Task Management

The client is also used for task management.
Tasks are created by sending queries with a `destination`.

### `getTasks()`

Get a list of outstanding tasks from the server.
This includes stopped and removed tasks.

The function returns a promise that will resolve to a list of tasks.

### `getTasksByType(type)`

Get a list of outstanding tasks of the given type.
Returns a promise that will resolve to a list of tasks.

### `getTaskInfo(taskId)`

Get info for the given task.

* Parameter `taskId` identifies the task,
and is returned by the query functions when a `destination` is present.
* Returns a promise for the task info including its status.

### `startTask(taskId)`

Starts the task, if stopped.
If the task was already running will have no effect.
Removed tasks cannot be started.

* Parameter `taskId` identifies the task,
and is returned by the query functions when a `destination` is present.
* Returns a promise for the status of the task.

### `stopTask(taskId)`

Stops the task, if running.
If the task was already stopped will have no effect.
Removed tasks cannot be stopped.

* Parameter `taskId` identifies the task,
and is returned by the query functions when a `destination` is present.
* Returns a promise for the status of the task.

### `deleteTask(taskId)`

Delete the given task.

* Parameter `taskId` identifies the task,
and is returned by the query functions when a `destination` is present.
* Returns a promise for the status of the task.

### Task Lifecycle

Each task has a status at any given point,
which determines what it is doing.
A task starts its life as `created`,
and is changed to `running` when it starts collecting data.
It is then changed to `stopped` when stopped,
and can be changed back to `running` if restarted.
If it is removed then it changes to `removed`.

## Compatibility

The SDK requires [ES2015](http://www.ecma-international.org/ecma-262/6.0/).
It can be used with Babel and other transpilers.

## Development

Clone the repo:

```
git clone https://github.com/devoinc/browser-sdk
```

Install all dependencies:

```
cd browser-sdk
npm install
```

Make sure that everything runs fine:

```
npm test
```

To run manual tests against our integration server run:

```
npm run manualtest
```

Note: you will need to place your [credentials](#credentials) in the file
`/credentials.json`:
just a JSON file that contains the same attributes as the
[initialization](#initialization) parameter.
If needed you can also use environment variables with the file `$HOME/.devo.json`. In the case you have the file `credentials.json` in the root of your project, this will replace the enviroment variables.
 See the Node.js project for more details.

And start playing!
Pull requests are welcome ☺

# Licensed under The MIT License

(C) 2022 Devo, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

