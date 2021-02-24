/* To run the curl request to get Rhine Pegel level at Kaub station at noon of a given date
[..]/rhine_gauge/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/rhine_gauge/$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "reqID": 0, "dateString": "2021-02-23"} }'
  {"jobRunID":0,"data":[{"timestamp":"2021-02-23T12:00:00+01:00","value":256}, ...,
  ....,{"timestamp":"2021-02-24T13:45:00+01:00","value":247}],"result":256,"statusCode":200}
*/

const { Requester, Validator } = require('@chainlink/external-adapter')
const {  getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, Long, units } = require('@zilliqa-js/util');
const { setup_chain_and_wallet, call_contract} = require('../commons/utils_zil.js')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// Define custom parameters to be used by the adapter.
const customParams = {
  reqID: ['requestID', 'reqID', 'rID'], // the id assigned by the oracle contract for this current request
  ds: ['dateString', 'ds'] // the target date for the gauge level at noon in format "yyyy-mm-dd"
}

// extract specific entry from JSON object received as response for a given date and a given time
function findValueAtTime(obj, target_date, target_time)
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

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const date = validator.validated.data.ds
  const station_id = "1d26e504-7f9e-480a-b52c-5932be6549ab"; // Kaub
  const time = "T12:00:00+01:00"; // noon at UTC + 1h, i.e. central europe
  const url =
    "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/"
    + station_id
    + "/W/measurements.json?start="
    + date
    + time;
  const reqID = validator.validated.data.reqID
  const params = { reqID, date, time }

  const config = {
    url,
    params
  }

  // FMB zilliqa bc stuff
  const use_testnet = false;
  const bc_setup = setup_chain_and_wallet(use_testnet); // which chain to use, fill wallet, etc
  const oracle_address = bc_setup.addresses.RhineGaugeOracle;
  const pub_key = getPubKeyFromPrivateKey(bc_setup.privateKey);
  bc_setup.zilliqa.wallet.addByPrivateKey(bc_setup.privateKey);
  const oracle_sc = bc_setup.zilliqa.contracts.at(oracle_address);
  const gas_price = units.toQa('5000', units.Units.Li);
  const gas_limit = Long.fromNumber(50000);
  const attempts = Long.fromNumber(10);


  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      const entry = findValueAtTime(response.data, params.date, params.time);
      response.data.result = Requester.validateResultNumber(entry, ["value"]);
      callback(response.status, Requester.success(jobRunID, response));
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
    // FMB: Take the result and send it to Zilliqa oracle contract
    .then( level => { // call the contract on chain to write the uxt on chain:
      // transition set_data(data: Uint128, request_id: Uint32)
      console.log(` ===> calling set_data(${level}, ${config.params.reqID}) to write to oracle contract @  ${oracle_sc.address}`);
      const tx_settings = {   // use same settings for all transactions
        "gas_price": units.toQa('5000', units.Units.Li),
        "gas_limit": Long.fromNumber(50000),
        "attempts": Long.fromNumber(25),
      };
      const args = [
        { vname: 'data',      type: 'Uint128',  value: level.toString() },
        { vname: 'request_id', type: 'Uint32',   value: config.params.reqID.toString()},
     ];
      return call_contract(oracle_sc, 'set_data', args, new BN(0), pub_key, bc_setup, tx_settings);
    })
    .then( (tx) => {
      return new Promise(function(resolve, reject) {
        function r(msg) {

        }
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
      console.log(` ====> in oracle state: entry in DataRequest map for request with id = ${config.params.reqID}`);
      const entry = state.data_requests[config.params.reqID];
      console.log(`       date is: ${entry.arguments[1]}`);
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
