/* test the oracle and the client contract, and the JS functions to deploy and interact */
var assert = require('assert');

const {StringFromFile} = require("../../commons/utils.js");
const {
  setup_chain_and_wallet,
  deploy_contract,
  call_contract} = require("../../commons/utils_zil.js");//const inter = require("./../interact.js");

const { BN, Long, units } = require('@zilliqa-js/util');
const {  getPubKeyFromPrivateKey} = require('@zilliqa-js/crypto');

describe("Oracle and OracleClient for Unix Time", function () {

  const tx_settings = {   // use same settings for all transactions
    "gas_price": units.toQa('5000', units.Units.Li),
    "gas_limit": Long.fromNumber(50000),
    "attempts": Long.fromNumber(10),
  };


  let oracle_sc = null; // the contracts loaded from the bc: orcale and the client
  let client_sc = null;
  let data_req_id = -1; // the id of the job the oracle creates
  let pub_key = ''; // public key to send transactions from

  before( function()  { // runt this only once before all tests that follow
    setup = setup_chain_and_wallet(false);
    pub_key = getPubKeyFromPrivateKey(setup.privateKey);
    setup.zilliqa.wallet.addByPrivateKey(setup.privateKey);
  });

  function str_upper_eq(/*String*/str0, /*String*/str1) {return (str0.toUpperCase() == str1.toUpperCase());} // case insensitive str comparison

  it("should deploy the Oracle, its address should not be empty thereafter", async function() {
    const sc_string = StringFromFile("Oracle.scilla"); // read scilla contract
    const init = [ { vname: '_scilla_version', type: 'Uint32',   value: '0', } ];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ... > address of deployed Oracle contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    oracle_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
    console.log(`  ... > address of deployed Oracle contract instance: ${oracle_sc.address}`);
  });

  it("should deploy the OracleClient and its address should not be empty thereafter, and have oracle adress in state", async function() {
    const sc_string = StringFromFile("OracleClient.scilla"); // read scilla contract
    const init = [
      { vname: '_scilla_version',               type: 'Uint32',   value: '0', },
      { vname: 'oracle_address_at_deployment',  type: 'ByStr20',  value: oracle_sc.address },
    ];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ... >  address of deployed OracleClient contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    client_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
    console.log(`   ... > address of deployed OracleClient contract instance: ${client_sc.address}`);
    const state = await client_sc.getState();
    const oracle_addr_chk = state.oracle_address;
    assert(str_upper_eq(oracle_addr_chk, oracle_sc.address), `address of oracle is wrong: ${oracle_addr_chk}`);
  });

  it("oracle should emit the correct event when the client is called to request data from the oracle", async function() {
    // calling: transition data_request()
    const args = [];
    const tx = await call_contract(client_sc, 'data_request', args, new BN(0), pub_key, setup, tx_settings);
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
    const tx = await call_contract(oracle_sc, 'set_data', args, new BN(0), pub_key, setup, tx_settings);
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
