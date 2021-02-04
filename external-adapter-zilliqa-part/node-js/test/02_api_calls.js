/* test the calls to get data from web in JSON format */
var assert = require('assert');

const api = require("../scripts/restApiCalls.js");

describe("Calls to fetch data from web through APIs in JSON format", function () {

  it("should get unix time stamp for utc+01:00, i.e. Berlin area", async function() {
    let uxt = 0;
    uxt = await api.getUnixTime();
    console.log(`   .. unix time is ${uxt}`);
    assert(uxt > 0, `unix time still 0 after call to api`);
  });

  it("should get the Rhine pegel level yesterday at noon", async function () {
    const d = new Date(Date.now() - 86400000);
    const yesterday = d.toISOString().substring(0,10); // yesterday in format yyyy-mm-dd
    let level = 0;
    level = await api.getRhineLevel(yesterday);
    console.log(`   .. level of Rhine on ${yesterday} at noon is: ${level}`);
    assert(level > 0, `level still 0 after call to api`);
  });

});
