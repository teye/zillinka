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

// Rhine level at kaub station at noon (CET) for a given date in the format yyyy-mm-dd
async function getRhineLevel(/*string*/target_date)
{
  function findValueAtNoon(obj, /*string*/ target_date)
  {
    let v = -1;
    let date_string = '';
    try {
      obj.every( (item, index, array) => {
        const date_time = item.timestamp;
        const ts = date_time.substr(date_time.length - target_time.length);
        date_string = date_time.substr(0, 10);
        if (date_string == target_date && ts == target_time) {
          v = item.value;
          return false;
        }
        else {
          return true;
        }
      });
      if (v>0) {
        return {ds: date_string, value: v};
      }
      else { // no value has been found for target time
        throw Error(`no value found for target time ${target_time} on date ${target_date} (is it past noon already?`);
      }
    } catch (err) {
      throw err;
    }
  }

  const kaub = "1d26e504-7f9e-480a-b52c-5932be6549ab";
  const target_time = "T12:00:00+01:00"; // noon at UTC + 1h, i.e. central europe
  try {
    const station_id = kaub;
    const url =
      "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/"
      + station_id
      + "/W/measurements.json?start="
      + target_date
      + target_time;

    const obj = await json_obj(url);
    const res = findValueAtNoon(obj, target_date);
    return res.value;
  } catch (err) {
    throw Error("Could not get Rhine level at Noon. err is: " + err);
  }
}

exports.getRhineLevel = getRhineLevel;
