0.23.0
---

* **command line**
  - add `-work` flag
  - add Go 1.18 support
  - add LLVM 14 support
  - `run`: add support for command-line parameters
  - `build`: calculate default output path if `-o` is not specified
  - `build`: add JSON output
  - `test`: support multiple test binaries with `-c`
  - `test`: support flags like `-v` on all targets (including emulated firmware)
* **compiler**
  - add support for ThinLTO
  - use compiler-rt from LLVM
  - `builder`: prefer GNU build ID over Go build ID for caching
  - `builder`: add support for cross compiling to Darwin
  - `builder`: support machine outlining pass in stacksize calculation
  - `builder`: disable asynchronous unwind tables
  - `compileopts`: fix emulator configuration on non-amd64 Linux architectures
  - `compiler`: move allocations > 256  bytes to the heap
  - `compiler`: fix incorrect `unsafe.Alignof` on some 32-bit architectures
  - `compiler`: accept alias for slice `cap` builtin
  - `compiler`: allow slices of empty structs
  - `compiler`: fix difference in aliases in interface methods
  - `compiler`: make `RawSyscall` an alias for `Syscall`
  - `compiler`: remove support for memory references in `AsmFull`
  - `loader`: only add Clang header path for CGo
  - `transform`: fix poison value in heap-to-stack transform
* **standard library**
  - `internal/fuzz`: add this package as a shim
  - `os`: implement readdir for darwin and linux
  - `os`: add `DirFS`, which is used by many programs to access readdir.
  - `os`: isWine: be compatible with older versions of wine, too
  - `os`: implement `RemoveAll`
  - `os`: Use a `uintptr` for `NewFile`
  - `os`: add stubs for `exec.ExitError` and `ProcessState.ExitCode`
  - `os`: export correct values for `DevNull` for each OS
  - `os`: improve support for `Signal` by fixing various bugs
  - `os`: implement `File.Fd` method
  - `os`: implement `UserHomeDir`
  - `os`: add `exec.ProcessState` stub
  - `os`: implement `Pipe` for darwin
  - `os`: define stub `ErrDeadlineExceeded`
  - `reflect`: add stubs for more missing methods
  - `reflect`: rename `reflect.Ptr` to `reflect.Pointer`
  - `reflect`: add `Value.FieldByIndexErr` stub
  - `runtime`: fix various small GC bugs
  - `runtime`: use memzero for leaking collector instead of manually zeroing objects
  - `runtime`: implement `memhash`
  - `runtime`: implement `fastrand`
  - `runtime`: add stub for `debug.ReadBuildInfo`
  - `runtime`: add stub for `NumCPU`
  - `runtime`: don't inline `runtime.alloc` with `-gc=leaking`
  - `runtime`: add `Version`
  - `runtime`: add stubs for `NumCgoCall` and `NumGoroutine`
  - `runtime`: stub {Lock,Unlock}OSThread on Windows
  - `runtime`: be able to deal with a very small heap
  - `syscall`: make `Environ` return a copy of the environment
  - `syscall`: implement getpagesize and munmap
  - `syscall`: `wasi`: define `MAP_SHARED` and `PROT_READ`
  - `syscall`: stub mmap(), munmap(), MAP_SHARED, PROT_READ, SIGBUS, etc. on nonhosted targets
  - `syscall`: darwin: more complete list of signals
  - `syscall`: `wasi`: more complete list of signals
  - `syscall`: stub `WaitStatus`
  - `syscall/js`: allow copyBytesTo(Go|JS) to use `Uint8ClampedArray`
  - `testing`: implement `TempDir`
  - `testing`: nudge type TB closer to upstream; should be a no-op change.
  - `testing`: on baremetal platforms, use simpler test matcher
* **targets**
  - `atsamd`: fix usbcdc initialization when `-serial=uart`
  - `atsamd51`: allow higher frequency when using SPI
  - `esp`: support CGo
  - `esp32c3`: add support for input pin
  - `esp32c3`: add support for GPIO interrupts
  - `esp32c3`: add support to receive UART data
  - `rp2040`: fix PWM bug at high frequency
  - `rp2040`: fix some minor I2C bugs
  - `rp2040`: fix incorrect inline assembly
  - `rp2040`: fix spurious i2c STOP during write+read transaction
  - `rp2040`: improve ADC support
  - `wasi`: remove `--export-dynamic` linker flag
  - `wasm`: remove heap allocator from wasi-libc
* **boards**
  - `circuitplay-bluefruit`: move pin mappings so board can be compiled for WASM use in Playground
  - `esp32-c3-12f`: add the ESP32-C3-12f Kit
  - `m5stamp-c3`: add pin setting of UART
  - `macropad-rp2040`: add the Adafruit MacroPad RP2040 board
  - `nano-33-ble`: typo in LPS22HB peripheral definition and documentation (#2579)
  - `teensy41`: add the Teensy 4.1 board
  - `teensy40`: add ADC support
  - `teensy40`: add SPI support
  - `thingplus-rp2040`: add the SparkFun Thing Plus RP2040 board
  - `wioterminal`: add DefaultUART
  - `wioterminal`: verify written data when flashing through OpenOCD
  - `xiao-ble`: add XIAO BLE nRF52840 support


0.22.0
---

* **command line**
  - add asyncify to scheduler flag help
  - support -run for tests
  - remove FreeBSD target support
  - add LLVM 12 and LLVM 13 support, use LLVM 13 by default
  - add support for ARM64 MacOS
  - improve help
  - check /run/media as well as /media on Linux for non-debian-based distros
  - `test`: set cmd.Dir even when running emulators
  - `info`: add JSON output using the `-json` flag
* **compiler**
  - `builder`: fix off-by-one in size calculation
  - `builder`: handle concurrent library header rename
  - `builder`: use flock to avoid double-compiles
  - `builder`: use build ID as cache key
  - `builder`: add -fno-stack-protector to musl build
  - `builder`: update clang header search path to look in /usr/lib
  - `builder`: explicitly disable unwind tables for ARM
  - `cgo`: add support for `C.CString` and related functions
  - `compiler`: fix ranging over maps with particular map types
  - `compiler`: add correct debug location to init instructions
  - `compiler`: fix emission of large object layouts
  - `compiler`: work around AVR atomics bugs
  - `compiler`: predeclare runtime.trackPointer
  - `interp`: work around AVR function pointers in globals
  - `interp`: run goroutine starts and checks at runtime
  - `interp`: always run atomic and volatile loads/stores at runtime
  - `interp`: bump timeout to 180 seconds
  - `interp`: handle type assertions on nil interfaces
  - `loader`: elminate goroot cache inconsistency
  - `loader`: respect $GOROOT when running `go list`
  - `transform`: allocate the correct amount of bytes in an alloca
  - `transform`: remove switched func lowering
* **standard library**
  - `crypto/rand`: show error if platform has no rng
  - `device/*`: add `*_Msk` field for each bit field and avoid duplicates
  - `device/*`: provide Set/Get for each register field described in the SVD files
  - `internal/task`: swap stack chain when switching goroutines
  - `internal/task`: remove `-scheduler=coroutines`
  - `machine`: add `Device` string constant
  - `net`: add bare Interface implementation
  - `net`: add net.Buffers
  - `os`: stub out support for some features
  - `os`: obey TMPDIR on unix, TMP on Windows, etc
  - `os`: implement `ReadAt`, `Mkdir`, `Remove`, `Stat`, `Lstat`, `CreateTemp`, `MkdirAll`, `Chdir`, `Chmod`, `Clearenv`, `Unsetenv`, `Setenv`, `MkdirTemp`, `Rename`, `Seek`, `ExpandEnv`, `Symlink`, `Readlink`
  - `os`: implement `File.Stat`
  - `os`: fix `IsNotExist` on nonexistent path
  - `os`: fix opening files on WASI in read-only mode
  - `os`: work around lack of `syscall.seek` on 386 and arm
  - `reflect`: make sure indirect pointers are handled correctly
  - `runtime`: allow comparing interfaces
  - `runtime`: use LLVM intrinsic to read the stack pointer
  - `runtime`: strengthen hashmap hash function for structs and arrays
  - `runtime`: fix float/complex hashing
  - `runtime`: fix nil map dereference
  - `runtime`: add realloc implementation to GCs
  - `runtime`: handle negative sleep times
  - `runtime`: correct GC scan bounds
  - `runtime`: remove extalloc GC
  - `rumtime`: implement `__sync` libcalls as critical sections for most microcontrollers
  - `runtime`: add stubs for `Func.FileLine` and `Frame.PC`
  - `sync`: fix concurrent read-lock on write-locked RWMutex
  - `sync`: add a package doc
  - `sync`: add tests
  - `syscall`: add support for `Mmap` and `Mprotect`
  - `syscall`: fix array size for mmap slice creation
  - `syscall`: enable `Getwd` in wasi
  - `testing`: add a stub for `CoverMode`
  - `testing`: support -bench option to run benchmarks matching the given pattern.
  - `testing`: support b.SetBytes(); implement sub-benchmarks.
  - `testing`: replace spaces with underscores in test/benchmark names, as upstream does
  - `testing`: implement testing.Cleanup
  - `testing`: allow filtering subbenchmarks with the `-bench` flag
  - `testing`: implement `-benchtime` flag
  - `testing`: print duration
  - `testing`: allow filtering of subtests using `-run`
* **targets**
  - `all`: change LLVM features to match vanilla Clang
  - `avr`: use interrupt-based timer which is much more accurate
  - `nrf`: fix races in I2C
  - `samd51`: implement TRNG for randomness
  - `stm32`: pull-up on I2C lines
  - `stm32`: fix timeout for i2c comms
  - `stm32f4`, `stm32f103`: initial implementation for ADC
  - `stm32f4`, `stm32f7`, `stm32l0x2`, `stm32l4`, `stm32l5`, `stm32wl`: TRNG implementation in crypto/rand
  - `stm32wl`: add I2C support
  - `windows`: add support for the `-size=` flag
  - `wasm`: add support for `tinygo test`
  - `wasi`, `wasm`: raise default stack size to 16 KiB
* **boards**
  - add M5Stack
  - add lorae5 (stm32wle) support
  - add Generic Node Sensor Edition
  - add STM32F469 Discovery
  - add M5Stamp C3
  - add Blues Wireless Swan
  - `bluepill`: add definitions for ADC pins
  - `stm32f4disco`: add definitions for ADC pins
  - `stm32l552ze`: use supported stlink interface
  - `microbit-v2`: add some pin definitions


0.21.0
---

* **command line**
  - drop support for LLVM 10
  - `build`: drop support for LLVM targets in the -target flag
  - `build`: fix paths in error messages on Windows
  - `build`: add -p flag to set parallelism
  - `lldb`: implement `tinygo lldb` subcommand
  - `test`: use emulator exit code instead of parsing test output
  - `test`: pass testing arguments to wasmtime
* **compiler**
  - use -opt flag for optimization level in CFlags (-Os, etc)
  - `builder`: improve accuracy of the -size=full flag
  - `builder`: hardcode some more frame sizes for __aeabi_* functions
  - `builder`: add support for -size= flag for WebAssembly
  - `cgo`: fix line/column reporting in syntax error messages
  - `cgo`: support function definitions in CGo headers
  - `cgo`: implement rudimentary C array decaying
  - `cgo`: add support for stdio in picolibc and wasi-libc
  - `cgo`: run CGo parser per file, not per CGo fragment
  - `compiler`: fix unintentionally exported math functions
  - `compiler`: properly implement div and rem operations
  - `compiler`: add support for recursive function types
  - `compiler`: add support for the `go` keyword on interface methods
  - `compiler`: add minsize attribute for -Oz
  - `compiler`: add "target-cpu" and "target-features" attributes
  - `compiler`: fix indices into strings and arrays
  - `compiler`: fix string compare functions
  - `interp`: simplify some code to avoid some errors
  - `interp`: support recursive globals (like linked lists) in globals
  - `interp`: support constant globals
  - `interp`: fix reverting of extractvalue/insertvalue with multiple indices
  - `transform`: work around renamed return type after merging LLVM modules
* **standard library**
  - `internal/bytealg`: fix indexing error in Compare()
  - `machine`: support Pin.Get() function when the pin is configured as output
  - `net`, `syscall`: Reduce code duplication by switching to internal/itoa.
  - `os`: don't try to read executable path on baremetal
  - `os`: implement Getwd
  - `os`: add File.WriteString and File.WriteAt
  - `reflect`: fix type.Size() to account for struct padding
  - `reflect`: don't construct an interface-in-interface value
  - `reflect`: implement Value.Elem() for interface values
  - `reflect`: fix Value.Index() in a specific case
  - `reflect`: add support for DeepEqual
  - `runtime`: add another set of invalid unicode runes to encodeUTF8()
  - `runtime`: only initialize os.runtime_args when needed
  - `runtime`: only use CRLF on baremetal systems for println
  - `runtime/debug`: stub `debug.SetMaxStack`
  - `runtime/debug`: stub `debug.Stack`
  - `testing`: add a stub for t.Parallel()
  - `testing`: add support for -test.short flag
  - `testing`: stub B.ReportAllocs()
  - `testing`: add `testing.Verbose`
  - `testing`: stub `testing.AllocsPerRun`
* **targets**
  - fix gen-device-svd to handle 64-bit values
  - add CPU and Features property to all targets
  - match LLVM triple to the one Clang uses
  - `atsam`: simplify definition of SERCOM UART, I2C and SPI peripherals
  - `atsam`: move I2S0 to machine file
  - `esp32`: fix SPI configuration
  - `esp32c3`: add support for GDB debugging
  - `esp32c3`: add support for CPU interrupts
  - `esp32c3`: use tasks scheduler by default
  - `fe310`: increase CPU frequency from 16MHz to 320MHz
  - `fe310`: add support for bit banging drivers
  - `linux`: build static binaries using musl
  - `linux`: reduce binary size by calling `write` instead of `putchar`
  - `linux`: add support for GOARM
  - `riscv`: implement 32-bit atomic operations
  - `riscv`: align the heap to 16 bytes
  - `riscv`: switch to tasks-based scheduler
  - `rp2040`: add CPUFrequency()
  - `rp2040`: improve I2C baud rate configuration
  - `rp2040`: add pin interrupt API
  - `rp2040`: refactor PWM code and fix Period calculation
  - `stm32f103`: fix SPI
  - `stm32f103`: make SPI frequency selection more flexible
  - `qemu`: signal correct exit code to QEMU
  - `wasi`: run C/C++ constructors at startup
  - `wasm`: ensure heapptr is aligned
  - `wasm`: update wasi-libc dependency
  - `wasm`: wasi: use asyncify
  - `wasm`: support `-scheduler=none`
  - `windows`: add support for Windows (amd64 only for now)
* **boards**
  - `feather-stm32f405`, `feather-rp2040`: add I2C pin names
  - `m5stack-core2`: add M5Stack Core2
  - `nano-33-ble`: SoftDevice s140v7 support
  - `nano-33-ble`: add constants for more on-board pins


0.20.0
---

* **command line**
  - add support for Go 1.17
  - improve Go version detection
  - add support for the Black Magic Probe (BMP)
  - add a flag for creating cpu profiles
* **compiler**
  - `builder:` list libraries at the end of the linker command
  - `builder:` strip debug information at link time instead of at compile time
  - `builder:` add missing error check for `ioutil.TempFile()`
  - `builder:` simplify running of jobs
  - `compiler:` move LLVM math builtin support into the compiler
  - `compiler:` move math aliases from the runtime to the compiler
  - `compiler:` add aliases for many hashing packages
  - `compiler:` add `*ssa.MakeSlice` bounds tests
  - `compiler:` fix max possible slice
  - `compiler:` add support for new language features of Go 1.17
  - `compiler:` fix equally named structs in different scopes
  - `compiler:` avoid zero-sized alloca in channel operations
  - `interp:` don't ignore array indices for untyped objects
  - `interp:` keep reverted package initializers in order
  - `interp:` fix bug in compiler-time/run-time package initializers
  - `loader:` fix panic in CGo files with syntax errors
  - `transform:` improve GC stack slot pass to work around a bug
* **standard library**
  - `crypto/rand`: switch to `arc4random_buf`
  - `math:` fix `math.Max` and `math.Min`
  - `math/big`: fix undefined symbols error
  - `net:` add MAC address implementation
  - `os:` implement `os.Executable`
  - `os:` add `SEEK_SET`, `SEEK_CUR`, and `SEEK_END`
  - `reflect:` add StructField.IsExported method
  - `runtime:` reset heapptr to heapStart after preinit()
  - `runtime:` add `subsections_via_symbols` to assembly files on darwin
  - `testing:` add subset implementation of Benchmark
  - `testing:` test testing package using `tinygo test`
  - `testing:` add support for the `-test.v` flag
* **targets**
  - `386:` bump minimum requirement to the Pentium 4
  - `arm:` switch to Thumb instruction set on ARM
  - `atsamd:` fix copy-paste error for atsamd21/51 calibTrim block
  - `baremetal`,`wasm`: support command line params and environment variables
  - `cortexm:` fix stack overflow because of unaligned stacks
  - `esp32c3:` add support for the ESP32-C3 from Espressif
  - `nrf52840:` fix ram size
  - `nxpmk66f18:` fix a suspicious bitwise operation
  - `rp2040:` add SPI support
  - `rp2040:` add I2C support
  - `rp2040:` add PWM implementation
  - `rp2040:` add openocd configuration
  - `stm32:` add support for PortMask* functions for WS2812 support
  - `unix:` fix time base for time.Now()
  - `unix:` check for mmap error and act accordingly
  - `wasm:` override dlmalloc heap implementation from wasi-libc
  - `wasm:` align heap to 16 bytes
  - `wasm:` add support for the crypto/rand package
* **boards**
  - add `DefaultUART` to adafruit boards
  - `arduino-mkrwifi1010:` add board definition for Arduino MKR WiFi 1010
  - `arduino-mkrwifi1010:` fix pin definition of `NINA_RESETN`
  - `feather-nrf52:` fix pin definition of uart
  - `feather-rp2040:` add pin name definition
  - `gameboy-advance:` fix ROM header
  - `mdbt50qrx-uf2:` add Raytac MDBT50Q-RX Dongle with TinyUF2
  - `nano-rp2040:` define `NINA_SPI` and fix wifinina pins
  - `teensy40:` enable hardware UART reconfiguration, fix receive watermark interrupt


0.19.0
---

* **command line**
  - don't consider compile-only tests as failing
  - add -test flag for `tinygo list`
  - escape commands while printing them with the -x flag
  - make flash-command portable and safer to use
  - use `extended-remote` instead of `remote` in GDB
  - detect specific serial port IDs based on USB vid/pid
  - add a flag to the command line to select the serial implementation
* **compiler**
  - `cgo`: improve constant parser
  - `compiler`: support chained interrupt handlers
  - `compiler`: add support for running a builtin in a goroutine
  - `compiler`: do not emit nil checks for loading closure variables
  - `compiler`: skip context parameter when starting regular goroutine
  - `compiler`: refactor method names
  - `compiler`: add function and global section pragmas
  - `compiler`: implement `syscall.rawSyscallNoError` in inline assembly
  - `interp`: ignore inline assembly in markExternal
  - `interp`: fix a bug in pointer cast workaround
  - `loader`: fix testing a main package
* **standard library**
  - `crypto/rand`: replace this package with a TinyGo version
  - `machine`: make USBCDC global a pointer
  - `machine`: make UART objects pointer receivers
  - `machine`: define Serial as the default output
  - `net`: add initial support for net.IP
  - `net`: add more net compatibility
  - `os`: add stub for os.ReadDir
  - `os`: add FileMode constants from Go 1.16
  - `os`: add stubs required for net/http
  - `os`: implement process related functions
  - `reflect`: implement AppendSlice
  - `reflect`: add stubs required for net/http
  - `runtime`: make task.Data a 64-bit integer to avoid overflow
  - `runtime`: expose memory stats
  - `sync`: implement NewCond
  - `syscall`: fix int type in libc version
* **targets**
  - `cortexm`: do not disable interrupts on abort
  - `cortexm`: bump default stack size to 2048 bytes
  - `nrf`: avoid heap allocation in waitForEvent
  - `nrf`: don't trigger a heap allocation in SPI.Transfer
  - `nrf52840`: add support for flashing with the BOSSA tool
  - `rp2040`: add support for GPIO input
  - `rp2040`: add basic support for ADC
  - `rp2040`: gpio and adc pin definitions
  - `rp2040`: implement UART
  - `rp2040`: patch elf to checksum 2nd stage boot
  - `stm32`: add PWM for most chips
  - `stm32`: add support for pin interrupts
  - `stm32f103`: add support for PinInputPullup / PinInputPulldown
  - `wasi`: remove wasm build tag
* **boards**
  - `feather-rp2040`: add support for this board
  - `feather-nrf52840-sense`: add board definition for this board
  - `pca10059`: support flashing from Windows
  - `nano-rp2040`: add this board
  - `nano-33-ble`: add support for this board
  - `pico`: add the Raspberry Pi Pico board with the new RP2040 chip
  - `qtpy`: add pin for neopixels
  - all: add definition for ws2812 for supported boards


0.18.0
---

* **command line**
  - drop support for Go 1.11 and 1.12
  - throw an error when no target is specified on Windows
  - improve error messages in `getDefaultPort()`, support for multiple ports
  - remove `-cflags` and `-ldflags` flags
  - implement `-ldflags="-X ..."`
  - add `-print-allocs` flag that lets you print all heap allocations
  - openocd commands in tinygo command line
  - add `-llvm-features` parameter
  - match `go test` output
  - discover USB ports only, this will ignore f.ex. bluetooth
  - use physicmal path instead of cached GOROOT in function getGoroot
  - add goroot for snap installs
* **compiler**
  - `builder`: add support for `-opt=0`
  - `builder`, `compiler`: compile and cache packages in parallel
  - `builder`: run interp per package
  - `builder`: cache C and assembly file outputs
  - `builder`: add support for `-x` flag to print commands
  - `builder`: add optsize attribute while building the package
  - `builder`: run function passes per package
  - `builder`: hard code Clang compiler
  - `compiler`: do not use `llvm.GlobalContext()`
  - `compiler`: remove SimpleDCE pass
  - `compiler`: do not emit nil checks for `*ssa.Alloc` instructions
  - `compiler`: merge `runtime.typecodeID` and runtime.typeInInterface
  - `compiler`: do not check for impossible type asserts
  - `compiler`: fix use of global context: `llvm.Int32Type()`
  - `compiler`: add interface IR test
  - `compiler`: fix lack of method name in interface matching
  - `compiler`: fix "fragment covers entire variable" bug
  - `compiler`: optimize string literals and globals
  - `compiler`: decouple func lowering from interface type codes
  - `compiler`: add function attributes to some runtime calls
  - `compiler`: improve position information in error messages
  - `cgo`: add support for CFLAGS in .c files
  - `interp`: support GEP on fixed (MMIO) addresses
  - `interp`: handle `(reflect.Type).Elem()`
  - `interp`: add support for runtime.interfaceMethod
  - `interp`: make toLLVMValue return an error instead of panicking
  - `interp`: add support for switch statement
  - `interp`: fix phi instruction
  - `interp`: remove map support
  - `interp`: support extractvalue/insertvalue with multiple operands
  - `transform`: optimize string comparisons against ""
  - `transform`: optimize `reflect.Type` `Implements()` method
  - `transform`: fix bug in interface lowering when signatures are renamed
  - `transform`: don't rely on struct name of `runtime.typecodeID`
  - `transform`: use IPSCCP pass instead of the constant propagation pass
  - `transform`: fix func lowering assertion failure
  - `transform`: do not lower zero-sized alloc to alloca
  - `transform`: split interface and reflect lowering
* **standard library**
  - `runtime`: add dummy debug package
  - `machine`: fix data shift/mask in newUSBSetup
  - `machine`: make `machine.I2C0` and similar objects pointers
  - `machine`: unify usbcdc code
  - `machine`: refactor PWM support
  - `machine`: avoid heap allocations in USB code
  - `reflect`: let `reflect.Type` be of interface type
  - `reflect`: implement a number of stub functions
  - `reflect`: check for access in the `Interface` method call
  - `reflect`: fix `AssignableTo` and `Implements` methods
  - `reflect`: implement `Value.CanAddr`
  - `reflect`: implement `Sizeof` and `Alignof` for func values
  - `reflect`: implement `New` function
  - `runtime`: implement command line arguments in hosted environments
  - `runtime`: implement environment variables for Linux
  - `runtime`: improve timers on nrf, and samd chips
* **targets**
  - all: use -Qunused-arguments only for assembly files
  - `atmega1280`: add PWM support
  - `attiny`: remove dummy UART
  - `atsamd21`: improve SPI
  - `atsamd51`: fix PWM support in atsamd51p20
  - `atsamd5x`: improve SPI
  - `atsamd51`, `atsame5x`: unify samd51 and same5x
  - `atsamd51`, `atsamd21`: fix `ADC.Get()` value at 8bit and 10bit
  - `atsame5x`: add support for CAN
  - `avr`: remove I2C stubs from attiny support
  - `cortexm`: check for `arm-none-eabi-gdb` and `gdb-multiarch` commands
  - `cortexm`: add `__isr_vector` symbol
  - `cortexm`: disable FPU on Cortex-M4
  - `cortexm`: clean up Cortex-M target files
  - `fe310`: fix SPI read
  - `gameboy-advance`: Fix RGBA color interpretation
  - `nrf52833`: add PWM support
  - `stm32l0`: use unified UART logic
  - `stm32`: move f103 (bluepill) to common i2c code
  - `stm32`: separate altfunc selection for UART Tx/Rx
  - `stm32`: i2c implementation for F7, L5 and L4 MCUs
  - `stm32`: make SPI CLK fast to fix data issue
  - `stm32`: support SPI on L4 series
  - `unix`: avoid possible heap allocation with `-opt=0`
  - `unix`: use conservative GC by default
  - `unix`: use the tasks scheduler instead of coroutines
  - `wasi`: upgrade WASI version to wasi_snapshot_preview1
  - `wasi`: darwin: support basic file io based on libc
  - `wasm`: only export explicitly exported functions
  - `wasm`: use WASI ABI for exit function
  - `wasm`: scan globals conservatively
* **boards**
  - `arduino-mega1280`: add support for the Arduino Mega 1280
  - `arduino-nano-new`: Add Arduino Nano w/ New Bootloader target
  - `atsame54-xpro`: add initial support this board
  - `feather-m4-can`: add initial support for this board
  - `grandcentral-m4`: add board support for Adafruit Grand Central M4 (SAMD51)
  - `lgt92`: update to new UART structure
  - `microbit`: remove LED constant
  - `microbit-v2`: add support for S113 SoftDevice
  - `nucleol432`: add support for this board
  - `nucleo-l031k6`: add this board
  - `pca10059`: initial support for this board
  - `qtpy`: fix msd-volume-name
  - `qtpy`: fix i2c setting
  - `teensy40`: move txBuffer allocation to UART declaration
  - `teensy40`: add UART0 as alias for UART1


0.17.0

---
* **command line**
  - switch to LLVM 11 for static builds
  - support gdb debugging with AVR
  - add support for additional openocd commands
  - add `-x` flag to print commands
  - use LLVM 11 by default when linking LLVM dynamically
  - update go-llvm to use LLVM 11 on macOS
  - bump go.bug.st/serial to version 1.1.2
  - do not build LLVM with libxml to work around a bugo on macOS
  - add support for Go 1.16
  - support gdb daemonization on Windows
  - remove support for LLVM 9, to fix CI
  - kill OpenOCD if it does not exit with a regular quit signal
  - support `-ocd-output` on Windows
* **compiler**
  - `builder`: parallelize most of the build
  - `builder`: remove unused cacheKey parameter
  - `builder`: add -mcpu flag while building libraries
  - `builder`: wait for running jobs to finish
  - `cgo`: add support for variadic functions
  - `compiler`: fix undefined behavior in wordpack
  - `compiler`: fix incorrect "exported function" panic
  - `compiler`: fix non-int integer constants (fixing a crash)
  - `compiler`: refactor and add tests
  - `compiler`: emit a nil check when slicing an array pointer
  - `compiler`: saturate float-to-int conversions
  - `compiler`: test float to int conversions and fix upper-bound calculation
  - `compiler`: support all kinds of deferred builtins
  - `compiler`: remove ir package
  - `compiler`: remove unnecessary main.main call workaround
  - `compiler`: move the setting of attributes to getFunction
  - `compiler`: create runtime types lazily when needed
  - `compiler`: move settings to a separate Config struct
  - `compiler`: work around an ARM backend bug in LLVM
  - `interp`: rewrite entire package
  - `interp`: fix alignment of untyped globals
  - `loader`: use name "main" for the main package
  - `loader`: support imports from vendor directories
  - `stacksize`: add support for DW_CFA_offset_extended
  - `transform`: show better error message in coroutines lowering
* **standard library**
  - `machine`: accept configuration struct for ADC parameters
  - `machine`: make I2C.Configure signature consistent
  - `reflect`: implement PtrTo
  - `runtime`: refactor to simplify stack switching
  - `runtime`: put metadata at the top end of the heap
* **targets**
  - `atsam`: add a length check to findPinPadMapping
  - `atsam`: improve USBCDC
  - `atsam`: avoid infinite loop when USBCDC is disconnected
  - `avr`: add SPI support for Atmega based chips
  - `avr`: use Clang for compiling C and assembly files
  - `esp32`: implement task based scheduler
  - `esp32`: enable the FPU
  - `esp8266`: implement task based scheduler
  - `esp`: add compiler-rt library
  - `esp`: add picolibc
  - `nrf`: refactor code a bit to reduce duplication
  - `nrf`: use SPIM peripheral instead of the legacy SPI peripheral
  - `nrf`: update nrfx submodule to latest commit
  - `nrf52840`: ensure that USB CDC interface is only initialized once
  - `nrf52840`: improve USBCDC
  - `stm32`: use stm32-rs SVDs which are of much higher quality
  - `stm32`: harmonization of UART logic
  - `stm32`: replace I2C addressable interface with simpler type
  - `stm32`: fix i2c and add stm32f407 i2c
  - `stm32`: revert change that adds support for channels in interrupts
  - `wasm`: implement a growable heap
  - `wasm`: fix typo in wasm_exec.js, syscall/js.valueLoadString()
  - `wasm`: Namespaced Wasm Imports so they don't conflict across modules, or reserved LLVM IR
  - `wasi`: support env variables based on libc
  - `wasi`: specify wasi-libc in a different way, to improve error message
* **boards**
  - `matrixportal-m4`: add support for board Adafruit Matrix Portal M4
  - `mkr1000`: add this board
  - `nucleo-f722ze`: add this board
  - `clue`: correct volume name and add alias for release version of Adafruit Clue board
  - `p1am-100`: add support for the P1AM-100 (similar to Arduino MKR)
  - `microbit-v2`: add initial support based on work done by @alankrantas thank you!
  - `lgt92`: support for STM32L0 MCUs and Dragino LGT92 device
  - `nicenano`: nice!nano board support
  - `circuitplay-bluefruit`: correct internal I2C pin mapping
  - `clue`: correct for lack of low frequency crystal
  - `digispark`: split off attiny85 target
  - `nucleo-l552ze`: implementation with CLOCK, LED, and UART
  - `nrf52840-mdk-usb-dongle`: add this board

0.16.0
---

* **command-line**
  - add initial support for LLVM 11
  - make lib64 clang include path check more robust
  - `build`: improve support for GOARCH=386 and add tests
  - `gdb`: add support for qemu-user targets
  - `test`: support non-host tests
  - `test`: add support for -c and -o flags
  - `test`: implement some benchmark stubs
* **compiler**
  - `builder`: improve detection of clang on Fedora
  - `compiler`: fix floating point comparison bugs
  - `compiler`: implement negate for complex numbers
  - `loader`: fix linkname in test binaries
  - `transform`: add missing return pointer restore for regular coroutine tail
    calls
* **standard library**
  - `machine`: switch default frequency to 4MHz
  - `machine`: clarify caller's responsibility in `SetInterrupt`
  - `os`: add `LookupEnv()` stub
  - `reflect`: implement `Swapper`
  - `runtime`: fix UTF-8 decoding
  - `runtime`: gc: use raw stack access whenever possible
  - `runtime`: use dedicated printfloat32
  - `runtime`: allow ranging over a nil map
  - `runtime`: avoid device/nxp dependency in HardFault handler
  - `testing`: implement dummy Helper method
  - `testing`: add Run method
* **targets**
  - `arm64`: add support for SVCall intrinsic
  - `atsamd51`: avoid panic when configuring SPI with SDI=NoPin
  - `avr`: properly support the `.rodata` section
  - `esp8266`: implement `Pin.Get` function
  - `nintendoswitch`: fix crash when printing long lines (> 120)
  - `nintendoswitch`: add env parser and removed unused stuff
  - `nrf`: add I2C error checking
  - `nrf`: give more flexibility in picking SPI speeds
  - `nrf`: fix nrf52832 flash size
  - `stm32f103`: support wakeups from interrupts
  - `stm32f405`: add SPI support
  - `stm32f405`: add I2C support
  - `wasi`: add support for this target
  - `wasi`: use 'generic' ABI by default
  - `wasi`: remove --no-threads flag from wasm-ld
  - `wasm`: add instanceof support for WebAssembly
  - `wasm`: use fixed length buffer for putchar
* **boards**
  - `d1mini`: add this ESP8266 based board
  - `esp32`: use board definitions instead of chip names
  - `qtpy`: add board definition for Adafruit QTPy
  - `teensy40`: add this board

0.15.0
---

* **command-line**
  - add cached GOROOT to info subcommand
  - embed git-hash in tinygo-dev executable
  - implement tinygo targets to list usable targets
  - use simpler file copy instead of file renaming to avoid issues on nrf52840 UF2 bootloaders
  - use ToSlash() to specify program path
  - support flashing esp32/esp8266 directly from tinygo
  - when flashing call PortReset only on other than openocd
* **compiler**
  - `compileopts`: add support for custom binary formats
  - `compiler`: improve display of goroutine wrappers
  - `interp`: don't panic in the Store method
  - `interp`: replace some panics with error messages
  - `interp`: show error line in first line of the traceback
  - `loader`: be more robust when creating the cached GOROOT
  - `loader`: rewrite/refactor much of the code to use go list directly
  - `loader`: use ioutil.TempDir to create a temporary directory
  - `stacksize`: deal with DW_CFA_advance_loc1
* **standard library**
  - `runtime`: use waitForEvents when appropriate
* **wasm**
  - `wasm`: Remove --no-threads from wasm-ld calls.
  - `wasm`: update wasi-libc dependency
* **targets**
  - `arduino-mega2560`: fix flashing on Windows
  - `arm`: automatically determine stack sizes
  - `arm64`: make dynamic loader structs and constants private
  - `avr`: configure emulator in board files
  - `cortexm`: fix stack size calculation with interrupts
  - `flash`: add openocd settings to atsamd21 / atsamd51
  - `flash`: add openocd settings to nrf5
  - `microbit`: reelboard: flash using OpenOCD when needed
  - `nintendoswitch`: Add dynamic loader for runtime loading PIE sections
  - `nintendoswitch`: fix import cycle on dynamic_arm64.go
  - `nintendoswitch`: Fix invalid memory read / write in print calls
  - `nintendoswitch`: simplified assembly code
  - `nintendoswitch`: support outputting .nro files directly
* **boards**
  - `arduino-zero`: Adding support for the Arduino Zero (#1365)
  - `atsamd2x`: fix BAUD value
  - `atsamd5x`: fix BAUD value
  - `bluepill`: Enable stm32's USART2 for the board and map it to UART1 tinygo's device
  - `device/atsamd51x`: add all remaining bitfield values for PCHCTRLm Mapping
  - `esp32`: add libgcc ROM functions to linker script
  - `esp32`: add SPI support
  - `esp32`: add support for basic GPIO
  - `esp32`: add support for the Espressif ESP32 chip
  - `esp32`: configure the I/O matrix for GPIO pins
  - `esp32`: export machine.PortMask* for bitbanging implementations
  - `esp8266`: add support for this chip
  - `machine/atsamd51x,runtime/atsamd51x`: fixes needed for full support for all PWM pins. Also adds some useful constants to clarify peripheral clock usage
  - `machine/itsybitsy-nrf52840`: add support for Adafruit Itsybitsy nrf52840 (#1243)
  - `machine/stm32f4`: refactor common code and add new build tag stm32f4 (#1332)
  - `nrf`: add SoftDevice support for the Circuit Playground Bluefruit
  - `nrf`: call sd_app_evt_wait when the SoftDevice is enabled
  - `nrf52840`: add build tags for SoftDevice support
  - `nrf52840`: use higher priority for USB-CDC code
  - `runtime/atsamd51x`: use PCHCTRL_GCLK_SERCOMX_SLOW for setting clocks on all SERCOM ports
  - `stm32f405`: add basic UART handler
  - `stm32f405`: add STM32F405 machine/runtime, and new board/target feather-stm32f405
* **build**
  - `all`: run test binaries in the correct directory
  - `build`: Fix arch release job
  - `ci`: run `tinygo test` for known-working packages
  - `ci`: set git-fetch-depth to 1
  - `docker`: fix the problem with the wasm build (#1357)
  - `Makefile`: check whether submodules have been downloaded in some common cases
* **docs**
  - add ESP32, ESP8266, and Adafruit Feather STM32F405 to list of supported boards

0.14.1
---
* **command-line**
  - support for Go 1.15
* **compiler**
  - loader:  work around Windows symlink limitation

0.14.0
---
* **command-line**
  - fix `getDefaultPort()` on non-English Windows locales
  - compileopts: improve error reporting of unsupported flags
  - fix test subcommand
  - use auto-retry to locate MSD for UF2 and HEX flashing
  - fix touchSerialPortAt1200bps on Windows
  - support package names with backslashes on Windows
* **compiler**
  - fix a few crashes due to named types
  - add support for atomic operations
  - move the channel blocked list onto the stack
  - fix -gc=none
  - fix named string to `[]byte` slice conversion
  - implement func value and builtin defers
  - add proper parameter names to runtime.initAll, to fix a panic
  - builder: fix picolibc include path
  - builder: use newer version of gohex
  - builder: try to determine stack size information at compile time
  - builder: remove -opt=0
  - interp: fix sync/atomic.Value load/store methods
  - loader: add Go module support
  - transform: fix debug information in func lowering pass
  - transform: do not special-case zero or one implementations of a method call
  - transform: introduce check for method calls on nil interfaces
  - transform: gc: track 0-index GEPs to fix miscompilation
* **cgo**
  - Add LDFlags support
* **standard library**
  - extend stdlib to allow import of more packages
  - replace master/slave terminology with appropriate alternatives (MOSI->SDO
    etc)
  - `internal/bytealg`: reimplement bytealg in pure Go
  - `internal/task`: fix nil panic in (*internal/task.Stack).Pop
  - `os`: add Args and stub it with mock data
  - `os`: implement virtual filesystem support
  - `reflect`: add Cap and Len support for map and chan
  - `runtime`: fix return address in scheduler on RISC-V
  - `runtime`: avoid recursion in printuint64 function
  - `runtime`: replace ReadRegister with AsmFull inline assembly
  - `runtime`: fix compilation errors when using gc.extalloc
  - `runtime`: add cap and len support for chans
  - `runtime`: refactor time handling (improving accuracy)
  - `runtime`: make channels work in interrupts
  - `runtime/interrupt`: add cross-chip disable/restore interrupt support
  - `sync`: implement `sync.Cond`
  - `sync`: add WaitGroup
* **targets**
  - `arm`: allow nesting in DisableInterrupts and EnableInterrupts
  - `arm`: make FPU configuraton consistent
  - `arm`: do not mask fault handlers in critical sections
  - `atmega2560`: fix pin mapping for pins D2, D5 and the L port
  - `atsamd`: return an error when an incorrect PWM pin is used
  - `atsamd`: add support for pin change interrupts
  - `atsamd`: add DAC support
  - `atsamd21`: add more ADC pins
  - `atsamd51`: fix ROM / RAM size on atsamd51j20
  - `atsamd51`: add more pins
  - `atsamd51`: add more ADC pins
  - `atsamd51`: add pin change interrupt settings
  - `atsamd51`: extend pinPadMapping
  - `arduino-nano33`: use (U)SB flag to ensure that device can be found when
     not on default port
  - `arduino-nano33`: remove (d)ebug flag to reduce console noise when flashing
  - `avr`: use standard pin numbering
  - `avr`: unify GPIO pin/port code
  - `avr`: add support for PinInputPullup
  - `avr`: work around codegen bug in LLVM 10
  - `avr`: fix target triple
  - `fe310`: remove extra println left in by mistake
  - `feather-nrf52840`: add support for the Feather nRF52840
  - `maixbit`: add board definition and dummy runtime
  - `nintendoswitch`: Add experimental Nintendo Switch support without CRT
  - `nrf`: expose the RAM base address
  - `nrf`: add support for pin change interrupts
  - `nrf`: add microbit-s110v8 target
  - `nrf`: fix bug in SPI.Tx
  - `nrf`: support debugging the PCA10056
  - `pygamer`: add Adafruit PyGamer suport
  - `riscv`: fix interrupt configuration bug
  - `riscv`: disable linker relaxations during gp init
  - `stm32f4disco`: add new target with ST-Link v2.1 debugger
  - `teensy36`: add Teensy 3.6 support
  - `wasm`: fix event handling
  - `wasm`: add --no-demangle linker option
  - `wioterminal`: add support for the Seeed Wio Terminal
  - `xiao`: add support for the Seeed XIAO

0.13.1
---
* **standard library**
  - `runtime`: do not put scheduler and GC code in the same section
  - `runtime`: copy stack scan assembly for GBA
* **boards**
  - `gameboy-advance`: always use ARM mode instead of Thumb mode


0.13.0
---
* **command line**
  - use `gdb-multiarch` for debugging Cortex-M chips
  - support `tinygo run` with simavr
  - support LLVM 10
  - support Go 1.14
  - retry 3 times when attempting to do a 1200-baud reset
* **compiler**
  - mark the `abort` function as noreturn
  - fix deferred calls to exported functions
  - add debug info for local variables
  - check for channel size limit
  - refactor coroutine lowering
  - add `dereferenceable_or_null` attribute to pointer parameters
  - do not perform nil checking when indexing slices and on `unsafe.Pointer`
  - remove `runtime.isnil` hack
  - use LLVM builtins for runtime `memcpy`/`memmove`/`memzero` functions
  - implement spec-compliant shifts on negative/overflow
  - support anonymous type asserts
  - track pointer result of string concatenation for GC
  - track PHI nodes for GC
  - add debug info to goroutine start wrappers
  - optimize comparing interface values against nil
  - fix miscompilation when deferring an interface call
  - builder: include picolibc for most baremetal targets
  - builder: run tools (clang, lld) as separate processes
  - builder: use `-fshort-enums` consistently
  - interp: add support for constant type asserts
  - interp: better support for interface operations
  - interp: include backtrace with error
  - transform: do not track const globals for GC
  - transform: replace panics with source locations
  - transform: fix error in interface lowering pass
  - transform: make coroutine lowering deterministic
  - transform: fix miscompilation in func lowering
* **cgo**
  - make `-I` and `-L` paths absolute
* **standard library**
  - `machine`: set the USB VID and PID to the manufacturer values
  - `machine`: correct USB CDC composite descriptors
  - `machine`: move `errors.New` calls to globals
  - `runtime`: support operations on nil maps
  - `runtime`: fix copy builtin return value on AVR
  - `runtime`: refactor goroutines
  - `runtime`: support `-scheduler=none` on most platforms
  - `runtime`: run package initialization in the main goroutine
  - `runtime`: export `malloc` / `free` for use from C
  - `runtime`: add garbage collector that uses an external allocator
  - `runtime`: scan callee-saved registers while marking the stack
  - `runtime`: remove recursion from conservative GC
  - `runtime`: fix blocking select on nil channel
  - `runtime/volatile`: include `ReplaceBits` method
  - `sync`: implement trivial `sync.Map`
* **targets**
  - `arm`: use `-fomit-frame-pointer`
  - `atmega1284`: support this chip for testing purposes
  - `atsamd51`: make QSPI available on all boards
  - `atsamd51`: add support for ADC1
  - `atsamd51`: use new interrupt registration in UART code
  - `attiny`: clean up pin definitions
  - `avr`: use the correct RAM start address
  - `avr`: pass the correct `-mmcu` flag to the linker
  - `avr`: add support for tasks scheduler (disabled by default)
  - `avr`: fix linker problem with overlapping program/data areas
  - `nrf`: fix typo in pin configuration options
  - `nrf`: add lib/nrfx/mdk to include dirs
  - `nrf52840`: implement USB-CDC
  - `riscv`: implement VirtIO target and add RISC-V integration test
  - `riscv`: add I2C support for the HiFive1 rev B board
  - `stm32`: refactor GPIO pin handling
  - `stm32`: refactor UART code
  - `stm32f4`: add SPI
  - `wasm`: support Go 1.14 (breaking previous versions)
  - `wasm`: support `syscall/js.CopyBytesToJS`
  - `wasm`: sync polyfills from Go 1.14.
* **boards**
  - `arduino-mega2560`: add the Arduino Mega 2560
  - `clue-alpha`: add the Adafruit CLUE Alpha
  - `gameboy-advance`: enable debugging with GDB
  - `particle-argon`: add the Particle Argon board
  - `particle-boron`: add the Particle Boron board
  - `particle-xenon`: add the Particle Xenon board
  - `reelboard`: add `reelboard-s140v7` SoftDevice target

0.12.0
---
* **command line**
  - add initial FreeBSD support
  - remove getting a serial port in gdb subcommand
  - add support for debugging through JLinkGDBServer
  - fix CGo when cross compiling
  - remove default port check for Digispark as micronucleus communicates directly using HID
  - differentiate between various serial/USB error messages
* **builder**
  - improve detection of Clang headers
* **compiler**
  - fix assertion on empty interface
  - don't crash when encountering `types.Invalid`
  - revise defer to use heap allocations when running a variable number of times
  - improve error messages for failed imports
  - improve "function redeclared" error
  - add globaldce pass to start of optimization pipeline
  - add support for debugging globals
  - implement RISC-V CSR operations as intrinsics
  - add support for CGO_ENABLED environment variable
  - do not emit debug info for extern globals (bugfix)
  - add support for interrupts
  - implement maps for arbitrary keys
  - interp: error location for "unknown GEP" error
  - wasm-abi: create temporary allocas in the entry block
* **cgo**
  - add support for symbols in `#define`
  - fix a bug in number tokenization
* **standard library**
  - `machine`: avoid bytes package in USB logic
  - `runtime`: fix external address declarations
  - `runtime`: provide implementation for `internal/bytealg.IndexByte`
* **targets**
  - `atsamd51`: fix volatile usage
  - `atsamd51`: fix ADC, updating to 12-bits precision
  - `atsamd51`: refactor SPI pin configuration to only look at pin numbers
  - `atsamd51`: switch UART to use new pin configuration
  - `atsamd51`: fix obvious bug in I2C code
  - `atsamd51`: use only the necessary UART interrupts
  - `atsamd51`: refactor I2C pin handling to auto-detect pin mode
  - `avr`: use a garbage collector
  - `fe310`: use CLINT peripheral for timekeeping
  - `fe310`: add support for PLIC interrupts
  - `fe310`: implement UART receive interrupts
  - `riscv`: support sleeping in QEMU
  - `riscv`: add bare-bones interrupt support
  - `riscv`: print exception PC and code
  - `wasm`: implement memcpy and memset
  - `wasm`: include wasi-libc
  - `wasm`: use wasi ABI for basic startup/stdout
* **boards**
  - `arduino`: make avrdude command line compatible with Windows
  - `arduino-nano`: add this board
  - `arduino-nano33`: fix UART1 and UART2
  - `circuitplay-bluefruit`: add this board
  - `digispark`: add clock speed and pin mappings
  - `gameboy-advance`: include compiler-rt in build
  - `gameboy-advance`: implement interrupt handler
  - `hifive1b`: add support for gdb subcommand
  - `pyportal`: add this board
  - `pyportal`: remove manual SPI pin mapping as now handled by default


0.11.0
---
* **command line**
  - add support for QEMU in `gdb` subcommand
  - use builtin Clang when building statically, dropping the clang-9 dependency
  - search for default serial port on both macOS and Linux
  - windows: support `tinygo flash` directly by using win32 wmi
* **compiler**
  - add location information to the IR checker
  - make reflection sidetables constant globals
  - improve error locations in goroutine lowering
  - interp: improve support for maps with string keys
  - interp: add runtime fallback for mapassign operations
* **standard library**
  - `machine`: add support for `SPI.Tx()` on play.tinygo.org
  - `machine`: rename `CPU_FREQUENCY` to `CPUFrequency()`
* **targets**
  - `adafruit-pybadge`: add Adafruit Pybadge
  - `arduino-nano33`: allow simulation on play.tinygo.org
  - `arduino-nano33`: fix default SPI pin numbers to be D13/D11/D12
  - `circuitplay-express`: allow simulation on play.tinygo.org
  - `hifive1-qemu`: add target for testing RISC-V bare metal in QEMU
  - `riscv`: fix heap corruption due to changes in LLVM 9
  - `riscv`: add support for compiler-rt
  - `qemu`: rename to `cortex-m-qemu`

0.10.0
---
* **command line**
  - halt GDB after flashing with `gdb` subcommand
  - fix a crash when using `-ocd-output`
  - add `info` subcommand
  - add `-programmer` flag
* **builder**
  - macos: use llvm@8 instead of just llvm in paths
  - add `linkerscript` key to target JSON files
  - write a symbol table when writing out the compiler-rt lib
  - make Clang header detection more robust
  - switch to LLVM 9
* **compiler**
  - fix interface miscompilation with reflect
  - fix miscompile of static goroutine calls to closures
  - fix `todo: store` panic
  - fix incorrect starting value for optimized allocations in a loop
  - optimize coroutines on non-Cortex-M targets
  - fix crash for programs which have heap allocations but never hit the GC
  - add support for async interface calls
  - fix inserting non-const values in a const global
  - interp: improve error reporting
  - interp: implement comparing ptrtoint to 0
* **cgo**
  - improve diagnostics
  - implement the constant parser (for `#define`) as a real parser
  - rename reserved field names such as `type`
  - avoid `"unsafe" imported but not used` error
  - include all enums in the CGo Go AST
  - add support for nested structs and unions
  - implement `#cgo CFLAGS`
* **standard library**
  - `reflect`: add implementation of array alignment
  - `runtime`: improve scheduler performance when no goroutines are queued
  - `runtime`: add blocking select
  - `runtime`: implement interface equality in non-trivial cases
  - `runtime`: add AdjustTimeOffset to update current time
  - `runtime`: only implement CountString for required platforms
  - `runtime`: use MSP/PSP registers for scheduling on Cortex-M
* **targets**
  - `arm`: add system timer registers
  - `atmega`: add port C GPIO support
  - `atsamd21`: correct handling of pins >= 32
  - `atsamd21`: i2s initialization fixes
  - `atsamd51`: fix clock init code
  - `atsamd51`: correct initialization for RTC
  - `atsamd51`: fix pin function selection
  - `atsamd51`: pin method cleanup
  - `atsamd51`: allow setting pin mode for each of the SPI pins
  - `atsamd51`: correct channel init and pin map for ADC based on ItsyBitsy-M4
  - `feather-m4`: add Adafruit Feather M4 board
  - `hifive1b`: add support for SPI1
  - `hifive1b`: fix compiling in simulation
  - `linux`: fix time on arm32
  - `metro-m4`: add support for Adafruit Metro M4 Express Airlift board
  - `metro-m4`: fixes for UART2
  - `pinetime-devkit0`: add support for the PineTime dev kit
  - `x9pro`: add support for this smartwatch
  - `pca10040-s132v6`: add support for SoftDevice
  - `pca10056-s140v7`: add support for SoftDevice
  - `arduino-nano33`: added SPI1 connected to NINA-W102 chip on Arduino Nano 33 IOT

0.9.0
---
* **command line**
  - implement 1200-baud UART bootloader reset when flashing boards that support
    it
  - flash using mass-storage device for boards that support it
  - implement `tinygo env`
  - add support for Windows (but not yet producing Windows binaries)
  - add Go version to `tinygo env`
  - update SVD files for up-to-date peripheral interfaces
* **compiler**
  - add `//go:align` pragma
  - fix bug related to type aliases
  - add support for buffered channels
  - remove incorrect reflect optimization
  - implement copying slices in init interpretation
  - add support for constant indices with a named type
  - add support for recursive types like linked lists
  - fix miscompile of function nil panics
  - fix bug related to goroutines
* **standard library**
  - `machine`: do not check for nil slices in `SPI.Tx`
  - `reflectlite`: add support for Go 1.13
  - `runtime`: implement `internal/bytealg.CountString`
  - `sync`: properly handle nil `New` func in `sync.Pool`
* **targets**
  - `arduino`: fix .bss section initialization
  - `fe310`: implement `Pin.Get`
  - `gameboy-advance`: support directly outputting .gba files
  - `samd`: reduce code size by avoiding reflection
  - `samd21`: do not hardcode pin numbers for peripherals
  - `stm32f103`: avoid issue with `time.Sleep` less than 200µs

0.8.0
---
* **command line**
  - fix parsing of beta Go versions
  - check the major/minor installed version of Go before compiling
  - validate `-target` flag better to not panic on an invalid target
* **compiler**
  - implement full slice expression: `s[:2:4]`
  - fix a crash when storing a linked list in an interface
  - fix comparing struct types by making type IDs more unique
  - fix some bugs in IR generation
  - add support for linked lists in reflect data
  - implement `[]rune` to string conversion
  - implement support for `go` on func values
* **standard library**
  - `reflect`: add support for named types
  - `reflect`: add support for `t.Bits()`
  - `reflect`: add basic support for `t.AssignableTo()`
  - `reflect`: implement `t.Align()`
  - `reflect`: add support for struct types
  - `reflect`: fix bug in `v.IsNil` and `v.Pointer` for addressable values
  - `reflect`: implement support for array types
  - `reflect`: implement `t.Comparable()`
  - `runtime`: implement stack-based scheduler
  - `runtime`: fix bug in the sleep queue of the scheduler
  - `runtime`: implement `memcpy` for Cortex-M
  - `testing`: implement stub `testing.B` struct
  - `testing`: add common test logging methods such as Errorf/Fatalf/Printf
* **targets**
  - `386`: add support for linux/386 syscalls
  - `atsamd21`: make SPI pins configurable so that multiple SPI ports can be
    used
  - `atsamd21`: correct issue with invalid first reading coming from ADC
  - `atsamd21`: add support for reset-to-bootloader using 1200baud over USB-CDC
  - `atsamd21`: make pin selection more flexible for peripherals
  - `atsamd21`: fix minimum delay in `time.Sleep`
  - `atsamd51`: fix minimum delay in `time.Sleep`
  - `nrf`: improve SPI write-only speed, by making use of double buffering
  - `stm32f103`: fix SPI frequency selection
  - `stm32f103`: add machine.Pin.Get method for reading GPIO values
  - `stm32f103`: allow board specific UART usage
  - `nucleo-f103rb`: add support for NUCLEO-F103RB board
  - `itsybitsy-m4`: add support for this board with a SAMD51 family chip
  - `cortex-m`: add support for `arm.SystemReset()`
  - `gameboy-advance`: add initial support for the GameBoy Advance
  - `wasm`: add `//go:wasm-module` magic comment to set the wasm module name
  - `wasm`: add syscall/js.valueSetIndex support
  - `wasm`: add syscall/js.valueInvoke support

0.7.1
---
* **targets**
  - `atsamd21`: add support for the `-port` flag in the flash subcommand

0.7.0
---
* **command line**
  - try more locations to find Clang built-in headers
  - add support for `tinygo test`
  - build current directory if no package is specified
  - support custom .json target spec with `-target` flag
  - use zversion.go to detect version of GOROOT version
  - make initial heap size configurable for some targets (currently WebAssembly
    only)
* **cgo**
  - add support for bitfields using generated getters and setters
  - add support for anonymous structs
* **compiler**
  - show an error instead of panicking on duplicate function definitions
  - allow packages like github.com/tinygo-org/tinygo/src/\* by aliasing it
  - remove `//go:volatile` support  
    It has been replaced with the runtime/volatile package.
  - allow poiners in map keys
  - support non-constant syscall numbers
  - implement non-blocking selects
  - add support for the `-tags` flag
  - add support for `string` to `[]rune` conversion
  - implement a portable conservative garbage collector (with support for wasm)
  - add the `//go:noinline` pragma
* **standard library**
  - `os`: add `os.Exit` and `syscall.Exit`
  - `os`: add several stubs
  - `runtime`: fix heap corruption in conservative GC
  - `runtime`: add support for math intrinsics where supported, massively
    speeding up some benchmarks
  - `testing`: add basic support for testing
* **targets**
  - add support for a generic target that calls `__tinygo_*` functions for
    peripheral access
  - `arduino-nano33`: add support for this board
  - `hifive1`: add support for this RISC-V board
  - `reelboard`: add e-paper pins
  - `reelboard`: add `PowerSupplyActive` to enable voltage for on-board devices
  - `wasm`: put the stack at the start of linear memory, to detect stack
    overflows

0.6.0
---
* **command line**
  - some portability improvements
  - make `$GOROOT` more robust and configurable
  - check for Clang at the Homebrew install location as fallback
* **compiler driver**
  - support multiple variations of LLVM commands, for non-Debian distributions
* **compiler**
  - improve code quality in multiple ways
  - make panic configurable, adding trap on panic
  - refactor many internal parts of the compiler
  - print all errors encountered during compilation
  - implement calling function values of a named type
  - implement returning values from blocking functions
  - allow larger-than-int values to be sent across a channel
  - implement complex arithmetic
  - improve hashmap support
  - add debuginfo for function arguments
  - insert nil checks on stores (increasing code size)
  - implement volatile operations as compiler builtins
  - add `//go:inline` pragma
  - add build tags for the Go stdlib version
* **cgo**
  - implement `char`, `enum` and `void*` types
  - support `#include` for builtin headers
  - improve typedef/struct/enum support
  - only include symbols that are necessary, for broader support
  - mark external function args as `nocapture`
  - implement support for some `#define` constants
  - implement support for multiple CGo files in a single package
- **standard library**
  - `machine`: remove microbit matrix (moved to drivers repository)
  - `machine`: refactor pins to use `Pin` type instead of `GPIO`
  - `runtime`: print more interface types on panic, including `error`
* **targets**
  - `arm`: print an error on HardFault (including stack overflows)
  - `atsamd21`: fix a bug in the ADC peripheral
  - `atsamd21`: add support for I2S
  - `feather-m0`: add support for this board
  - `nrf51`: fix a bug in I2C
  - `stm32f103xx`: fix a bug in I2C
  - `syscall`: implement `Exit` on unix
  - `trinket-m0`: add support for this board
  - `wasm`: make _main_ example smaller
  - `wasm`: don't cache wasm file in the server, for ease of debugging
  - `wasm`: work around bug #41508 that caused a deadlock while linking
  - `wasm`: add support for `js.FuncOf`

0.5.0
---
- **compiler driver**
  - use `wasm-ld` instead of `wasm-ld-8` on macOS
  - drop dependency on `llvm-ar`
  - fix linker script includes when running outside `TINYGOROOT`
- **compiler**
  - switch to LLVM 8
  - add support for the Go 1.12 standard library (Go 1.11 is still supported)
  - work around lack of escape analysis due to nil checks
  - implement casting named structs and pointers to them
  - fix int casting to use the source signedness
  - fix some bugs around `make([]T, …)` with uncommon index types
  - some other optimizations
  - support interface asserts in interp for "math/rand" support
  - resolve all func value targets at compile time (wasm-only at the moment)
- **cgo**
  - improve diagnostics
  - implement C `struct`, `union`, and arrays
  - fix CGo-related crash in libclang
  - implement `C.struct_` types
- **targets**
  - all baremetal: pretend to be linux/arm instead of js/wasm
  - `avr`: improve `uintptr` support
  - `cortexm`: implement memmove intrinsic generated by LLVM
  - `cortexm`: use the lld linker instead of `arm-none-eabi-ld`
  - `darwin`: use custom syscall package that links to libSystem.dylib
  - `microbit`: add blink example
  - `samd21`: support I2C1
  - `samd21`: machine/atsamd21: correct pad/pin handling when using both UART
     and USBCDC interfaces at same time
  - `stm32f4discovery`: add support for this board
  - `wasm`: support async func values
  - `wasm`: improve documentation and add extra example

0.4.1
---
- **compiler**
  - fix `objcopy` replacement to include the .data section in the firmware image
  - use `llvm-ar-7` on Linux to fix the Docker image

0.4.0
---
- **compiler**
  - switch to the hardfloat ABI on ARM, which is more widely used
  - avoid a dependency on `objcopy` (`arm-none-eabi-objcopy` etc.)
  - fix a bug in `make([]T, n)` where `n` is 64-bits on a 32-bit platform
  - adapt to a change in the AVR backend in LLVM 8
  - directly support the .uf2 firmware format as used on Adafruit boards
  - fix a bug when calling `panic()` at init time outside of the main package
  - implement nil checks, which results in a ~5% increase in code size
  - inline slice bounds checking, which results in a ~1% decrease in code size
- **targets**
  - `samd21`: fix a bug in port B pins
  - `samd21`: implement SPI peripheral
  - `samd21`: implement ADC peripheral
  - `stm32`: fix a bug in timekeeping
  - `wasm`: fix a bug in `wasm_exec.js` that caused corruption in linear memory
     when running on Node.js.

0.3.0
---
- **compiler**
  - remove old `-initinterp` flag
  - add support for macOS
- **cgo**
  - add support for bool/float/complex types
- **standard library**
  - `device/arm`: add support to disable/enable hardware interrupts
  - `machine`: add CPU frequency for nrf-based boards
  - `syscall`: add support for darwin/amd64
- **targets**
  - `circuitplay_express`: add support for this board
  - `microbit`: add regular pin constants
  - `samd21`: fix time function for goroutine support
  - `samd21`: add support for USB-CDC (serial over USB)
  - `samd21`: add support for pins in port B
  - `samd21`: add support for pullup and pulldown pins
  - `wasm`: add support for Safari in example


0.2.0
---
- **command line**
  - add version subcommand
- **compiler**
  - fix a bug in floating point comparisons with NaN values
  - fix a bug when calling `panic` in package initialization code
  - add support for comparing `complex64` and `complex128`
- **cgo**
  - add support for external globals
  - add support for pointers and function pointers
- **standard library**
  - `fmt`: initial support, `fmt.Println` works
  - `math`: support for most/all functions
  - `os`: initial support (only stdin/stdout/stderr)
  - `reflect`: initial support
  - `syscall`: add support for amd64, arm, and arm64
