//go:build darwin || nintendoswitch || wasi
// +build darwin nintendoswitch wasi

package syscall

import (
	"unsafe"
)

type sliceHeader struct {
	buf *byte
	len uintptr
	cap uintptr
}

func Close(fd int) (err error) {
	if libc_close(int32(fd)) < 0 {
		err = getErrno()
	}
	return
}

func Dup(fd int) (fd2 int, err error) {
	fd2 = int(libc_dup(int32(fd)))
	if fd2 < 0 {
		err = getErrno()
	}
	return
}

func Write(fd int, p []byte) (n int, err error) {
	buf, count := splitSlice(p)
	n = libc_write(int32(fd), buf, uint(count))
	if n < 0 {
		err = getErrno()
	}
	return
}

func Read(fd int, p []byte) (n int, err error) {
	buf, count := splitSlice(p)
	n = libc_read(int32(fd), buf, uint(count))
	if n < 0 {
		err = getErrno()
	}
	return
}

func Pread(fd int, p []byte, offset int64) (n int, err error) {
	buf, count := splitSlice(p)
	n = libc_pread(int32(fd), buf, uint(count), offset)
	if n < 0 {
		err = getErrno()
	}
	return
}

func Seek(fd int, offset int64, whence int) (newoffset int64, err error) {
	newoffset = libc_lseek(int32(fd), offset, whence)
	if newoffset < 0 {
		err = getErrno()
	}
	return
}

func Open(path string, flag int, mode uint32) (fd int, err error) {
	data := cstring(path)
	fd = int(libc_open(&data[0], int32(flag), mode))
	if fd < 0 {
		err = getErrno()
	}
	return
}

func Readlink(path string, p []byte) (n int, err error) {
	data := cstring(path)
	buf, count := splitSlice(p)
	n = libc_readlink(&data[0], buf, uint(count))
	if n < 0 {
		err = getErrno()
	}
	return
}

func Chdir(path string) (err error) {
	data := cstring(path)
	fail := int(libc_chdir(&data[0]))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Chmod(path string, mode uint32) (err error) {
	data := cstring(path)
	fail := int(libc_chmod(&data[0], mode))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Mkdir(path string, mode uint32) (err error) {
	data := cstring(path)
	fail := int(libc_mkdir(&data[0], mode))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Rmdir(path string) (err error) {
	data := cstring(path)
	fail := int(libc_rmdir(&data[0]))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Rename(from, to string) (err error) {
	fromdata := cstring(from)
	todata := cstring(to)
	fail := int(libc_rename(&fromdata[0], &todata[0]))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Symlink(from, to string) (err error) {
	fromdata := cstring(from)
	todata := cstring(to)
	fail := int(libc_symlink(&fromdata[0], &todata[0]))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Unlink(path string) (err error) {
	data := cstring(path)
	fail := int(libc_unlink(&data[0]))
	if fail < 0 {
		err = getErrno()
	}
	return
}

func Kill(pid int, sig Signal) (err error) {
	return ENOSYS // TODO
}

type SysProcAttr struct{}

// TODO
type WaitStatus uint32

func (w WaitStatus) Exited() bool       { return false }
func (w WaitStatus) ExitStatus() int    { return 0 }
func (w WaitStatus) Signaled() bool     { return false }
func (w WaitStatus) Signal() Signal     { return 0 }
func (w WaitStatus) CoreDump() bool     { return false }
func (w WaitStatus) Stopped() bool      { return false }
func (w WaitStatus) Continued() bool    { return false }
func (w WaitStatus) StopSignal() Signal { return 0 }
func (w WaitStatus) TrapCause() int     { return 0 }

func Getenv(key string) (value string, found bool) {
	data := cstring(key)
	raw := libc_getenv(&data[0])
	if raw == nil {
		return "", false
	}

	ptr := uintptr(unsafe.Pointer(raw))
	for size := uintptr(0); ; size++ {
		v := *(*byte)(unsafe.Pointer(ptr))
		if v == 0 {
			src := *(*[]byte)(unsafe.Pointer(&sliceHeader{buf: raw, len: size, cap: size}))
			return string(src), true
		}
		ptr += unsafe.Sizeof(byte(0))
	}
}

func Setenv(key, val string) (err error) {
	if len(key) == 0 {
		return EINVAL
	}
	for i := 0; i < len(key); i++ {
		if key[i] == '=' || key[i] == 0 {
			return EINVAL
		}
	}
	for i := 0; i < len(val); i++ {
		if val[i] == 0 {
			return EINVAL
		}
	}
	keydata := cstring(key)
	valdata := cstring(val)
	errCode := libc_setenv(&keydata[0], &valdata[0], 1)
	if errCode != 0 {
		err = getErrno()
	}
	return
}

func Unsetenv(key string) (err error) {
	keydata := cstring(key)
	errCode := libc_unsetenv(&keydata[0])
	if errCode != 0 {
		err = getErrno()
	}
	return
}

func Clearenv() {
	for _, s := range Environ() {
		for j := 0; j < len(s); j++ {
			if s[j] == '=' {
				Unsetenv(s[0:j])
				break
			}
		}
	}
}

func Mmap(fd int, offset int64, length int, prot int, flags int) (data []byte, err error) {
	addr := libc_mmap(nil, uintptr(length), int32(prot), int32(flags), int32(fd), uintptr(offset))
	if addr == unsafe.Pointer(^uintptr(0)) {
		return nil, getErrno()
	}
	return (*[1 << 30]byte)(addr)[:length:length], nil
}

func Munmap(b []byte) (err error) {
	errCode := libc_munmap(unsafe.Pointer(&b[0]), uintptr(len(b)))
	if errCode != 0 {
		err = getErrno()
	}
	return err
}

func Mprotect(b []byte, prot int) (err error) {
	errCode := libc_mprotect(unsafe.Pointer(&b[0]), uintptr(len(b)), int32(prot))
	if errCode != 0 {
		err = getErrno()
	}
	return
}

func Getpagesize() int {
	return int(libc_getpagesize())
}

func Environ() []string {

	// This function combines all the environment into a single allocation.
	// While this optimizes for memory usage and garbage collector
	// overhead, it does run the risk of potentially pinning a "large"
	// allocation if a user holds onto a single environment variable or
	// value.  Having each variable be its own allocation would make the
	// trade-off in the other direction.

	// calculate total memory required
	var length uintptr
	var vars int
	for environ := libc_environ; *environ != nil; {
		length += libc_strlen(*environ)
		vars++
		environ = (*unsafe.Pointer)(unsafe.Pointer(uintptr(unsafe.Pointer(environ)) + unsafe.Sizeof(environ)))
	}

	// allocate our backing slice for the strings
	b := make([]byte, length)
	// and the slice we're going to return
	envs := make([]string, 0, vars)

	// loop over the environment again, this time copying over the data to the backing slice
	for environ := libc_environ; *environ != nil; {
		length = libc_strlen(*environ)
		// construct a Go string pointing at the libc-allocated environment variable data
		var envVar string
		rawEnvVar := (*struct {
			ptr    unsafe.Pointer
			length uintptr
		})(unsafe.Pointer(&envVar))
		rawEnvVar.ptr = *environ
		rawEnvVar.length = length
		// pull off the number of bytes we need for this environment variable
		var bs []byte
		bs, b = b[:length], b[length:]
		// copy over the bytes to the Go heap
		copy(bs, envVar)
		// convert trimmed slice to string
		s := *(*string)(unsafe.Pointer(&bs))
		// add s to our list of environment variables
		envs = append(envs, s)
		// environ++
		environ = (*unsafe.Pointer)(unsafe.Pointer(uintptr(unsafe.Pointer(environ)) + unsafe.Sizeof(environ)))
	}
	return envs
}

// cstring converts a Go string to a C string.
func cstring(s string) []byte {
	data := make([]byte, len(s)+1)
	copy(data, s)
	// final byte should be zero from the initial allocation
	return data
}

func splitSlice(p []byte) (buf *byte, len uintptr) {
	slice := (*sliceHeader)(unsafe.Pointer(&p))
	return slice.buf, slice.len
}

//export strlen
func libc_strlen(ptr unsafe.Pointer) uintptr

// ssize_t write(int fd, const void *buf, size_t count)
//export write
func libc_write(fd int32, buf *byte, count uint) int

// char *getenv(const char *name);
//export getenv
func libc_getenv(name *byte) *byte

// int setenv(const char *name, const char *val, int replace);
//export setenv
func libc_setenv(name *byte, val *byte, replace int32) int32

// int unsetenv(const char *name);
//export unsetenv
func libc_unsetenv(name *byte) int32

// ssize_t read(int fd, void *buf, size_t count);
//export read
func libc_read(fd int32, buf *byte, count uint) int

// ssize_t pread(int fd, void *buf, size_t count, off_t offset);
//export pread
func libc_pread(fd int32, buf *byte, count uint, offset int64) int

// ssize_t lseek(int fd, off_t offset, int whence);
//export lseek
func libc_lseek(fd int32, offset int64, whence int) int64

// int open(const char *pathname, int flags, mode_t mode);
//export open
func libc_open(pathname *byte, flags int32, mode uint32) int32

// int close(int fd)
//export close
func libc_close(fd int32) int32

// int dup(int fd)
//export dup
func libc_dup(fd int32) int32

// void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
//export mmap
func libc_mmap(addr unsafe.Pointer, length uintptr, prot, flags, fd int32, offset uintptr) unsafe.Pointer

// int munmap(void *addr, size_t length);
//export munmap
func libc_munmap(addr unsafe.Pointer, length uintptr) int32

// int mprotect(void *addr, size_t len, int prot);
//export mprotect
func libc_mprotect(addr unsafe.Pointer, len uintptr, prot int32) int32

// int getpagesize();
//export getpagesize
func libc_getpagesize() int32

// int chdir(const char *pathname, mode_t mode);
//export chdir
func libc_chdir(pathname *byte) int32

// int chmod(const char *pathname, mode_t mode);
//export chmod
func libc_chmod(pathname *byte, mode uint32) int32

// int mkdir(const char *pathname, mode_t mode);
//export mkdir
func libc_mkdir(pathname *byte, mode uint32) int32

// int rmdir(const char *pathname);
//export rmdir
func libc_rmdir(pathname *byte) int32

// int rename(const char *from, *to);
//export rename
func libc_rename(from, to *byte) int32

// int symlink(const char *from, *to);
//export symlink
func libc_symlink(from, to *byte) int32

// ssize_t readlink(const char *path, void *buf, size_t count);
//export readlink
func libc_readlink(path *byte, buf *byte, count uint) int

// int unlink(const char *pathname);
//export unlink
func libc_unlink(pathname *byte) int32

//go:extern environ
var libc_environ *unsafe.Pointer
