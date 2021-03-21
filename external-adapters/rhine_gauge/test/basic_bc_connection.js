/* test connection to block chain and set up of account */
var assert = require('assert');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, units } = require('@zilliqa-js/util');
const {bc_secrets} = require("../secrets/blockchain.js");

describe("Basic connection to blockchain and set up of account", function () {

  it("should be able to get the balances on testnet and should be non-zero", async function() {
    const key = bc_secrets.privateKey;
    const zilliqa_chain = new Zilliqa(bc_secrets.zilliqa.api);
    const addr = getAddressFromPrivateKey(key);
    const balance = await zilliqa_chain.blockchain.getBalance(addr);
    let b_zil = new BN(balance.result.balance);
    b_zil = units.fromQa(b_zil, 'zil');
    console.log(`  ... > balance of ${addr}: ${b_zil} ZIL`);
    assert(b_zil > 0.0, `balance for key ${key} is not positive`);
  });

});
