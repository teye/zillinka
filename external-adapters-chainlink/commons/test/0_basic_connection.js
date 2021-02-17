/* test connection to block chain and set up of accounts */
var assert = require('assert');

const {setup_chain_and_wallet} = require("../utils_zil.js");
const {zilBalanceForKey} = require("../chk_balances.js");

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

  it("should be able to get the balances on testnet and should be non-zero", async function() {
    await chk_for_all_keys(true);
  });

});
