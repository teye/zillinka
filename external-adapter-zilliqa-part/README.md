# Zillinka
Oracle contract and adapters for Chainlink nodes on/to/from Zilliqa blockchain

## Install the Zilliqa JS library (see: https://github.com/Zilliqa/Zilliqa-JavaScript-Library)
You need a version of npm >=10.0.0 < 13, e.g. version 12.20 works. Install it inside the node-js sub directory
```bash
cd node-js
```
Then:
```bash
yarn add @zilliqa-js/zilliqa
yarn add tslib # ignore errors about wrong dependencies: they are not needed
yarn add bn.js
```

## in order to run the mocha tests: 
### Install mocha
```bash
npm install --global mocha
```
### Increase the parameters for a test to time out, and when it is considered "slow" 
As calls to the blockchain need a bit of time, add the following to your package.json (adjust the ms numbers depending on your needs):
```code
"mocha": {
    "timeout": 10000,
    "slow": 5000
}
```

### the tests are located in ./node-js/test/ directory. To run them:
```bash
$ cd node-js
$ mocha # run all tests in the test\ directory
$ mocha test\<testfile.js> # run only a specific test
```
