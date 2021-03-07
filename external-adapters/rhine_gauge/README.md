# Chainlink NodeJS External Adapter To Fetch Rhine River Pegel Level

Fetches the gauge level of river Rhine at Kaub station at a given date at noon (UTC + 1, i.e. central Europe standard time), see ""https://www.pegelonline.wsv.de/". The date is a parameter given as a string in the format "yyyy-mm-dd".

It writes the level back to a contract on the Zilliqa blockchain. Run all commands below inside the subdirectory `rhine_gauge`!
## Install Locally
Install dependencies:

```bash
yarn
```

## Test
Run the local tests:

```bash
yarn test
```
## Start Service

Start the service:
```bash
yarn start
```

## Input Params

- currently none

## Call the external adapter/API server

Make curl call inside the same subdirectory `rhine_gauge` in a different terminal. Assume we want
the level at noon for February 23, 2021:
```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "reqID": 0, "dateString": "2021-02-23"} }'
```
