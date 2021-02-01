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

  const oracle_id = "TEST0";

  let oracle_sc = null; // the contracts loaded from the bc: orcale and the client
  let client_sc = null;
  let pub_key = ''; // public key to send transactions from

  before( function()  { // runt this only once before all tests that follow
    setup = setup_chain_and_wallet(false);
    const priv_key = setup.keys[0];
    pub_key = getPubKeyFromPrivateKey(priv_key);
    setup.zilliqa.wallet.addByPrivateKey(priv_key);
  });

  it("should deploy the Oracle, its address should not be empty thereafter and have the correct ID in the init variable", async function() {
    const sc_string = StringFromFile("../../contracts/Oracle0.scilla"); // read scilla contract
    const init = [ // initial parameters for contract at deployment
      { vname: '_scilla_version', type: 'Uint32',   value: '0', },
      { vname: 'id',              type: 'String',  value: oracle_id, },
    ];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ==> address of deployed Oracle contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    oracle_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
    const init_chk = await oracle_sc.getInit();
    assert.strictEqual(init_chk[1].value, oracle_id, `id in oracle's init is wrong: ${init_chk[1].value}`);
  });

  it("should deploy the OracleClient and its address should not be empty thereafter", async function() {
    const sc_string = StringFromFile("../../contracts/OracleClient.scilla"); // read scilla contract
    const init = [ { vname: '_scilla_version', type: 'Uint32',   value: '0', },];
    const [tx, sc] = await deploy_contract(sc_string, init, setup, tx_settings);
    const addr = sc.address;
    console.log(`  ==> address of deployed OracleClient contract: ${addr}`);
    assert.notStrictEqual(addr,'');
    client_sc = setup.zilliqa.contracts.at(addr); // load the deployed contract from the bc
  });

  it("should add the oracle to the Client and it should get back the ID from the oracle and store it correctly", async function() {


//  async function call_sc( /*contract*/sc, /*string*/transition_name, /*array*/args,
//                          /*BN*/amt_as_BN, /*string*/caller_pub_key, /*JSON*/ bc_setup, /*JSON*/tx_settings)

//    console.log(`address of oracle: ${oracle_sc.address}`);
    const args = [ { vname: 'address',  type: 'ByStr20', value: oracle_sc.address, }, ];
    const tx = await call_contract(client_sc, 'add_oracle', args, new BN(0), pub_key, setup, tx_settings);
    const state = await client_sc.getState();
//    console.log(state);
//    const sub_state = await client_sc.getSubState('oracles');
//    console.log(sub_state);
    const oracle_addr_chk = state.oracles[oracle_id];
//    console.log(oracle_addr_chk);
    assert.strictEqual(oracle_addr_chk.toUpperCase(), oracle_sc.address.toUpperCase(), `address of oracle with ID ${oracle_id} is wrong: ${oracle_addr_chk}`);
  });


});
