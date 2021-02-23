/* To run the curl request to get  unixtime
[..]/unixtime/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/unixtime/$ yarn$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { } }'
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
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  // FMB set endpoint to  Berlin time zone in url below (fix)
}

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  //const endpoint = validator.validated.data.endpoint || 'price'
  // FMB Change the address to url from unix time api
  const url = 'http://worldtimeapi.org/api/timezone/Europe/Berlin'
  // FMB no need for paameters for this request
//  const fsym = validator.validated.data.base.toUpperCase()
//  const tsyms = validator.validated.data.quote.toUpperCase()

  const params = {
    // FMB no params needed, ural has no '?p1=P1&p2=P2&...'
//    fsym,
//    tsyms
  }

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const config = {
    url,
    params
  }

  // FMBzilliqa bc stuff : get from curl parameter later
  const use_testnet = false;
  const receiver_address = "0xf3f162e733ab3fd5cae72fc1b9eb89355c671b46"; // where smart contract is on chain
  const bc_setup = setup_chain_and_wallet(use_testnet); // which chain to use, fill wallet, etc
  const pub_key = getPubKeyFromPrivateKey(bc_setup.privateKey);
  bc_setup.zilliqa.wallet.addByPrivateKey(bc_setup.privateKey);
  const receiver_sc = bc_setup.zilliqa.contracts.at(receiver_address); // load contract from chain
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
    .then( uxt => { // call the contract on chain to write the uxt on chain
      console.log(` ===> calling set() with the unix time ${uxt} to write to contract @  ${receiver_sc.address}`);

      const tx_settings = {   // use same settings for all transactions
        "gas_price": units.toQa('5000', units.Units.Li),
        "gas_limit": Long.fromNumber(50000),
        "attempts": Long.fromNumber(10),
      };
      const args = [ { vname: 'data',  type: 'Uint128', value: uxt.toString() } ];
      return call_contract(receiver_sc, 'set', args, new BN(0), pub_key, bc_setup, tx_settings);
/*      return receiver_sc.call(
        'set',
         args,
        { version: bc_setup.VERSION, amount: new BN(0), gasPrice: tx_settings.gas_price,
          gasLimit: tx_settings.gas_limit, pubKey: pub_key, },
          tx_settings.attempts, 1000, false,
      );
*/
    })
    .then( (tx) => {
      if (tx.receipt.success) {
        console.log(` ====> tx successful: querying state`);
        return receiver_sc.getState();
      }
      else {
        console.log(` ====> tx NOT successful`);
      }
    })
    .then( (state) => {
      console.log(" ====> state of contract after having called set(.) is: ")
      console.log(state)
    })
    .then( )
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
