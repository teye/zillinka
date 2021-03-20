package blockchain

import (
	"encoding/json"
	"fmt"
	"github.com/smartcontractkit/external-initiator/blockchain"
)

// https://dev.zilliqa.com/docs/dev/dev-tools-websockets/#subscribe-event-log
var notification = `{
  "query":"EventLog",
  "value":
  [
    {
      "address":"0x0000000000000000000000000000000000000000",
      "event_logs":[
        {
          "_eventname":"foo1",
          "params":[
            {
              "vname":"bar1",
              "type":"String",
              "value":"abc"
            },
            {
              "vname":"bar2",
              "type":"ByStr32",
              "value":"0x0000000000000000000000000000000000000001"
            }
          ]
        },
      ]
    }
  ]
}`

func handleZilRequest(conn string, kind string, msg []byte) ([][]byte, error) {
	if conn == "ws" {
		switch kind {
		case "event-log":
			return handleQueryEventLog(msg)
		}
	}

	return nil, fmt.Errorf("unexpected kind: %v", kind)
}

func handleQueryEventLog(msg []byte) ([][]byte, error) {
	var request blockchain.ZilEventLogQueryRequest
	if err := json.Unmarshal(msg, &request); err != nil {
		return nil, err
	}

	var response blockchain.ZilEventLogQueryResponse
	if err := json.Unmarshal([]byte(notification), &response); err != nil {
		return nil, err
	}

	response.Values[0].Value[0].Address = request.Addresses[0]

	rsp, err := json.Marshal(response)
	if err != nil {
		return nil, err
	}

	return [][]byte{msg, rsp}, nil
}
