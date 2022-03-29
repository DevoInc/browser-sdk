'use strict';


const credentials = require('../credentials.json')

const options = {
  "dateFrom": "2018-07-02T11:00:00Z",
  "dateTo": "2018-07-02T11:30:30Z",
  "query": "from demo.ecommerce.data select eventdate,protocol,statusCode,method",
};

const client = window.devo.client(credentials);

document.getElementById("btn_launch").onclick = function() {
  document.body.style.cursor = 'progress';
  document.getElementById('divTableBody').innerHTML = "";
  client.stream(options, {
    meta: addHead,
    data: addRow,
    error: error => console.error(error),
    done: () => document.body.style.cursor = 'auto',
  });
}
document.getElementById("btn_xslt").onclick = function() {
  download('xlst')
}
document.getElementById("btn_csv").onclick = function() {
  download('csv')
}
document.getElementById("btn_tsv").onclick = function() {
  download('tsv')
}
document.getElementById("btn_raw").onclick = function() {
  download('raw')
}
document.getElementById("btn_msgpack").onclick = function() {
  download('msgpack')
}
document.getElementById("btn_json").onclick = function() {
  download('json')
}

function download(format) {
  options.format = format
  client.download(options, error => console.error(error))
}

function addRow(event) {
  const body = document.getElementById('divTableBody');
  const tbh = document.createElement('div');
  tbh.className = 'divTableRow';
  const cols = Object.keys(event);
  for (let i = 0; i < cols.length; i++) {
    const td = document.createElement('div');
    td.appendChild(document.createTextNode(event[cols[i]]));
    td.className = 'divTableCell';
    tbh.appendChild(td);
  }
  body.appendChild(tbh)
}

function addHead(event) {
  const body = document.getElementById('divTableBody');
  const tbh = document.createElement('div');
  tbh.className = 'divTableRow divTableHeading';

  Object.keys(event).forEach(key => {
    const td = document.createElement('div');
    td.className = 'divTableHead';
    td.appendChild(document.createTextNode(
      key +
      " (" + event[key].type + ")"));
    tbh.appendChild(td);
  });
  body.appendChild(tbh)
}

