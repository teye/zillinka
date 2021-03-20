var assert = require('assert');
const api = require("../restApiCall.js");

describe("Fetch unixt time from web through API in JSON format", function () {

  it("should get unix time stamp for utc+01:00, i.e. Berlin area", async function() {
    let uxt = 0;
    uxt = await api.getUnixTime();
    console.log(`  ... > unix time is ${uxt}`);
    assert(uxt > 0, `unix time still 0 after call to api`);
  });

});
