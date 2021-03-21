# Chainlink to Zilliqa Integration

This project aims to integrate the Zilliqa blockchain with the Chainlink Oracle infrastructure so Oracle data can be requested and retrieved on the Zilliqa blockchain.

## Modules

The project is a monorepo containing all components needed to retrieve data from an external data provider via a REST API.

### The External Initiator (EI)

[The External Initiator](./external-initiator/README.md) is a server process that can watch contract events via RPC or WebSocket. The process is spun up, configured with the addresses to watch. Once an event is emitted, in our case, on the Zilliqa blockchain, the event is transmitted as JSON. The EI event relays the event to a registered job definition in the chainlink node. The job relays the data to the nodes' bridge which calls the external adapter. The relay events are in Chainlink [standard format](https://docs.chain.link/docs/developers#requesting-data) and are flattened on the EI side. E.g. the JSON params on the Notification message are flattened to key/value pairs. 

### The Chainlink Node

[The Chainlink core node](https://github.com/smartcontractkit/chainlink) is configured in the docker-compose file. It contains the necessary environment configuration to spin up a container running the core node.
The core node relays requests from the external initiator to the external adapter in this context; besides the general features, it provides such features as configuration persistence etc. The core node requires a DB for it which is configured in the compose file as well.

### The External Adapter (EA)

In the current configuration [the external adapter](./external-adapters/README.md) is called by the core node and sends a request to the external adapter; the EA calls the REST API that requests data from a public REST API.
The EA receives the public REST API response and initiates a call with the Zilliqa client, which executes a transaction on the Zilliqa blockchain, thereby completing the call graph. The EA's are based on the NodJS templates for adapters and can be found [here](https://github.com/thodges-gh/CL-EA-NodeJS-Template).

## Starting the modules

Starting the infrastructure is a complete process, e.g., all required configurations are executed by the run script and configurations. You can change most of them in the run file, which lets you change the bridge configuration that defines the external API address, and the addresses it needs to listen to via the [Zilliqa WebSocket API](https://dev.zilliqa.com/docs/dev/dev-tools-websockets/#subscribe-event-log)

### Prerequisites

- Currently, you need to run the code on Linux.
- [Install docker-compose](https://docs.docker.com/compose/install/)

### Commands

Start the infrastructure:
```bash
././run  
```
Stop the infrastructure:
```bash
./stop
```

## Details

### Sequence Diagram call graph

<img src="./docs/Zillinka.svg">

### Setup

### Run

The setup process (included in the run file) bootstraps the components and creates several integration links while it sets up the infrastructure:
- It creates an external_initiator.env file to share the credentials between the external initiator and the chainlink node
- Builds the yarn packages and installation
- Builds the docker images

The run process configures the chainlink node finally with the credentials of the external initiator and the configuration of the components for the integration:
- Reset old docker volumes and start docker-compose
- Add the external initiator configuration to the chainlink node via the nodes' rest API.
- Startup the external initiator.
- Login to the chainlink node.
- Add the bridge's configuration. The bridges are the link between the external adapters and the chainlink node.
- Add the jobs configuration; the jobs configuration links the job to the bridge and the external initiators' endpoint.
- The endpoint configuration happens in the docker-compose via the external initiator API on startup.

### Stop

It just shuts down the infrastructure.

### General instructions

If you want to test your own adapters and oracle contracts:

- Go into the run file and replace or add a bridge and a job like that, order is important so make sure the bridge is created before the job:

```
./helper/setup_bridge "zil-my-bridge" "http://my-external-adapter-address:8080"
./helper/setup_job "zil" "zil-ws" "0xbd0a71b-my-zilliqa-address-8627abdac6fcc" "" "" "zil-my-bridge"
```

"zil" is the identifier of the external initiator entry, so in this setup, don't change it/reuse it. The external adapter address can be an external adapter on the internet or an address from your docker network; in our setup, it is the one from the docker-compose file (you would need to add your adapter there).

The bridge is the link from the job to the external adapter, and you can do that manually via the local [chainlink node] (http://localhost:6688); the credentials are: john@doe.com/password, but in this setup, it will be done automatically based on the mentioned two commands.

The EI set up to the Zilliqa Websocket API is handled in the docker-compose via an injected configuration, as this is a Zilliqa showcase only the Zilliqa blockchain is connected.

- Use the ```./run``` command to start it up

- With docker ps you'll see all services running, use ```docker logs -f 435ui45``` where the last portion is the hash of the service instance you want to watch, probably the external adapter exchange, so use the external adapter hash and see the request/response flow.

An example of the last bullet point:

```
$ docker ps # list all running instances
# now copy the hash ('CONTAINER ID') of the oracle to run, 
# e.g. the one with 'NAMES' = external-adapter-unixtime: d41f4486cde2
$ docker logs -f d41f4486cde2
Listening on port 8080!
```

- In general, make sure that you use the Chainlink [standard format]((https://docs.chain.link/docs/developers#requesting-data)) for the payload for your custom external adapter.

### Issues

If you encounter errors on the EI flow, you can raise an issue on this repo.