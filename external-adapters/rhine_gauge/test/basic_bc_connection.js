/* test connection to block chain and set up of account */
var assert = require('assert');
const {bc_secrets} = require("../../../secrets/blockchain.js");

const {setup_chain_and_wallet} = require("../../commons/utils_zil.js");


const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, units } = require('@zilliqa-js/util');

describe("Basic connection to blockchain and set up of account", function () {

  it("should be able to get the balances on testnet and should be non-zero", async function() {
    const key = bc_secrets.privateKey;
    const setup = setup_chain_and_wallet(true);
    const addr = getAddressFromPrivateKey(key);
    const balance = await setup.zilliqa.blockchain.getBalance(addr);
    let b_zil = new BN(balance.result.balance);
    b_zil = units.fromQa(b_zil, 'zil');
    console.log(`  ... > balance of ${addr}: ${b_zil} ZIL`);
    assert(b_zil > 0.0, `balance for key ${key} is not positive`);
  });

});
