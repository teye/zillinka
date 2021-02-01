# Zillinka
Oracle contract and adapters for Chainlink nodes on/to/from Zilliqa blockchain

## Install the Zilliqa JS library (see: https://github.com/Zilliqa/Zilliqa-JavaScript-Library)
```bash
yarn add @zilliqa-js/zilliqa
yarn add tslib # ignore errors about wrong dependencies: they are not needed
yarn add bn.js
```

## in order to run the mocha tests
```bash
npm install --global mocha
```

# the tests are located in ./node-js/test/ directory. To run them:
```bash
$ cd node-js
$ mocha # run all tests in the test\ directory
$ mocha test\<testfile.js> # run only a specific test
```
