/* get balances for all private keys in the keys.js */
const use_testnet = false;

const {setup_chain_and_wallet} = require("./utils_zil.js");

const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, units } = require('@zilliqa-js/util');
const setup = setup_chain_and_wallet(use_testnet);

async function chkBalances() {
  try {
    let i = 0;
    for (i=0; i<setup.keys.length; i++) {
      const addr = getAddressFromPrivateKey(setup.keys[i]);
      const balance = await setup.zilliqa.blockchain.getBalance(addr);
      let b_zil = new BN(balance.result.balance);
      b_zil = units.fromQa(b_zil, 'zil');
      console.log(`${addr}: ${b_zil} ZIL`);
    }
  }
  catch (err) {
    console.log(err);
  }
}

exports.chkBalances = chkBalances;

chkBalances();
