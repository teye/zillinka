const {json_obj} = require("../commons/fetch_json.js");

// current time in unix time format, i.e. seconds since 00:00:00 UTC on 1 January 1970
// for central Europe time zone
async function getUnixTime(verbose = false)
{
  try {
    const url = "http://worldtimeapi.org/api/timezone/Europe/Berlin";
    const obj = await json_obj(url, verbose);
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
