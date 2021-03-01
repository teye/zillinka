const assert = require('chai').assert
const createRequest = require('../index.js').createRequest

/*
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "reqID": 0, "dateString": "2021-02-28"} }'
*/

describe('createRequest', () => {
  const jobID = '1'
  const reqID = '0'

  const d = new Date(Date.now() - 86400000)
  const yesterday = d.toISOString().substring(0,10) // yesterday in format yyyy-mm-dd

  context('successful calls', () => {
    const requests = [
      { name: 'requestID', testData: { id: jobID, data: { requestID: reqID, dateString: yesterday } } },
      { name: 'reqID', testData: { id: jobID, data: { reqID: reqID, dateString: yesterday } } },
      { name: 'rID', testData: { id: jobID, data: { rID: reqID, dateString: yesterday } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 200)
          assert.equal(data.jobRunID, jobID)
          assert.isNotEmpty(data.data)
          assert.isAbove(Number(data.result), 0)
          assert.isAbove(Number(data.data.result), 0)
          done()
        })
      })
    })
  })

  context('error calls', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'empty reqID', testData: { data: {dateString: yesterday} } },
      { name: 'empty dateString', testData: { data: {reqID: reqID} } },
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 500)
          assert.equal(data.jobRunID, jobID)
          assert.equal(data.status, 'errored')
          assert.isNotEmpty(data.error)
          done()
        })
      })
    })
  })
})
