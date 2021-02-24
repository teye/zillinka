/* test connection to block chain and set up of accounts */
var assert = require('assert');

const {setup_chain_and_wallet} = require("../../commons/utils_zil.js");
const {zilBalanceForKey} = require("../../commons/chk_balances.js");

describe("Basic connection to blockchain and set up of accounts", function () {

  async function chk_for_key(use_testnet)
  {
    const setup = setup_chain_and_wallet(use_testnet);
    const b = await zilBalanceForKey(setup.privateKey, setup.zilliqa, false);
    assert(b > 0.0, `balance for key ${setup.privateKey} is 0`);
  }

  it("should be able to get the balances on isolated server and should be non-zero", async function() {
    await chk_for_key(false);
  });

  it("should be able to get the balances on testnet and should be non-zero", async function() {
    await chk_for_key(true);
  });

});
