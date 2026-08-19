package sdk

import (
	"errors"
	"fmt"
)

// The errors this package reports. Each is a sentinel to match with errors.Is,
// because what a caller does about a failure depends entirely on which kind it
// is: a closed transport is retried by starting again, a protocol violation is a
// bug report, and a failed turn is the model's answer being "no".
var (
	// ErrClosed is returned by a harness that has been closed.
	ErrClosed = errors.New("sdk: harness is closed")

	// ErrNotStarted is returned when a harness is used before Open finished.
	ErrNotStarted = errors.New("sdk: harness is not started")

	// ErrProtocol reports data outside the protocol: a notification that is not
	// JSON, a turn/end with no reason kind, a response to a request nobody made.
	// It means the other end is not the harness, or not a version of it this
	// package understands.
	ErrProtocol = errors.New("sdk: runtime sent data outside the protocol")

	// ErrTransportClosed reports that the runtime went away — the subprocess
	// exited, or its stdout closed — while there was still work outstanding.
	ErrTransportClosed = errors.New("sdk: runtime transport closed")

	// ErrTurnFailed reports a turn that ended with a provider error. The wrapped
	// message carries what the provider said.
	ErrTurnFailed = errors.New("sdk: turn failed")

	// ErrUnsupported reports something this carrier cannot do — asking a
	// subprocess runtime for what an in-process registry holds. It is a property
	// of how the harness is reached, not a failure of the call.
	ErrUnsupported = errors.New("sdk: this carrier does not support that")
)

// RPCError is an error response from the runtime: the harness understood the
// request and refused it.
type RPCError struct {
	Code    int
	Message string
	Data    []byte
}

func (e *RPCError) Error() string {
	if e.Code != 0 {
		return fmt.Sprintf("sdk: runtime error %d: %s", e.Code, e.Message)
	}
	return "sdk: runtime error: " + e.Message
}

// StartError reports a runtime that would not start, with whatever it wrote to
// stderr before giving up — which is usually the only description of what went
// wrong that exists.
type StartError struct {
	Reason string
	Stderr string
}

func (e *StartError) Error() string {
	if e.Stderr == "" {
		return "sdk: " + e.Reason
	}
	return fmt.Sprintf("sdk: %s\n%s", e.Reason, e.Stderr)
}
