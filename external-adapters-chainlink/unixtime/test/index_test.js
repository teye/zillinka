const assert = require('chai').assert
const createRequest = require('../index.js').createRequest

/*
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "reqID": 0} }'
*/

describe('createRequest', () => {
  const jobID = '1'
  const reqID = '0'

  context('successful calls', () => {
    const requests = [
      { name: 'requestID', testData: { id: jobID, data: { requestID: reqID } } },
      { name: 'reqID', testData: { id: jobID, data: { reqID: reqID } } },
      { name: 'rID', testData: { id: jobID, data: { rID: reqID } } }
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
