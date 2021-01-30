const key = require("./keys.js"); // private keys
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { bytes } = require('@zilliqa-js/util');

function setup_chain_and_wallet(/*bool*/testnet)
{
  let zilliqa_chain = null;
  let chainId = 0;
  let privateKeys = '';
  if (testnet) {
    zilliqa_chain = new Zilliqa('https://dev-api.zilliqa.com');
    chainId = 333;
    privateKeys = key.ZilPayPrivateKeys; // use the ZilPay keys
  }
  else { // Isolated server / Simulated ENV
    zilliqa_chain = new Zilliqa('https://zilliqa-isolated-server.zilliqa.com/');
    chainId = 222;
    privateKeys = key.isolatedServerPrivateKeys; // zilnet keys, activated on ide.zilliqa.com in SimulatedEnv
  }
  const msgVersion = 1; // current msgVersion
  const VERSION = bytes.pack(chainId, msgVersion);
  return {"zilliqa": zilliqa_chain,
          "VERSION": VERSION,
          "keys": privateKeys,
        };
}

exports.setup_chain_and_wallet = setup_chain_and_wallet;
