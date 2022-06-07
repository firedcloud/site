// Package debug is a dummy package that is not yet implemented.
package debug

// SetMaxStack sets the maximum amount of memory that can be used by a single
// goroutine stack.
//
// Not implemented.
func SetMaxStack(n int) int {
	return n
}

// Stack returns a formatted stack trace of the goroutine that calls it.
//
// Not implemented.
func Stack() []byte {
	return nil
}

// ReadBuildInfo returns the build information embedded
// in the running binary. The information is available only
// in binaries built with module support.
//
// Not implemented.
func ReadBuildInfo() (info *BuildInfo, ok bool) {
	return nil, false
}

// BuildInfo represents the build information read from
// the running binary.
type BuildInfo struct {
	Path string    // The main package path
	Main Module    // The module containing the main package
	Deps []*Module // Module dependencies
}

// Module represents a module.
type Module struct {
	Path    string  // module path
	Version string  // module version
	Sum     string  // checksum
	Replace *Module // replaced by this module
}
