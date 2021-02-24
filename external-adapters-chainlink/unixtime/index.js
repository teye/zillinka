/* To run the curl request to get  unixtime
[..]/unixtime/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/unixtime/$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "reqID": 0} }'
  {"jobRunID":0,"data":{"abbreviation":"CET","client_ip":"85.5.161.167","datetime":"2021-02-12T12:07:21.611838+01:00","day_of_week":5,"day_of_year":43,"dst":false,"dst_from":null,"dst_offset":0,"dst_until":null,"raw_offset":3600,"timezone":"Europe/Berlin","unixtime":1613128041,"utc_datetime":"2021-02-12T11:07:21.611838+00:00","utc_offset":"+01:00","week_number":6,"result":1613128041},"result":1613128041,"statusCode":200}drbee@XPS-13-7390-cerchia:~/dev/gh-zillinka/external-adapter-chainlink-part$
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
  reqID: ['requestID', 'reqID', 'rID'] // the id assigned by the oracle contract for this current request
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const url = 'http://worldtimeapi.org/api/timezone/Europe/Berlin'
  const reqID = validator.validated.data.reqID
  const params = { reqID }

  const config = {
    url,
    params
  }

  // FMB zilliqa bc stuff
  const use_testnet = false;
  const bc_setup = setup_chain_and_wallet(use_testnet); // which chain to use, fill wallet, etc
  const oracle_address = bc_setup.addresses.UnixTimeOracle;
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
      response.data.result = Requester.validateResultNumber(response.data, ["unixtime"]) // FMB: extract unixtime from json
      callback(response.status, Requester.success(jobRunID, response));

      // FMB: Take the result and send it to Zilliqa oracle contract
      const uxt = response.data.result;
      console.log(` ===> unix time is ${uxt}`);
      return new Promise(function(resolve, reject) {
        if (uxt > 0) {
          resolve(uxt);
        }
        else {
          reject('unix time not positive')
        }
      });
    })
    .then( uxt => { // call the contract on chain to write the uxt on chain:
      // transition set_data(data: Uint128, request_id: Uint32)
      console.log(` ===> calling set_data(${uxt}, ${config.params.reqID}) to write to oracle contract @  ${oracle_sc.address}`);
      const tx_settings = {   // use same settings for all transactions
        "gas_price": units.toQa('5000', units.Units.Li),
        "gas_limit": Long.fromNumber(50000),
        "attempts": Long.fromNumber(25),
      };
      const args = [
        { vname: 'data',      type: 'Uint128',  value: uxt.toString() },
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
      console.log(` ====> in oracle state: value field of entry in DataRequest map for request with id = ${config.params.reqID}`)
      console.log(state.data_requests[config.params.reqID].arguments[1])
    })
    .then( )
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
