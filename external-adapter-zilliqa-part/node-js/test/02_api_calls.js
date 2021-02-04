/* test the calls to get data from web in JSON format */
var assert = require('assert');

const api = require("../scripts/restApiCalls.js");

describe("Calls to fetch data from web through APIs in JSON format", function () {

  it("should get unix time stamp for utc+01:00, i.e. Berlin area", async function() {
    let uxt = 0;
    uxt = await api.getUnixTime();
    console.log(`  .. unix time is ${uxt}`);
    assert(uxt > 0, `unix time still 0 after call to api`);
  });


});
