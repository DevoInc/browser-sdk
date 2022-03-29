/**
 * This initialEventDate is used as first eventDate. Next events will have a posterior eventdate
 * */ 
const initialEventDate = 1601894800300;
/**
 * These fake events have a newline delimiter at the end to mock the real data from serrea
 * */ 
const meta = `{"m":{"eventdate":{"type":"timestamp","index":0},"username":{"type":"str","index":1},"type":{"type":"str","index":2},"username2":{"type":"str","index":3},"type2":{"type":"str","index":4}},"metadata":[{"name":"eventdate","type":"timestamp"},{"name":"username","type":"str"},{"name":"type","type":"str"},{"name":"username2","type":"str"},{"name":"type2","type":"str"}]}
`;
const createDataEvent = (timestamp) => `{"d":[${timestamp},"fake@email.com","request","GET","blabla"]}
`;
const createProgressEvent = (timestamp) => `{"p":[${timestamp}]}
`;

/**
 * Create fake response data
 * @param {Object} options with:
 *  dataLines: number of data events that will be created
 *  addProgressEvery: will add a progress event every x data events
 */
const createResponseData = ({dataLines = 100, addProgressEvery = 150}) => {
    if (dataLines < 1 || addProgressEvery < 0) {
        throw new Error('dataLines must be > 0 and addProgressEvery must be >= 0');
    }
    let resp = meta;
    let timestampForEvent = initialEventDate;
    for (let i = 0; i < dataLines; i++) {
        // generate data events, each event with a different eventdate
        const nextEventDate = timestampForEvent + i * 103;
        resp += createDataEvent(nextEventDate);
        if (i % addProgressEvery == 0) {
            // generate progress events every x data events 
            resp += createProgressEvent(nextEventDate);
        }

    }
    return resp;
}

const dataHandler = data => (req, res, ctx) => {
    return res(ctx.body(data));
};
const generateResponse = dataHandler(createResponseData({dataLines:100000}));
module.exports = {
    generateResponse
}