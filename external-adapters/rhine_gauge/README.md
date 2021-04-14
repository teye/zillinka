# Chainlink NodeJS External Adapter To Fetch Rhine River Pegel Level

Fetches the gauge level of river Rhine at Kaub station at a given date at "noon", see https://www.pegelonline.wsv.de/. The date is a parameter given as a string in the format "yyyy-mm-dd".
The adapter then writes the gauge level to an oracle contract on the Zilliqa blockchain.

To run the adapter there are three possibilities:
- through the oracle contract
- through a client contract
- in isolation (without the external initiator)

### Notes
Choose a "meaningful" date to request a gauge level:
- Ensure the date chosen is not too far in the past as the api may no longer provide the corresponding gauge level. A date within the past two months should always work.
- Make sure that the date is not in the future, and do not choose
the actual date if noon (UTC +1 or +2 (day light saving time)) has not yet passed (as the gauge level will of course not yet be avalable!).

Furthermore, for this example "noon" means 12:00:00 UTC + 1 (without daylight saving time) or 12:00:00 UTC + 2 (during day light saving time), i.e. simply 12:00:00 in central Europe (e.g. Berlin/Germany). Hence, during the summer with daylight saving time on, "noon" is 11:00:00 European Standard time, see https://www.timeanddate.com/time/change/germany.


## Scilla Contracts
The smart contract code can be found in folder `./scilla/`:
- [Oracle Client Contract](./scilla/OracleClient.scilla)
- [Oracle Contract](./scilla/Oracle.scilla)

Both the client and the oracle contracts are already deployed on the testnet, see the "contracts" entry in the JSON in [blockchain.js](./secrets/blockchain.js) for their addresses.

To inspect their states, see [viewblock](https://viewblock.io/zilliqa?network=testnet) or [devex](https://devex.zilliqa.com/?network=https%3A%2F%2Fdev-api.zilliqa.com). 

Namely, for
- the [oracle client](https://viewblock.io/zilliqa/address/zil1ep8egmvsgntj3y7vgsthn5a4738spnahnuzegd?network=testnet&tab=state)
- the [oracle](https://viewblock.io/zilliqa/address/zil1zk20mlrwk23acugt3ajmkvnujyxcy4m7tjcfue?network=testnet&tab=state)


## Requirements
The client needs to implement the callback to receive the data together with the date the pegel level was requested for from the oracle:
```code
transition callback_data(data: Uint128, date: String)
```
In order to request the pegel gauge level for a specific date the client contract needs to call the oracle's `transition request(date: String)` where the `date` is in the format of a date string: yyyy-mm-dd. An example message to request the level for March 10, 2021 (i.e., `d = '2021-03-10'`) from the oracle deployed at address `to` is, see
`transition data_request(date: String)` in [OracleClient](./scilla/OracleClient.scilla):
```code
zero128 = = Uint128 0;
msg = {_tag: "request"; _recipient: to; _amount: zero128 ; date: d};

```


## Trigger the request directly on the oracle contract
Call the transition `request(date: String)` in the smart contract [Oracle](./scilla/Oracle.scilla) with a date in the format 'yyyy-mm-dd' in the past. The pegel level is available in the `field data_requests` in the entry corresponding to the latest `requestId`, as in the emitted event.

## Trigger the request from a client contract
Call the transition `data_request(date: String)` in the smart contract [OracleClient](./scilla/OracleClient.scilla) with a date in the format 'yyyy-mm-dd' in the past.

This sends a message to the [Oracle](./scilla/Oracle.scilla) invoking its transition `request(date: String)` with the given date. Here, the pegel level is at the end available in the client contract in the `field all_data` (and also in the oracle contract as above).

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

Make curl call inside the same subdirectory `rhine_gauge` in a different terminal (here we set the date to March 12, 2021):
```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "requestId": 0, "date": "2021-03-12"} }'
```

### Output in the terminal/shell where ```yarn start``` was executed
The output can be used to check that the oracle contract has at the end the correct pegel level stored: this is done by querying the contract's state at the very end.

` ====> Request: = `
```json
{ id: 0, data: { requestId: 0, date: '2021-03-12' }
```
```json
{"message":"Received response: ... a list of pegel/gauge levels for different timestamps ... }
```
```json
Result:  {
  jobRunID: 0,
  data: [
    { timestamp: '2021-03-12T12:00:00+01:00', value: 173 },
          ... more entries for other timestamps ...

   ... 212 more items,
    result: 173
  ],
  result: 173,
  statusCode: 200
}
```
```
 ===> Rhine level on 2021-03-12 at noon is 173
 ===> calling set_data(173, 0) to write to oracle contract @  0xbd0a71b5490291cF99B00A733068627abdac6fcc
 ====> tx successful: querying state
 ====> in oracle state: entry in DataRequest map for request with id = 0
       pegel level is: 173
```
