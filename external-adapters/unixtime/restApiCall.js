const fetch = require('isomorphic-fetch');

async function json_obj(url)
{
  try {
    const response = await fetch(url);
    const json = await response.json();
    const str = JSON.stringify(json);
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
      throw Error("Could not get json from web API. err is: " + err);
  }
}

// current time in unix time format, i.e. seconds since 00:00:00 UTC on 1 January 1970
async function getUnixTime()
{
  try {
    const url = "http://worldtimeapi.org/api/timezone/Europe/Berlin";
    const obj = await json_obj(url);
    const uxt = obj.unixtime;
    return uxt;
  } catch (err) {
      throw Error("Could not get unix time through json from web API. err is: " + err);
  }
}

exports.getUnixTime = getUnixTime;
