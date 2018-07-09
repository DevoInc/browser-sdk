'use strict';

const credentials = {
  url: 'https://api-us.devo.com/search',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
}
const options = {
  "dateFrom": "2018-07-02T11:00:00Z",
  "dateTo": "2018-07-02T11:30:30Z",
  "query": "from demo.ecommerce.data select eventdate,protocol,statusCode,method",
  "destination": {
    type: 'donothing',
    params: {
      topic: 'any'
    }
  },
};

const client = window.devo.client(credentials);

$( document ).ready(function() {
  $("#btn_all").on( "click", function() {
    loadTasks();
  });

  $("#btn_new").on( "click", function() {
    client.query(options)
      .then(loadTasks)
      .catch(console.error)
  });
});

function loadTasks() {
  client.getTasks()
    .then(addTasks)
    .catch(console.error)
}

function addTasks(tasks) {
  $("#divTableBody").html("");
  addHead();
  for (let i=0; i < tasks.object.length; i++) {
    addRow(tasks.object[i]);
  }
}

function addHead() {
  const body = $('#divTableBody');
  const tbh = $('<div></div>').addClass('divTableRow divTableHeading');
  const td = $('<div></div>').addClass('divTableHead');

  tbh.append(td.clone().text("ID"));
  tbh.append(td.clone().text("Status"));
  tbh.append(td.clone().text("LastDatetime"));
  tbh.append(td.text("Options"));

  body.append(tbh);
}

function addRow(event) {
  const body = $('#divTableBody');
  const tbh = $('<div></div>').addClass('divTableRow');

  const td = $('<div></div>').addClass('divTableCell');

  tbh.append(td.clone().text(event.id));
  tbh.append(td.clone().text(event.status));
  tbh.append(td.clone().text(event.lastDatetime));

  td.append(
    $('<button>Start</button>').click(function () {
      client.startTask(event.id)
        .then(data => {
          alert('Started');
          loadTasks();
        })
        .catch(console.error)
    }));

  td.append(
    $('<button>Stop</button>').click(function () {
      client.stopTask(event.id)
        .then(data => {
          alert('Stopped');
          loadTasks();
        })
        .catch(console.error)
    }));

  td.append(
    $('<button>Remove</button>').click(function () {
      client.deleteTask(event.id)
        .then(data => {
          alert('Removed');
          loadTasks();
        })
        .catch(console.error);
    }));

  tbh.append(td);
  body.append(tbh)
}
