//go:build tinygo.riscv32
// +build tinygo.riscv32

package runtime

const GOARCH = "arm" // riscv pretends to be arm

// The bitness of the CPU (e.g. 8, 32, 64).
const TargetBits = 32

// Align on word boundary.
func align(ptr uintptr) uintptr {
	return (ptr + 3) &^ 3
}
