# Scilla contracts

The smart contracts are implemented in Scilla, see https://scilla.readthedocs.io/en/latest/.

A client calls an oracle to get some specific off-chain data that oracle can provide. This client is implemented in the ``contract OracleClient``. 
An example of an oracle is in ``contract Oracle0``.

## Oracle client

The client contract can (for testing purpose) call different oracles. Each oracle is basically a smart contract on the blockchain at a known address. 
The client offers the following transistions accessible from other contracts or accounts:
- ``transition add_oracle(address : ByStr20)`` A deployed oracle can be registered in the client by providing the oracle's address. 
It will try to call the smart contract at this address to get the oracle's id using ``get_id()`` (see below). 
If successful, it stores the oracle in a map with key the id. If two oracles provide the same id, only the first one to register is stored.
- ``transition delete_oracle(id : String)`` An oracle stored in the map can be deleted by providing its id.
- ``transition data_request(id : String, arg: String)`` The key transition to request data from an oracle identified by its id. It needs to be added 
to the map before through ``add_oracle(.)``, see above. It will call the oracle and passing the argument(s) given in the string ``arg`` (e.g., a 
date string in the form ``yyyy-mm-dd``, depending on the oracle's requirements.

Beside these transitions targeted at user interactions it has callbacks to receive information back from an oracle:
- ``transition callback_id(id: String)`` Called by the oracle if its id is requested (through ``get_id()``, see below).
- ``transition callback_data(id: String, data: Uint32, argument: String)`` Called by the oracle to send back integer data (e.g., a level in cm) as requested by
the client through ``data_request(.)``, see above.

## Oracle
Each oracle must implement the following transitions:
- ``transition request(arg: String)`` To request data from the oracle given an argument ``arg`` (e.g., a date string to get data for a specific date -- depending
on the specifics of the oracle). The oracle will assign a job id to this request and store it together with the sender's address (e.g., the ``OracleClient``). 
An event is emitted detailing the request and providing the job id for the adapter to use when sending the data for this request back to the oracle contract (through 
``set_data(.)``, see below.
-  ``transition set_data(data: Uint32, job_id: Uint32)`` To send off-chain integer data to the oracle, providing the ``job_id`` the oracle has assigned 
to the request during the request and emitted accordingly. It will call back the requestor's callback ``callback_data``, see above.
- ``transition get_id()`` Calls back the sender's ``callback_id(id: String)`` with the oracle's id.
