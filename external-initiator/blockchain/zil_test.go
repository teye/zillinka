package blockchain

import (
	"reflect"
	"testing"

	"github.com/smartcontractkit/external-initiator/store"
	"github.com/smartcontractkit/external-initiator/subscriber"
)

func TestCreateZilFilterMessage(t *testing.T) {
	tests := []struct {
		name string
		args store.ZilSubscription
		p    subscriber.Type
		want []byte
	}{
		{
			"address only",
			store.ZilSubscription{Accounts: []string{"0xafccafdc1ce8249cec35a0b432e329ce1bfac179"}},
			subscriber.WS,
			[]byte(`{"query":"EventLog","addresses":["0xafccafdc1ce8249cec35a0b432e329ce1bfac179"]}`),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := createZilManager(tt.p, store.Subscription{Zilliqa: tt.args}).GetTriggerJson(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetTriggerJson() = %s, \nwant %s", got, tt.want)
			}
		})
	}
}


func TestZilManager_GetTestJson(t *testing.T) {
	type fields struct {
		fq *filterQuery
		p  subscriber.Type
	}
	tests := []struct {
		name   string
		fields fields
		want   []byte
	}{
		{
			"returns empty when using RPC",
			fields{
				p: subscriber.RPC,
			},
			nil,
		},
		{
			"returns empty when using WS",
			fields{
				p: subscriber.WS,
			},
			nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			z := zilManager{
				//fq: tt.fields.fq,
				p: tt.fields.p,
			}
			if got := z.GetTestJson(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetTestJson() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestZilManager_ParseTestResponse(t *testing.T) {
	type fields struct {
		fq *filterQuery
		p  subscriber.Type
	}
	type args struct {
		data []byte
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		{
			"does nothing for WS",
			fields{fq: &filterQuery{}, p: subscriber.WS},
			args{},
			false,
		},
		{
			"does nothing for RPC",
			fields{fq: &filterQuery{}, p: subscriber.RPC},
			args{},
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := zilManager{
				//fq: tt.fields.fq,
				p: tt.fields.p,
			}
			if err := e.ParseTestResponse(tt.args.data); (err != nil) != tt.wantErr {
				t.Errorf("ParseTestResponse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestZilManager_ParseResponse(t *testing.T) {
	type fields struct {
		fq *filterQuery
		p  subscriber.Type
	}
	type args struct {
		data []byte
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   []subscriber.Event
		want1  bool
	}{
		{
			"fails parsing invalid payload",
			fields{fq: &filterQuery{}, p: subscriber.WS},
			args{data: []byte(`invalid`)},
			nil,
			false,
		},
		{
			"fails parsing invalid WS subscribe payload",
			fields{fq: &filterQuery{}, p: subscriber.WS},
			args{data: []byte(`{"a":"b","c":1}`)},
			nil,
			false,
		},
		{
			"fails parsing invalid WS subscribe",
			fields{fq: &filterQuery{}, p: subscriber.WS},
			args{data: []byte(`{ "query":"EventLogX", "value": [ { "address":"0x0000000000000000000000000000000000000000", "event_logs":[ { "_eventname":"foo1", "params":[ { "vname":"bar1", "type":"String", "value":"abc" }, { "vname":"bar2", "type":"ByStr32", "value":"0x0000000000000000000000000000000000000001" } ] } ] } ]}`)},
			nil,
			false,
		},
		{
			"successfully parses WS response",
			fields{fq: &filterQuery{}, p: subscriber.WS},
			args{data: []byte(`{"type":"Notification","values":[{"query":"EventLog","value":[{"address":"afccafdc1ce8249cec35a0b432e329ce1bfac179","event_logs":[{"_eventname":"request","params":[{"type":"String","value":"TEST","vname":"oracleId"},{"type":"Uint32","value":"0","vname":"requestId"},{"type":"ByStr20","value":"0x1a8ba23182e4686fb8121a310111d03b55c91b46","vname":"initiator"},{"type":"String","value":"kaub","vname":"argument"}]}]}]}]}`)},
			[]subscriber.Event{
				subscriber.Event(`{"_eventname":"request","address":"afccafdc1ce8249cec35a0b432e329ce1bfac179","argument":"kaub","initiator":"0x1a8ba23182e4686fb8121a310111d03b55c91b46","oracleId":"TEST","requestId":0,"type":"EventLog"}`),
			},
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			z := zilManager{
				//fq: tt.fields.fq,
				p: tt.fields.p,
			}
			got, got1 := z.ParseResponse(tt.args.data)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseResponse() got = %s, want %v", got, tt.want)
			}
			if got1 != tt.want1 {
				t.Errorf("ParseResponse() got1 = %v, want %v", got1, tt.want1)
			}
		})
	}
}
