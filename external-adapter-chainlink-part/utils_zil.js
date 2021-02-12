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


// deploy a contract (in a string) given init parameters, blockchain and tx txParams
async function deploy_contract(/*string*/sc_string, /*JSON*/init, /*JSON*/ bc_setup, /*JSON*/ tx_settings)
{
  const contract = bc_setup.zilliqa.contracts.new(sc_string, init);
  const [tx, sc] = await contract.deploy(
    { version: bc_setup.VERSION, gasPrice: tx_settings.gas_price, gasLimit: tx_settings.gas_limit, },
    tx_settings.attempts, 1000, false,
  );
  return [tx, sc];
}

// call a smart contract's transition with given args and an amount to send from a given public key
async function call_contract( /*contract*/sc, /*string*/transition_name, /*array*/args,
                        /*BN*/amt_as_BN, /*string*/caller_pub_key, /*JSON*/ bc_setup, /*JSON*/tx_settings)
{
   const tx = await sc.call(
     transition_name,
     args,
     { version: bc_setup.VERSION, amount: amt_as_BN, gasPrice: tx_settings.gas_price,
       gasLimit: tx_settings.gas_limit, pubKey: caller_pub_key, },
     tx_settings.attempts, 1000, false,
   );
   return tx;
}


exports.setup_chain_and_wallet = setup_chain_and_wallet;
exports.deploy_contract = deploy_contract;
exports.call_contract = call_contract;
