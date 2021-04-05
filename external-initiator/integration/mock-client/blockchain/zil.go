package blockchain

import (
	"encoding/json"
	"fmt"
	"github.com/smartcontractkit/external-initiator/blockchain"
)

// https://dev.zilliqa.com/docs/dev/dev-tools-websockets/#subscribe-event-log
var notification = `{"type":"Notification","values":[{"query":"EventLog","value":[{"address":"afccafdc1ce8249cec35a0b432e329ce1bfac179","event_logs":[{"_eventname":"request","params":[{"type":"String","value":"TEST","vname":"oracleId"},{"type":"Uint32","value":"0","vname":"requestId"},{"type":"ByStr20","value":"0x1a8ba23182e4686fb8121a310111d03b55c91b46","vname":"initiator"},{"type":"String","value":"kaub","vname":"argument"}]}]}]}]}`

func handleZilRequest(conn string, kind string, msg []byte) ([][]byte, error) {
	if conn == "ws" {
		switch kind {
		case "event-log":
			return handleQueryEventLog(msg)
		default:
			return nil, fmt.Errorf("unexpected kind: %v", kind)
		}
	}

	return nil, fmt.Errorf("unexpected conn: %v", conn)
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
