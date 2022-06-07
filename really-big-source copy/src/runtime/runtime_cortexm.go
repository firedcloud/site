//go:build cortexm
// +build cortexm

package runtime

import (
	"unsafe"
)

//go:extern _sbss
var _sbss [0]byte

//go:extern _ebss
var _ebss [0]byte

//go:extern _sdata
var _sdata [0]byte

//go:extern _sidata
var _sidata [0]byte

//go:extern _edata
var _edata [0]byte

func preinit() {
	// Initialize .bss: zero-initialized global variables.
	ptr := unsafe.Pointer(&_sbss)
	for ptr != unsafe.Pointer(&_ebss) {
		*(*uint32)(ptr) = 0
		ptr = unsafe.Pointer(uintptr(ptr) + 4)
	}

	// Initialize .data: global variables initialized from flash.
	src := unsafe.Pointer(&_sidata)
	dst := unsafe.Pointer(&_sdata)
	for dst != unsafe.Pointer(&_edata) {
		*(*uint32)(dst) = *(*uint32)(src)
		dst = unsafe.Pointer(uintptr(dst) + 4)
		src = unsafe.Pointer(uintptr(src) + 4)
	}
}

// The stack layout at the moment an interrupt occurs.
// Registers can be accessed if the stack pointer is cast to a pointer to this
// struct.
type interruptStack struct {
	R0  uintptr
	R1  uintptr
	R2  uintptr
	R3  uintptr
	R12 uintptr
	LR  uintptr
	PC  uintptr
	PSR uintptr
}
