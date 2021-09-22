const bc_secrets =
{
  /* Zilliqa Testnet Setup */
  "privateKey": // address: 0x56A7812f68cbF83194a4a777D2310Aa7A378C9D8 / zil126ncztmge0urr99y5amayvg2573h3jwcxgkqjv
    'b74501e0d2d047e8aaa2353020b46f31d396f92d05843665573300995e3aed88',

  "zilliqa": { // blockchain
    "api": 'https://dev-api.zilliqa.com',
    "chainId": 333,
    "msgVersion": 1,
  },

  "contracts": { // addresses of deployed smart contracts
    "oracle": '0x00543cb5d0e873048d2661eab68744f6a91c924b',
    "oracleClient": '0x5c4f7fa6909d401a1662f27e5bc0043fda53cb14',
  },

}

exports.bc_secrets = bc_secrets
