# Chainlink NodeJS External Adapter To Fetch ZIL/USD

The adapter fetches the current ZIL/USD price from CoinGecko and writes the result to an oracle contract on the Zilliqa blockchain.

To run the adapter there are three possibilities:
- through the oracle contract
- through a client contract
- in isolation (without the external initiator)

## Scilla Contracts
The smart contract code can be found in folder `./scilla/`:
- [Oracle Client Contract](./scilla/OracleClient.scilla)
- [Oracle Contract](./scilla/Oracle.scilla)

Both the client and the oracle contracts are already deployed on the testnet, see the "contracts" entry in the JSON in [blockchain.js](./secrets/blockchain.js) for their addresses.

To inspect their states, see [viewblock](https://viewblock.io/zilliqa?network=testnet) or [devex](https://devex.zilliqa.com/?network=https%3A%2F%2Fdev-api.zilliqa.com). 

Namely, for
- the [oracle client](https://viewblock.io/zilliqa/address/zil1vagqle985yhg87sr5x0t62qh5nuv0wfnqwme03?network=testnet&tab=state)
- the [oracle](https://viewblock.io/zilliqa/address/zil1l8dfe2hlrytnmmwq38yt6f0yy7qpyw7vdta9k3?network=testnet&tab=state)


## Requirements
The client needs to implement the callback to receive the data (i.e. the unix time) from the oracle:
```code
transition callback_data(data: Uint128)
```
In order to request the current unix time the client contract needs to call the oracle's `transition request()`. An example message to request the current unix time from the oracle deployed at address `to` is, see 
`transition data_request()` in [OracleClient](./scilla/OracleClient.scilla):
```code
zero128 = Uint128 0;
msg = {_tag: "request"; _recipient: to; _amount: zero128};

```
## Trigger the request directly on the oracle contract
Call the transition `request()` in the smart contract [Oracle](./scilla/Oracle.scilla). The unix time is available in the `field data_requests` in the entry corresponding to the latest `requestId`, as in the emitted event.

## Trigger the request from a client contract
Call the transition `data_request()` in the smart contract [OracleClient](./scilla/OracleClient.scilla). 

This sends a message to the [Oracle](./scilla/Oracle.scilla) invoking its transition `request()`. Here, the unix time is at the end available in the client contract in the `field all_data` (and also in the oracle contract as above).


## To run the adapter in isolation (without the external initiator)

### Install Locally
Install dependencies:

```bash
yarn
```

### Tests (optional)
Run the local tests (note that they take a while as several blockchain transactions are involved and the tests are run on the Zilliqa testnet with a blocktime of ~ 45 seconds):

```bash
yarn test
```
### Start Service

Start the service:
```bash
yarn start
```

### Call the external adapter/API server

Make curl call inside the same subdirectory `pricefeed` in a different terminal:
```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data":  { "requestId": 0} }'
```

### Output in the terminal/shell where ```yarn start``` was executed
The output can be used to check that the oracle contract has at the end the correct unix time stored: this is done by querying the contract's state at the very end.

` ====> Request: = `
```json
{"id":0,"data":{"requestId":0}}

{"message":"Received response: {\"zilliqa\":{\"usd\":0.112213}}","level":"info","timestamp":"2021-06-11T09:40:48.934Z"

Result:  { 
  jobRunID: 0,
  data: { 
    zilliqa: { 
      usd: 0.111861 
    }, 
    result: 0.111861 
  },
  result: 0.111861,
  statusCode: 200 
}

===> price is 0.111861

===> calling set_data(0.111861, 0) to write to oracle contract @  0xF9da9CaaFF19173dEDC089c8BD25E42780123bCc

====> tx successful: querying state

====> in oracle state: value field of entry in DataRequest map for request with id = 0
{ 
  argtypes: [ 'String' ],
  arguments: [ '0.111861' ],
  constructor: 'Some' 
}
```
