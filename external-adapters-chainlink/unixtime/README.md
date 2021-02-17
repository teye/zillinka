# Chainlink NodeJS External Adapter To Fetch Unixtime

Unix time is the number of seconds since  January 1st, 1970 at UTC, see https://www.unixtimestamp.com/ .

Fetches the unix time for central Europe time zone from the api  
"http://worldtimeapi.org/api/timezone/Europe/Berlin" (timezone for central Europe CEST).

It writes the unix time back to a contract on the Zilliqa blockchain.

## start the service inside the subdirectory ```unixtime```
```bash
yarn start
```

## Input Params

- currently none

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { } }'
```

## Output

```json
{"jobRunID":0,"data":{"abbreviation":"CET","client_ip":"85.5.161.167","datetime":"2021-02-17T17:19:59.171527+01:00","day_of_week":3,"day_of_year":48,"dst":false,"dst_from":null,"dst_offset":0,"dst_until":null,"raw_offset":3600,"timezone":"Europe/Berlin","unixtime":1613578799,"utc_datetime":"2021-02-17T16:19:59.171527+00:00","utc_offset":"+01:00","week_number":7,"result":1613578799},"result":1613578799,"statusCode":200}
```
and ``` ===> unix time is 1613578799```
