# Chainlink NodeJS External Adapter To Fetch Unixtime

Unix time is the number of seconds since  January 1st, 1970 at UTC, see https://www.unixtimestamp.com/ .

Fetches the unix time for central Europe time zone from the api  
"http://worldtimeapi.org/api/timezone/Europe/Berlin" (timezone for central Europe CEST).

It writes the unix time back to a contract on the Zilliqa blockchain. Run all commands below inside the subdirectory `unixtime`!
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
### on Linux
Make curl call inside the same subdirectory `unixtime` in a different terminal:
```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { } }'
```
### on Windows (in a power shell)
```bash
 Invoke-WebRequest "http://localhost:8080/" -Method POST -Headers @{"Content-Type"="application:json"} -body @{"id"=0; "data"={};}
 ```

## Output
### on Linux
```json
Result:  {
  jobRunID: 0,
  data: {
    abbreviation: 'CET',
    client_ip: '85.5.161.167',
    datetime: '2021-02-17T17:19:59.171527+01:00',
    day_of_week: 3,
    day_of_year: 48,
    dst: false,
    dst_from: null,
    dst_offset: 0,
    dst_until: null,
    raw_offset: 3600,
    timezone: 'Europe/Berlin',
    unixtime: 1613578799,
    utc_datetime: '2021-02-17T16:19:59.171527+00:00',
    utc_offset: '+01:00',
    week_number: 7,
    result: 1613578799
  },
  result: 1613578799,
  statusCode: 200
}

```
### on Windows (result is in "Content")
``
StatusCode        : 200
StatusDescription : OK
Content           : {"jobRunID":"1","data":{"abbreviation":"CET","client_ip":"85.5.161.167","datetime":"2021-02-19T10
                    :01:23.058483+01:00","day_of_week":5,"day_of_year":50,"dst":false,"dst_from":null,"dst_offset":0,
                    "dst_u...
RawContent        : HTTP/1.1 200 OK
                    Connection: keep-alive
                    Keep-Alive: timeout=5
                    Content-Length: 424
                    Content-Type: application/json; charset=utf-8
                    Date: Fri, 19 Feb 2021 09:01:23 GMT
                    ETag: W/"1a8-3wNQYP93DwBHerWgct...
Forms             : {}
Headers           : {[Connection, keep-alive], [Keep-Alive, timeout=5], [Content-Length, 424], [Content-Type,
                    application/json; charset=utf-8]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 424
``
### and on both platforms in the terminal/shell where you have executed ```yarn start```

`===> unix time is 1613578799` 
