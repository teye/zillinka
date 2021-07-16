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
    "oracle": '0xf9da9caaff19173dedc089c8bd25e42780123bcc',
    "oracleClient": '0x67500fe4a7a12e83fa03a19ebd2817a4f8c7b933',
  },

}

exports.bc_secrets = bc_secrets
