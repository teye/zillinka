# Chainlink to Zilliqa Integration

This project aims to integrate the Zilliqa blockchain with the Chainlink Oracle infrastructure so Oracle data can be requested and retrieved on the Zilliqa blockchain.

## Modules

The project is a monorepo containing all components needed to retrieve data from an external data provider via a REST Api.

### The External Initiator (EI)

[The External Initiator](./external-initiator/README.md) is a server process that can watch contract events via rpc or websocket. The process is spun up, configured with the addresses to watch and once an event is emitted, in our case on the Zilliqa blockchain, the event is retrieved as JSON. The event is then relayed to a registered job definition in the chainlink node. The job relays the data to the nodes' bridge which calls the external adapter.

### The Chainlink Node

[The Chainlink core node](./chainlink-node/README.md) module contains the files to start up a core node. It contains the necessary environment files and the Dockerfile to spin up a container running the core node. The node needs to be configured with the addresses it should listen to (These addresses can be on several chains).
The core node relays requests from the external initator to the external adapter in this context, besides the general features it provides such as configuration persistence etc.

### The External Adapter (EA)

In the current configuration [the external adapter](./external-adapter/README.md) is called by the core node and which sends a request to the external adapter, the EA calls the REST API that requests data from another public REST API.
The EA receives the response from the public REST API and initiates a call with the Zilliqa client which executes a transaction on the Zilliqa blockchain thereby completing the call graph.

## Starting the modules

As not all modules are fully functional yet the docker-compose file starts up the current infrastructure by using the commands described below.

### Prerequisites

- Currently you need to run the code on Linux.
- [Install docker-compose](https://docs.docker.com/compose/install/)

### Commands

Start the infrastructure:
```bash
docker-compose up
```
Stop the infrastructure:
```bash
docker-compose down
```
Clean everything up (will completely erase images and containers etc., confirm with yes):
```bash
docker system prune --all
```
