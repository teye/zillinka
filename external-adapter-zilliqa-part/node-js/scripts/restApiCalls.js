/*
  get data from web through rest apis providing it in JSON format
  need node-js package:
  siclla/node-js> npm install isomorphic-fetch es6-promise
*/

const fetch = require('isomorphic-fetch');
const utils = require("./utils.js");

const kaub = "1d26e504-7f9e-480a-b52c-5932be6549ab";
const koeln = "a6ee8177-107b-47dd-bcfd-30960ccc6e9c";

// current time in unix time format, i.e. seconds since 00:00:00 UTC on 1 January 1970
async function getUnixTime(verbose = false) {
  try {
    const url = "http://worldtimeapi.org/api/timezone/Europe/Berlin";
    const response = await fetch(url);
    const json = await response.json();
    const str = JSON.stringify(json);
    if (verbose) {
      console.log(`  JSON as string received:\n   ${str}`);
    }
    const obj = JSON.parse(str);
    const uxt = obj.unixtime;
    if (verbose) {
      console.log(`  .. unix time is: ${uxt}`);
    }
    return uxt;
  } catch (err) {
      throw Error("Could not get unix time through json from web API. err is: " + err);
  }
}


exports.getUnixTime = getUnixTime;

//getUnixTime(true);
