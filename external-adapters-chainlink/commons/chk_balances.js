/* get balances for all private keys in the keys.js */
const use_testnet = false;

const {setup_chain_and_wallet} = require("./utils_zil.js");

const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');
const { BN, units } = require('@zilliqa-js/util');
const setup = setup_chain_and_wallet(use_testnet);

async function zilBalanceForKey(key, chain, verbose = false)
{
  const addr = getAddressFromPrivateKey(key);
  const balance = await chain.blockchain.getBalance(addr);
  let b_zil = new BN(balance.result.balance);
  b_zil = units.fromQa(b_zil, 'zil');
  if (verbose) {
    console.log(`${addr}: ${b_zil} ZIL`);
  }
  return b_zil;
}

async function chkBalance() {
  try {
    const b = await zilBalanceForKey(setup.privateKey, setup.zilliqa, true);
  }
  catch (err) {
    console.log(err);
  }
}

exports.chkBalance = chkBalance;
exports.zilBalanceForKey = zilBalanceForKey;

chkBalance();
