# Chainlink NodeJS External Adapter To Fetch Unixtime

Unix time is the number of seconds since  January 1st, 1970 at UTC, see https://www.unixtimestamp.com/ .

This adapter fetches the unix time from the api  
"http://worldtimeapi.org/api/timezone/Europe/Berlin" (timezone for central Europe (i.e. city of Berlin), which is, however, irrelevant for unix time).

The adapter then writes the unix time to an oracle contract on the Zilliqa blockchain. 

To run the adapter there are three possibilities:
- through the oracle contract
- through a client contract
- in isolation (without the external initiator)

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

Make curl call inside the same subdirectory `unixtime` in a different terminal:
```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data":  { "requestId": 0} }'
```

### Outputin the terminal/shell where ```yarn start``` was executed
The output can be used to check that the oracle contract has at the end the correct unix time stored: this is done by querying the contract's state at the very end.

` ====> Request: = `
```json
{"id":0,"data":{"requestId":0}}

{"message":"Received response: {\"abbreviation\":\"CET\",\"client_ip\":\"85.5.161.167\",\"datetime\":\"2021-03-15T17:24:19.428019+01:00\",\"day_of_week\":1,\"day_of_year\":74,\"dst\":false,\"dst_from\":null,\"dst_offset\":0,\"dst_until\":null,\"raw_offset\":3600,\"timezone\":\"Europe/Berlin\",\"unixtime\":1615825459,\"utc_datetime\":\"2021-03-15T16:24:19.428019+00:00\",\"utc_offset\":\"+01:00\",\"week_number\":11}","level":"info","timestamp":"2021-03-15T16:24:19.471Z"}

Result:  {
  jobRunID: 0,
  data: {
    abbreviation: 'CET',
    client_ip: '85.5.161.167',
    datetime: '2021-03-15T17:24:19.428019+01:00',
    day_of_week: 1,
    day_of_year: 74,
    dst: false,
    dst_from: null,
    dst_offset: 0,
    dst_until: null,
    raw_offset: 3600,
    timezone: 'Europe/Berlin',
    unixtime: 1615825459,
    utc_datetime: '2021-03-15T16:24:19.428019+00:00',
    utc_offset: '+01:00',
    week_number: 11,
    result: 1615825459
  },
  result: 1615825459,
  statusCode: 200
}

 ===> unix time is 1615825459

 ===> calling set_data(1615825459, 0) to write to oracle contract @  0xAA28674d160a7B74cd6b3eEdcE733AC5c01Cd26a

 ====> tx successful: querying state

 ====> in oracle state: value field of entry in DataRequest map for request with id = 0

{
  argtypes: [ 'Uint128' ],
  arguments: [ '1615825459' ],
  constructor: 'Some'
}
```
