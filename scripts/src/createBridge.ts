import url from 'url'
import axios from 'axios'

import { getArgs, getLoginCookie, registerPromiseHandler } from './common'

async function main() {
  registerPromiseHandler()
  const args = getArgs(['CHAINLINK_URL'])

  await createBridge({
    chainlinkUrl: args.CHAINLINK_URL,
  })
}

main()

interface Options {
  chainlinkUrl: string
}

async function createBridge({ chainlinkUrl }: Options) {
  const sessionsUrl = url.resolve(chainlinkUrl, '/sessions')
  const bridge = {
    "name": process.argv[2],
    "url": process.argv[3],
    "minimumContractPayment": "0",
    "confirmations": 0
  }
  const specsUrl = url.resolve(chainlinkUrl, '/v2/bridge_types')
  const Bridge = await axios
    .post(specsUrl, bridge, {
      withCredentials: true,
      headers: {
        cookie: await getLoginCookie(sessionsUrl),
      },
    })
    .catch((e: Error) => {
      console.error(e)
      throw Error(`Error creating Bridge ${e}`)
    })

  console.log('Deployed Bridge at:', Bridge.data.id)
}
