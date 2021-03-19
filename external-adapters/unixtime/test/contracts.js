/* test the oracle and the client smart contracts */
var assert = require('assert');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, Long, units, bytes } = require('@zilliqa-js/util');
const {bc_secrets} = require("../../../secrets/blockchain.js");

async function call_contract(sc, transition_name, args, amt_as_BN,
      caller_pub_key, version, tx_settings)
{
  console.log(`  ... > ... calling transition ${transition_name} ...`);
   const tx = await sc.call(
     transition_name,
     args,
     { version: version, amount: amt_as_BN, gasPrice: tx_settings.gas_price,
       gasLimit: tx_settings.gas_limit, pubKey: caller_pub_key, },
     tx_settings.attempts, 1000, false,
   );
   return tx;
}

describe("Oracle and OracleClient for Unix Time", function () {

  let zilliqa_chain = new Zilliqa(bc_secrets.zilliqa.api);
  const VERSION = bytes.pack(bc_secrets.zilliqa.chainId, bc_secrets.zilliqa.msgVersion);
  const tx_settings = {
    "gas_price": units.toQa('10000', units.Units.Li),
    "gas_limit": Long.fromNumber(100000),
    "attempts": Long.fromNumber(50),
  };


  let oracle_sc = null; // the contracts loaded from the bc: orcale and the client
  let client_sc = null;
  let data_req_id = -1; // the id of the job the oracle creates
  let pub_key = ''; // public key to send transactions from

  before( function()  { // runt this only once before all tests that follow
    pub_key = getPubKeyFromPrivateKey(bc_secrets.privateKey);
    zilliqa_chain.wallet.addByPrivateKey(bc_secrets.privateKey);
  });

  function str_upper_eq(/*String*/str0, /*String*/str1) {return (str0.toUpperCase() == str1.toUpperCase());} // case insensitive str comparison

  it("should load the deployed contracts and their addresses should not be empty thereafter", async function() {
    oracle_sc = zilliqa_chain.contracts.at(bc_secrets.contracts.unixTimeOracle);
    assert.notStrictEqual(oracle_sc.address,'');
    console.log(`  ... > address of deployed Oracle contract instance: ${oracle_sc.address}`);
    client_sc = zilliqa_chain.contracts.at(bc_secrets.contracts.unixTimeOracleClient);
    assert.notStrictEqual(client_sc.address,'');
    console.log(`  ... > address of deployed OracleClient contract instance: ${client_sc.address}`);
  });

  it("should have the correct oracle adress in state of client", async function() {
    const state = await client_sc.getState();
    const oracle_addr_chk = state.oracle_address;
    assert(str_upper_eq(oracle_addr_chk, oracle_sc.address), `address of oracle is wrong: ${oracle_addr_chk}`);
  });

  it("oracle should emit the correct event when the client is called to request data from the oracle", async function() {
    // calling: transition data_request()
    const args = [];
    const tx = await call_contract(client_sc, 'data_request', args, new BN(0), pub_key, VERSION, tx_settings);
    const tx_rec = tx.receipt;
    assert(tx_rec.success,'calling data_request not successful');
    // was the request received by the oracle and did it emit the correct event?
    //  ev = {_eventname : "request"; requestId: request_id; initiator: _sender};
    console.log('  ... > event emitted by the oracle when receiving a request for data');
    console.log(tx_rec.event_logs[0]);
    const name = tx_rec.event_logs[0]._eventname;
    assert.strictEqual(name, 'request', `event name ${name} is wrong`);
    p = tx_rec.event_logs[0].params;
    data_req_id = p[0].value
    console.log(`  ... > data request with id ${data_req_id} created in oracle`);
    assert(str_upper_eq(p[1].value, client_sc.address, `initiator is not client but wrong: ${p[1].value}`));
  });

  it("should send the data to the oracle which should send it to the client, emit the correct events and finally have data stored in client's state", async function() {
    // calling: transition set_data(data: Uint32, request_id: Uint32)
    const data_test_value = 100;
    const args = [
      { vname: 'data',        type: 'Uint128', value: data_test_value.toString(), },
      { vname: 'request_id',  type: 'Uint32', value: data_req_id.toString(), },
    ];
    const tx = await call_contract(oracle_sc, 'set_data', args, new BN(0), pub_key, VERSION, tx_settings);
    const tx_rec = tx.receipt;
    assert(tx_rec.success,'calling set_data not successful');
    // check the events
    // was the data received by the client and did it emit the correct event?
    //  ev = {_eventname : "callback_data"; data_received: data};
    console.log('  ... > event emitted by the client when receiving data in its callback');
    console.log(tx_rec.event_logs[0]);
    assert.strictEqual(tx_rec.event_logs[0]._eventname, 'callback_data', `_eventname is wrong ${tx_rec.event_logs[0]._eventname}`);
    p = tx_rec.event_logs[0].params;
    assert.strictEqual(p[0].value, data_test_value.toString(), `data in event is wrong: ${p[0].value}`);
    // check the data is stored in the clients map all_data (checking its state)
    const state = await client_sc.getState();
    console.log(`  ... > all_data in client`);
    console.log(state.all_data);
    const value = state.all_data[0];
    assert.strictEqual(value, data_test_value.toString(), `data stored on client is wrong: ${value}`);

  });

});
