"use strict";

const { worker } = require("../mocks/setupMockServiceWorker.js");
const q = "from siem.logtrust.web.activityAll select * limit 50000";
const options = {
  dateFrom: "2021-05-06T08:00:00Z",
  dateTo: "2021-05-07T10:00:00Z",
  // "dateFrom": "now()-1m",
  // "dateTo": "now()",
  query: q,
  mapMetadata: false,
  streamMethod: "Fetch stream Fixed",
  vaultName: "low",
};

let client;
let credentials;
window.rows = [];
let length = 0;
let columns = [];
let lastProgressReceived; // this is where we store the query progress
let lockRequest = false;
let start;
let request;
let mswEnabled = false;

function changeInputType(streamMethod) {
  if (isContinuosQuery(streamMethod)) {
    document.getElementById("from-input").type = "text";
    document.getElementById("to-input").type = "text";
  } else {
    document.getElementById("from-input").type = "datetime-local";
    document.getElementById("to-input").type = "datetime-local";
  }
}

function isContinuosQuery(streamMethod) {
  return streamMethod === "Fetch stream Continuous";
}

function setInputDateElements(from, to, streamMethod) {
  let fromValue = from.slice(0, -1);
  let toValue = to.slice(0, -1);
  const $toInput = document.getElementById("to-input");
  const $fromInput = document.getElementById("from-input");
  let toInputReadOnly = false;

  if (isContinuosQuery(streamMethod)) {
    fromValue = options.dateFrom;
    toValue = options.dateTo;
    toInputReadOnly = true;
  }
  $fromInput.value = fromValue;
  $toInput.value = toValue;
  $toInput.readOnly = toInputReadOnly;
}

function registerListeners(BrowserSdk, credentialsParam) {
  client = BrowserSdk.client(credentialsParam);
  credentials = credentialsParam;

  changeInputType(options.streamMethod);
  setInputDateElements(options.dateFrom, options.dateTo, options.streamMethod);

  document.getElementById("query-text").value = options.query;
  document.getElementById("streamMethod").value = options.streamMethod;
  document.getElementById("responseRowFormat").value = options.mapMetadata
    ? "Object data"
    : "Raw data";

  document
    .getElementById("responseRowFormat")
    .addEventListener("change", (event) => {
      options.mapMetadata = event.currentTarget.value === "Object data";
    });
  document.getElementById("from-input").addEventListener("change", (event) => {
    const date = event.currentTarget.value;
    try {
      options.dateFrom = new Date(date).toISOString();
    } catch (e) {
      options.dateFrom = date;
    }
  });
  document.getElementById("to-input").addEventListener("change", (event) => {
    const date = event.currentTarget.value;
    try {
      options.dateTo = new Date(date).toISOString();
    } catch (e) {
      console.error("date input error. Setting dateTo to undefined", e);
      options.dateTo = undefined;
    }
  });
  document.getElementById("query-text").addEventListener("change", (event) => {
    options.query = event.currentTarget.value;
  });
  document
    .getElementById("streamMethod")
    .addEventListener("change", (event) => {
      options.streamMethod = event.currentTarget.value;
      changeInputType(options.streamMethod);
    });

  document.getElementById("btn_launch").onclick = launchRequest;
  document.getElementById("btn_cancel").onclick = cancelRequest;
  document.getElementById("checkToggleMSW").onchange = toggleMockServiceWorker;
}

function cancelRequest() {
  request.abort();
  setLoadingVisible(false);
  lockRequest = false;
}
/**
 * Toggles MockServiceWorker, that mocks the network layer,
 * intercepting network calls to return fake responses.
 * @param {Object} event Dom event
 */
const toggleMockServiceWorker = (event) => {
  mswEnabled = event.target.checked;
  if (mswEnabled) {
    worker.start();
  } else {
    worker.stop();
    // MSW does not show a "disabled" message so we do
    // until my own ticket is finished :)
    // https://github.com/mswjs/msw/issues/485
    console.log("%c[MSW] Mocking disabled.", "color: #FAA");
  }
};

function launchRequest() {
  if (!lockRequest) {
    console.log("starting request");
    lockRequest = false;
    setLoadingVisible(true);
    showMsg("");
    document.getElementById("myGrid").style.width = "100%";
    document.getElementById("myGrid").style.display = "none";

    window.rows = [];
    length = 0;
    lastProgressReceived = null;
    start = window.performance.now();
    let streamMethod;
    switch (options.streamMethod) {
      case "Fetch stream Fixed":
        streamMethod = "streamFetch";
        break;
      case "Fetch stream Continuous":
        streamMethod = "streamFetch";
        options.progressInfo = true;
        break;
      default:
        throw new Error("wrong streamMethod!!");
    }
    request = client[streamMethod](adjustTimeZoneOffset(options), {
      meta: onMeta,
      data: onData,
      error: onError,
      progress: onProgress,
      done: onDone(start),
      abort: onAbort,
    });
  } else {
    console.error(
      "Request in progress, wait until finish to launch another" + " one"
    );
  }
}

function onDone() {
  return function () {
    if (isContinuosQuery(options.streamMethod)) {
      lockRequest = false;
      console.error("Streaming request must not finished");
    } else {
      const end = window.performance.now();
      const timeSpent = (end - start) / 1000;
      showMsg(`
      received ${length} events in ${timeSpent} seconds<br/>
      Query: ${options.query}<br/>
      From: ${options.dateFrom}<br/>
      To: ${options.dateTo}<br/>
      TimeStamp: ${new Date().toISOString()}<br/>
      Server: ${credentials.url}
    `);
    
      setLoadingVisible(false);
      //Clean data
      window.row = undefined;
      lockRequest = false;
    }
  };
}

function setLoadingVisible(visible) {
  document.getElementById("lds-roller-wrapper").style.display = visible
    ? "block"
    : "none";
}

function showError(e) {
  console.error(e);

  // Default message
  let errorMessage = "Unknown error message";

  if (e.jsonBody) {
    // this is a managed error by browser-sdk
    errorMessage = getErrFromJsonBody(e) || errorMessage;
  } else if (e.message) {
    // other kinds of errors not managed by browser-sdk
    errorMessage = e.message;
  }
  document.getElementById("msg").innerHTML = errorMessage;
}

function getErrFromJsonBody(e) {
  const { msg, object } = e.jsonBody;
  let errorMessage = msg;
  if (Array.isArray(object) && object.length >= 2) {
    errorMessage = msg + " <hr> " + object[1];
  }
  return errorMessage;
}

function showMsg(msg, printConsole = true) {
  if (msg && printConsole) {
    console.log(msg);
  }
  document.getElementById("msg").innerHTML = msg;
}

function adjustTimeZoneOffset(options) {
  let dateObject;
  if (isContinuosQuery(options.streamMethod)) {
    dateObject = {
      dateFrom: applyDateOffset(options.dateFrom),
      dateTo: -1,
    };
  } else {
    dateObject = {
      dateFrom: applyDateOffset(options.dateFrom),
      dateTo: applyDateOffset(options.dateTo),
    };
  }
  return Object.assign({}, options, dateObject);
}

function applyDateOffset(date) {
  if (typeof new Date(date).getTime() ===  'number') {
    return new Date(date);
  } else {
    return new Date(
      new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000
    ).toISOString();
  }
}

function showEvent(event) {
  if (isContinuosQuery(options.streamMethod)) {
    showMsg(
      `
      received ${length} events<br/>
      Query: ${options.query}<br/>
      From: ${options.dateFrom}<br/>
      To: ${options.dateTo}<br/>
      TimeStamp: ${new Date().toISOString()}<br/>
      Progress: ${new Date(lastProgressReceived).toISOString()}<br/>
      Server: ${credentials.url}
    `,
      false
    );
  }
}

const onError = (error) => {
  setLoadingVisible(false);
  showError(error);
  lockRequest = false;
};

function onData(event) {
  window.rows = window.rows.concat(event);
  length = window.rows.length;
  showEvent(event);

  if (mswEnabled) {
    fakeAddProcessingTime(length);
  }
}

const fakeAddProcessingTime = (eventsRecieved) => {
  // we can add fake processing here to
  // emulate what the client would do
};

function onMeta(event) {
  if (Array.isArray(event)) {
    // using "metadata" field
    columns = event.map((item) => item.name);
  }
}

function onProgress(event) {
  if (Array.isArray(event) && event.length == 1) {
    lastProgressReceived = event[0];
  }
}

function onAbort() {
  console.log("Recieved onAbort event");
}

module.exports = {
  registerListeners,
  getRows: () => window.rows,
  getColumns: () => columns,
};
