# Chainlink NodeJS External Adapter To Fetch Rhine River Pegel Level

Fetches the gauge level of river Rhine at Kaub station at a given date at noon (UTC + 1, i.e. central Europe standard time), see ""https://www.pegelonline.wsv.de/". The date is a parameter given as a string in the format "yyyy-mm-dd".

The adapter then writes the unix time to a oracle contract on the Zilliqa blockchain. 

To run the adapter there are three possibilities:
- through the oracle contract
- through a client contract
- in isolation (without the external initiator)


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

### Outputin the terminal/shell where ```yarn start``` was executed
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
       date is: 2021-03-04
       pegel level is: 173
```
