/* test the basic oracle and the client contract, and the JS functions to deploy and interact */
var assert = require('assert');

const {StringFromFile} = require("../scripts/utils.js");
const {
  setup_chain_and_wallet,
  deploy_contract,
  call_contract} = require("../scripts/utils_zil.js");//const inter = require("./../interact.js");

const { BN, Long, units } = require('@zilliqa-js/util');
const {  getPubKeyFromPrivateKey} = require('@zilliqa-js/crypto');


describe("Oracle and OracleClient", function () {

  const tx_settings = {   // use same settings for all transactions
    "gas_price": units.toQa('5000', units.Units.Li),
    "gas_limit": Long.fromNumber(50000),
    "attempts": Long.fromNumber(10),
  };

  // parameters and variables that are used between tests
  const oracle_id = "TEST0";
  const request_date_string = "2021-01-15";

  let oracle_sc = null; // the contracts loaded from the bc: orcale and the client
  let client_sc = null;
  let data_req_id = -1; // the id of the job the oracle creates
  let pub_key = ''; // public key to send transactions from

  before( function()  { // runt this only once before all tests that follow
    setup = setup_chain_and_wallet(false);
    const priv_key = setup.keys[0];
    pub_key = getPubKeyFromPrivateKey(priv_key);
    setup.zilliqa.wallet.addByPrivateKey(priv_key);
  });

  function str_upper_eq(/*String*/str0, /*String*/str1) {return (str0.toUpperCase() == str1.toUpperCase());} // case insensitive str comparison

  it("should deploy the Oracle, its address should not be empty thereafter and have the correct ID in the init variable", async function() {
    const sc_string = StringFromFile("../../contracts/Oracle0.scilla"); // read scilla contract
    const init = [ // initial parameters for contract at deployment
      { vname: '_scilla_version', type: 'Uint32',   value: '0', },
      { vname: 'oracle_id',       type: 'String',  value: oracle_id, },
    ];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ... >  address of deployed Oracle contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    oracle_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
    const init_chk = await oracle_sc.getInit();
    assert.strictEqual(init_chk[1].value, oracle_id, `id of oracle in oracle's init is wrong: ${init_chk[1].value}`);
    console.log(`  ... > address of deployed Oracle contract instance: ${oracle_sc.address}`);
  });

  it("should deploy the OracleClient and its address should not be empty thereafter", async function() {
    const sc_string = StringFromFile("../../contracts/OracleClient.scilla"); // read scilla contract
    const init = [ { vname: '_scilla_version', type: 'Uint32',   value: '0', },];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ... >  address of deployed OracleClient contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    client_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
    console.log(`   ... > address of deployed OracleClient contract instance: ${client_sc.address}`);
  });

  it("should add the oracle to the Client and it should get back the ID from the oracle and store it correctly", async function() {
    // calling: transition add_oracle(address : ByStr20)
    const args = [ { vname: 'address',  type: 'ByStr20', value: oracle_sc.address, }, ];
    const tx = await call_contract(client_sc, 'add_oracle', args, new BN(0), pub_key, setup, tx_settings);
    const state = await client_sc.getState();
    const oracle_addr_chk = state.oracles[oracle_id];
    assert(str_upper_eq(oracle_addr_chk, oracle_sc.address), `address of oracle with ID ${oracle_id} is wrong: ${oracle_addr_chk}`);
  });

  it("should emit the correct events when the client is called to request data from the oracle with a date string as argument", async function() {
    // calling: transition data_request(id : String, arg: String)
    const args = [
      { vname: 'oracle_id', type: 'String', value: oracle_id, },
      { vname: 'arg',       type: 'String', value: request_date_string, },
    ];
    const tx = await call_contract(client_sc, 'data_request', args, new BN(0), pub_key, setup, tx_settings);
    const tx_rec = tx.receipt;
    assert(tx_rec.success,'calling data_request not successful');
    // check the events
    // was the correct event emitted by the Client?
    //  ev = {_eventname : "data_request"; oracleAddress: addr; argument: arg};
    assert(tx_rec.event_logs[0]._eventname == 'data_request');
    let p = tx_rec.event_logs[0].params;
    assert(str_upper_eq(p[0].value,oracle_sc.address),`oracle address in event is wrong: ${p[0].value}`);
    assert.strictEqual(p[1].value,request_date_string,`date_string in event is wrong: ${p[1].value}`);
    // was the request received by the oracle and did it emit the correct event?
    //  ev = {_eventname : "request"; oracleId: oracle_id; requestId: request_id; initiator: _sender; argument: arg};
    assert(tx_rec.event_logs[1]._eventname == 'request');
    console.log('  ... > event emitted by the oracle when receiving a request for data');
    console.log(tx_rec.event_logs[1]);
    p = tx_rec.event_logs[1].params;
    assert.strictEqual(p[0].value, oracle_id, `id of oracle emitting is wrong: ${p[0].value}`);
    data_req_id = p[1].value
    console.log(`  ... > data request with id ${data_req_id} created in oracle`);
    assert(str_upper_eq(p[2].value, client_sc.address, `initiator is not client but wrong: ${p[2].value}`));
    assert.strictEqual(p[3].value, request_date_string, `argument (date_string) is wrong: ${p[3].value}`);
  });

  it("should send the data to the oracle which should send it to the client, emit the correct events and finally have data stored in client's state", async function() {
    // calling: transition set_data(data: Uint32, request_id: Uint32)
    const data_test_value = 100;
    const args = [
      { vname: 'data',        type: 'Uint32', value: data_test_value.toString(), },
      { vname: 'request_id',  type: 'Uint32', value: data_req_id.toString(), },
    ];
    const tx = await call_contract(oracle_sc, 'set_data', args, new BN(0), pub_key, setup, tx_settings);
    const tx_rec = tx.receipt;
    assert(tx_rec.success,'calling set_data not successful');
    // check the events
    // was the correct event emitted by the Oracle?
    // ev = {_eventname : "set_data"; oracleId: oracle_id; requestId: request_id; data: data};
    assert(tx_rec.event_logs[0]._eventname == 'set_data');
    let p = tx_rec.event_logs[0].params;
    assert.strictEqual(p[0].value,oracle_id,`oracle_id in event is wrong: ${p[0].value}`);
    assert.strictEqual(p[1].value,data_req_id,`data_req_id in event is wrong: ${p[1].value}`);
    assert.strictEqual(p[2].value,data_test_value.toString(),`data in event is wrong: ${p[2].value}`);
    // was the data received by the client and did it emit the correct event?
    //  ev = {_eventname : "callback_data"; oracleId: oracle_id; argument: argument; data: data};
    assert(tx_rec.event_logs[1]._eventname == 'callback_data');
    p = tx_rec.event_logs[1].params;
    assert.strictEqual(p[0].value, oracle_id, `id  of oracle in event is wrong: ${p[0].value}`);
    assert.strictEqual(p[1].value, request_date_string, `argument (date_string) in event is wrong: ${p[1].value}`);
    assert.strictEqual(p[2].value, data_test_value.toString(), `data in event is wrong: ${p[2].value}`);
    // check the data is stored in the clients map all_data (checking its state)
    const state = await client_sc.getState();
    const value = state.all_data[oracle_id][request_date_string];
    assert.strictEqual(value, data_test_value.toString(), `data stored on client for oracle ${oracle_id} on arg=${request_date_string} is wrong: ${value}`);

  });

});
