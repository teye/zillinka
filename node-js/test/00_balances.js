/* test connection to block chain and set up of accounts */
var assert = require('assert');

const {setup_chain_and_wallet} = require("../scripts/utils_zil.js");
const {zilBalanceForKey} = require("../scripts/chkBalances.js");

//const { BN, Long, units } = require('@zilliqa-js/util');
//const { Zilliqa } = require('@zilliqa-js/zilliqa');
//const {
//  toBech32Address,
//  getAddressFromPrivateKey,
//} = require('@zilliqa-js/crypto');
const { stat } = require('fs');




describe("Basic connection to blockchain and set up of accounts", function () {

  async function chk_for_all_keys(use_testnet)
  {
    const setup = setup_chain_and_wallet(use_testnet);
    for (i=0; i<setup.keys.length; i++) {
      const b = await zilBalanceForKey(setup.keys[i], setup.zilliqa, false);
      assert(b > 0.0, `balance for key ${setup.keys[i]} is 0`);
    }
}

  it("should be able to get the balances on isolated server and should be non-zero", async function() {
    await chk_for_all_keys(false);
  });

  it("should be able to get the balances on testnet should be non-zero", async function() {
    await chk_for_all_keys(true);
  });

});
