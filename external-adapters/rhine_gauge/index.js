/* To run the curl request to get Rhine Pegel level at Kaub station at noon of a given date
[..]/rhine_gauge/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/rhine_gauge/$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "requestId": 0, "date": "2021-03-12"} }'
  {"jobRunID":0,"data":[{"timestamp":"2021-02-23T12:00:00+01:00","value":256}, ...,
  ....,{"timestamp":"2021-02-24T13:45:00+01:00","value":247}],"result":256,"statusCode":200}
*/

const { Requester, Validator } = require('@chainlink/external-adapter')
const { Zilliqa } = require('@zilliqa-js/zilliqa')
const {  getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto')
const { BN, Long, units, bytes } = require('@zilliqa-js/util');
const {JSONPath} = require('jsonpath-plus');
const {bc_secrets} = require("./secrets/blockchain.js");

// set up zilliqa bc
let zilliqa_chain = new Zilliqa(bc_secrets.zilliqa.api);
zilliqa_chain.wallet.addByPrivateKey(bc_secrets.privateKey);
const oracle_sc = zilliqa_chain.contracts.at(bc_secrets.contracts.oracle);
const version = bytes.pack(bc_secrets.zilliqa.chainId, bc_secrets.zilliqa.msgVersion);

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// Define custom parameters to be used by the adapter.
const customParams = {
  requestId: ['requestId'], // the id assigned by the oracle contract for this current request
  date: ['date'] // the target date for the gauge level at noon in format "yyyy-mm-dd"
}

// extract specific entry from JSON object received as response for a given date at 12:00:00 (ignoring the UTC offset)
function findValueAtNoon(obj, /*string*/ target_date)
{
  let v = -1;
  let date_string = ''; // of the form 2021-03-17
  let time_string = ''; // of the form T23:00:14
  const target_time_string = "T12:00:00"; // without UTC offset
  try {
    obj.every( (item, index, array) => {
      const date_time = item.timestamp;
      date_string = date_time.substr(0, 10);
      time_string = date_time.substr(10, target_time_string.length); // allows to only compare, e.g., the hours or only hours and minutes
      if (date_string == target_date && time_string == target_time_string) {
        v = item.value;
        return false;
      }
      else {
        return true;
      }
    });
    if (v>0) {
      return {date: date_string, value: v};
    }
    else { // no value has been found for target time
      throw Error(`no value found for target time ${target_time_string} on date ${target_date} (is it past noon already?`);
    }
  } catch (err) {
    throw err;
  }
}
const createRequest = (input, callback) => {
  console.log(` ====> Request: = `);
  console.log(JSON.stringify(input));

  const validator = new Validator(callback, input, customParams)

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date
  const station_id = "1d26e504-7f9e-480a-b52c-5932be6549ab"; // Kaub
  const time = "T12:00:00+02:00"; // get levels since noon at UTC + 2h, i.e. central europe standard time
  const url =
    "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/"
    + station_id
    + "/W/measurements.json?start="
    + date
    + time;
  const requestId = validator.validated.data.requestId
  const params = { requestId, date }

  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      const entry = findValueAtNoon(response.data, params.date); // extract value at noon on target date
      response.data.result = Requester.validateResultNumber(entry, ["value"]);
      callback(response.status, Requester.success(jobRunID, response));

      // FMB: Take the result and send it to Zilliqa oracle contract
      const level = response.data.result;
      console.log(` ===> Rhine level on ${params.date} at noon is ${level}`);
      return new Promise(function(resolve, reject) {
        if (level > 0) {
          resolve(level);
        }
        else {
          reject('level not positive')
        }
      });
    })

    .then( level => { // call the contract on chain to write the uxt on chain:
      const args = [
        { vname: 'data',      type: 'Uint128',  value: level.toString() },
        { vname: 'request_id', type: 'Uint32',   value: config.params.requestId.toString()},
     ];
     const gas_price = units.toQa('10000', units.Units.Li);
     const gas_limit = Long.fromNumber(100000);
     const attempts = Long.fromNumber(50);
     const pub_key = getPubKeyFromPrivateKey(bc_secrets.privateKey);
     console.log(` ===> calling set_data(${level}, ${config.params.requestId}) to write to oracle contract @  ${oracle_sc.address}`);

     return oracle_sc.call(
       'set_data',
       args,
       { version: version, amount: new BN(0), gasPrice: gas_price,
         gasLimit: gas_limit, pubKey: pub_key, },
      attempts, 1000, true,
     );
    })
    .then( (tx) => {
      return new Promise(function(resolve, reject) {
        if (typeof tx === 'undefined' ||tx === null) {
          console.log(` ====> tx NOT successful`);
          reject('tx is not defined or null');
        }
        else if (!tx.receipt.success) { // if not successful, log output
          console.log(` ====> tx NOT successful: tx = `);
          console.log(tx);
          console.log('errors');
          console.log(tx.receipt.errors);
          console.log('exceptions');
          console.log(tx.receipt.exceptions);
          reject(`tx.receipt.success is ${tx.receipt.success}`);
        }
        else {
          console.log(` ====> tx successful: querying state`);
          resolve(oracle_sc.getState());
        }
      });
    })
    .then( (state) => {
      console.log(` ====> in oracle state: entry in DataRequest map for request with id = ${config.params.requestId}`);
      const entry = state.data_requests[config.params.requestId];
      console.log(`       pegel level is: ${entry.arguments[2].arguments[0]}`);
    })
    .then( )
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
