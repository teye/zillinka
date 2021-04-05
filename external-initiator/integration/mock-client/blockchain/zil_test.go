package blockchain

import (
	"reflect"
	"testing"
)

var request = `{"query":"EventLog","addresses":["afccafdc1ce8249cec35a0b432e329ce1bfac179","0x1111111111111111111111111111111111111111"]}`

func Test_handleZilRequest(t *testing.T) {
	type args struct {
		conn string
		kind string
		msg  []byte
	}
	type want struct {
		msg   [][]byte
		error bool
	}
	tests := []struct {
		name string
		args args
		want want
	}{
		{
			"returns error, not the right conn",
			args{
				"wrongConn",
				"zil",
				[]byte(`123`),
			},
			want{
				nil,
				true,
			},
		},
		{
			"returns error, not the right kind",
			args{
				"ws",
				"eth",
				[]byte(`123`),
			},
			want{
				nil,
				true,
			},
		},
		{
			"returns payload",
			args{
				"ws",
				"event-log",
				[]byte(request),
			},
			want{
				[][]byte{[]byte(request), []byte(notification)},
				false,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := handleZilRequest(tt.args.conn, tt.args.kind, tt.args.msg)
			if err != nil && !tt.want.error {
				t.Errorf("handleZilRequest() error = %v, want error %v", err, tt.want.error)
				return
			}
			if !reflect.DeepEqual(got, tt.want.msg) {
				t.Errorf("handleZilRequest() got = %v, want %v", got, tt.want.msg)
			}
		})
	}
}
