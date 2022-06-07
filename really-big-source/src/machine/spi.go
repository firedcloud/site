//go:build !baremetal || (stm32 && !stm32f7x2 && !stm32l5x2) || fe310 || k210 || (nxp && !mk66f18) || atmega
// +build !baremetal stm32,!stm32f7x2,!stm32l5x2 fe310 k210 nxp,!mk66f18 atmega

package machine

import "errors"

// SPI phase and polarity configs CPOL and CPHA
const (
	Mode0 = 0
	Mode1 = 1
	Mode2 = 2
	Mode3 = 3
)

var (
	ErrTxInvalidSliceSize      = errors.New("SPI write and read slices must be same size")
	errSPIInvalidMachineConfig = errors.New("SPI port was not configured properly by the machine")
)

// Tx handles read/write operation for SPI interface. Since SPI is a syncronous write/read
// interface, there must always be the same number of bytes written as bytes read.
// The Tx method knows about this, and offers a few different ways of calling it.
//
// This form sends the bytes in tx buffer, putting the resulting bytes read into the rx buffer.
// Note that the tx and rx buffers must be the same size:
//
// 		spi.Tx(tx, rx)
//
// This form sends the tx buffer, ignoring the result. Useful for sending "commands" that return zeros
// until all the bytes in the command packet have been received:
//
// 		spi.Tx(tx, nil)
//
// This form sends zeros, putting the result into the rx buffer. Good for reading a "result packet":
//
// 		spi.Tx(nil, rx)
//
func (spi SPI) Tx(w, r []byte) error {
	var err error

	switch {
	case w == nil:
		// read only, so write zero and read a result.
		for i := range r {
			r[i], err = spi.Transfer(0)
			if err != nil {
				return err
			}
		}
	case r == nil:
		// write only
		for _, b := range w {
			_, err = spi.Transfer(b)
			if err != nil {
				return err
			}
		}

	default:
		// write/read
		if len(w) != len(r) {
			return ErrTxInvalidSliceSize
		}

		for i, b := range w {
			r[i], err = spi.Transfer(b)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
