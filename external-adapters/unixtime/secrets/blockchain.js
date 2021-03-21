const bc_secrets =
{
  /* Zilliqa Testnet Setup */
  "privateKey":  // address: 0x56A7812f68cbF83194a4a777D2310Aa7A378C9D8 / zil126ncztmge0urr99y5amayvg2573h3jwcxgkqjv
    'b74501e0d2d047e8aaa2353020b46f31d396f92d05843665573300995e3aed88',

  "zilliqa": { // blockchain
    "api": 'https://dev-api.zilliqa.com',
    "chainId": 333,
    "msgVersion": 1,
  },

  "contracts": { // addresses of deployed smart contracts
    "oracle": '0x10281c73644ea6749087720b2bf9c539a3a99bfb',
    "oracleClient": '0x1dca0453a0955ddf91f1c5ddf64b57f872d42a54',
  },

}

exports.bc_secrets = bc_secrets
