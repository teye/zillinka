/* To run the curl request to get  unixtime
[..]/unixtime/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/unixtime/$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "requestId": 0} }'
  {"jobRunID":0,"data":{"abbreviation":"CET","client_ip":"85.5.161.167","datetime":"2021-02-12T12:07:21.611838+01:00","day_of_week":5,"day_of_year":43,"dst":false,"dst_from":null,"dst_offset":0,"dst_until":null,"raw_offset":3600,"timezone":"Europe/Berlin","unixtime":1613128041,"utc_datetime":"2021-02-12T11:07:21.611838+00:00","utc_offset":"+01:00","week_number":6,"result":1613128041},"result":1613128041,"statusCode":200}drbee@XPS-13-7390-cerchia:~/dev/gh-zillinka/external-adapter-chainlink-part$
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
  requestId: ['requestId'] // the id assigned by the oracle contract for this current request
}

const createRequest = (input, callback) => {
  console.log(` ====> Request: = `);
  console.log(JSON.stringify(input));

  const validator = new Validator(callback, input, customParams)

  const jobRunID = validator.validated.id
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=zilliqa&vs_currencies=usd'
  const requestId = validator.validated.data.requestId
  const params = { requestId }

  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ["zilliqa", "usd"])
      console.log("api call: %o\n", response.data);
      callback(response.status, Requester.success(jobRunID, response));

      // Take the result and send it to Zilliqa oracle contract
      const price = response.data.result;
      console.log(` ===> price is ${price}`);
      return new Promise(function(resolve, reject) {
        if (price > 0) {
          resolve(price);
        }
        else {
          reject('price is negative')
        }
      });
    })
    .then( price => { // call the contract on chain to write the price on chain:
      const args = [
        { vname: 'data',      type: 'String',  value: price.toString() },
        { vname: 'request_id', type: 'Uint32',   value: config.params.requestId.toString()},
      ];
      console.log("HERE");
      const gas_price = units.toQa('2000', units.Units.Li);
      const gas_limit = Long.fromNumber(10000);
      const attempts = Long.fromNumber(33);
      const pub_key = getPubKeyFromPrivateKey(bc_secrets.privateKey);
      console.log(` ===> calling set_data(${price}, ${config.params.requestId}) to write to oracle contract @  ${oracle_sc.address}`);

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
      console.log(` ====> in oracle state: value field of entry in DataRequest map for request with id = ${config.params.requestId}`)
      console.log(state.data_requests[config.params.requestId].arguments[1])
    })
    .then( )
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
