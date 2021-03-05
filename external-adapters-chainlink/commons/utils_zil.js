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
    privateKey =  // corresponding address: 0x56A7812f68cbF83194a4a777D2310Aa7A378C9D8
      'b74501e0d2d047e8aaa2353020b46f31d396f92d05843665573300995e3aed88';
    uxt_oracle_addr = '';
    uxt_oracle_client_addr = '';
    rhine_oracle_addr = '';
    rhine_oracle_client_addr = '';
  }
  else { // Isolated server / Simulated ENV
    zilliqa_chain = new Zilliqa('https://zilliqa-isolated-server.zilliqa.com/');
    chainId = 222;
    privateKey = // corresponding address: 0x2CdBC15AA0BE9C7476731C53696CA579D479ffCA
    '216065ac2352567ba9bb1d9e4e0220819671da37ebfd1fff6a6facfe5ede5784';
    uxt_oracle_addr = '0x827c1f98a934de858f875c0d7a489a24a1d119ed';
    uxt_oracle_client_addr = '0xb80ad4de4ace27c7313d2439d8615ce7bad9a23d';
    rhine_oracle_addr = '0x6170789acfacdd8041463be60d8951a080c9a808';
    rhine_oracle_client_addr = '0xf8fde3e4bcc61170e3fad8b5d238d2dea3aa50f2';
  }
  const msgVersion = 1; // current msgVersion
  const VERSION = bytes.pack(chainId, msgVersion);
  return {"zilliqa": zilliqa_chain,
          "VERSION": VERSION,
          "privateKey": privateKey,
          "addresses": {
                "UnixTimeOracle": uxt_oracle_addr,
                "UnixTimeOracleClient": uxt_oracle_client_addr,
                "RhineGaugeOracle": rhine_oracle_addr,
                "RhineGaugeOracleClient": rhine_oracle_client_addr,
              },
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
