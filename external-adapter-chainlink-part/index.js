const { Requester, Validator } = require('@chainlink/external-adapter')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  // FMB set endpoint to  Berlin time zone in url below (fix)
}

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  //const endpoint = validator.validated.data.endpoint || 'price'
  // FMB Change the address to url from unix time api
  const url = 'http://worldtimeapi.org/api/timezone/Europe/Berlin'
  // FMB no need for paameters for this request
//  const fsym = validator.validated.data.base.toUpperCase()
//  const tsyms = validator.validated.data.quote.toUpperCase()

  const params = {
    // FMB no params needed, ural has no '?p1=P1&p2=P2&...'
//    fsym,
//    tsyms
  }

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.
//      response.data.result = Requester.validateResultNumber(response.data, [tsyms])
      response.data.result = Requester.validateResultNumber(response.data, ["unixtime"]) // FMB: extract unixtime from json
      // TODO: FMB Take the result and send it to Zilliqa oracle contract
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
