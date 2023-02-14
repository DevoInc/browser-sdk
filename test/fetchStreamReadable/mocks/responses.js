const fs = require('fs');
// use toStrFromTxt to require raw text
const toStrFromTxt = (location) => fs.readFileSync(location, 'utf8');

// fake response with m attribute instead of metadata attribute
const successfulAbbreviated = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulAbbreviated.txt');

// query: "from siem.logtrust.web.activity group by eventdate, username, type"
const successfulComplete1 = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulComplete1.txt');

// fake long response
const successfulLongResponse = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulLongResponse.txt');

// fake medium response
const successfulMediumResponse1 = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulMediumResponse1.txt');

// fake medium response
const successfulMediumResponse2 = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulMediumResponse2.txt');

// query: "from siem.logtrust.web.activity where false"
const successfulNoData = toStrFromTxt('./test/fetchStreamReadable/mocks/responses/successfulNoData.txt');





module.exports = {
  successfulAbbreviated,
  successfulComplete1,
  successfulLongResponse,
  successfulMediumResponse1,
  successfulMediumResponse2,
  successfulNoData,
};
