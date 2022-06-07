package compiler

import (
	"fmt"
	"go/token"
	"go/types"
	"math/big"

	"github.com/tinygo-org/tinygo/compiler/llvmutil"
	"tinygo.org/x/go-llvm"
)

// This file contains helper functions for LLVM that are not exposed in the Go
// bindings.

// createTemporaryAlloca creates a new alloca in the entry block and adds
// lifetime start information in the IR signalling that the alloca won't be used
// before this point.
//
// This is useful for creating temporary allocas for intrinsics. Don't forget to
// end the lifetime using emitLifetimeEnd after you're done with it.
func (b *builder) createTemporaryAlloca(t llvm.Type, name string) (alloca, bitcast, size llvm.Value) {
	return llvmutil.CreateTemporaryAlloca(b.Builder, b.mod, t, name)
}

// emitLifetimeEnd signals the end of an (alloca) lifetime by calling the
// llvm.lifetime.end intrinsic. It is commonly used together with
// createTemporaryAlloca.
func (b *builder) emitLifetimeEnd(ptr, size llvm.Value) {
	llvmutil.EmitLifetimeEnd(b.Builder, b.mod, ptr, size)
}

// emitPointerPack packs the list of values into a single pointer value using
// bitcasts, or else allocates a value on the heap if it cannot be packed in the
// pointer value directly. It returns the pointer with the packed data.
func (b *builder) emitPointerPack(values []llvm.Value) llvm.Value {
	return llvmutil.EmitPointerPack(b.Builder, b.mod, b.pkg.Path(), b.NeedsStackObjects, values)
}

// emitPointerUnpack extracts a list of values packed using emitPointerPack.
func (b *builder) emitPointerUnpack(ptr llvm.Value, valueTypes []llvm.Type) []llvm.Value {
	return llvmutil.EmitPointerUnpack(b.Builder, b.mod, ptr, valueTypes)
}

// makeGlobalArray creates a new LLVM global with the given name and integers as
// contents, and returns the global.
// Note that it is left with the default linkage etc., you should set
// linkage/constant/etc properties yourself.
func (c *compilerContext) makeGlobalArray(buf []byte, name string, elementType llvm.Type) llvm.Value {
	globalType := llvm.ArrayType(elementType, len(buf))
	global := llvm.AddGlobal(c.mod, globalType, name)
	value := llvm.Undef(globalType)
	for i := 0; i < len(buf); i++ {
		ch := uint64(buf[i])
		value = llvm.ConstInsertValue(value, llvm.ConstInt(elementType, ch, false), []uint32{uint32(i)})
	}
	global.SetInitializer(value)
	return global
}

// createObjectLayout returns a LLVM value (of type i8*) that describes where
// there are pointers in the type t. If all the data fits in a word, it is
// returned as a word. Otherwise it will store the data in a global.
//
// The value contains two pieces of information: the length of the object and
// which words contain a pointer (indicated by setting the given bit to 1). For
// arrays, only the element is stored. This works because the GC knows the
// object size and can therefore know how this value is repeated in the object.
func (c *compilerContext) createObjectLayout(t llvm.Type, pos token.Pos) llvm.Value {
	// Use the element type for arrays. This works even for nested arrays.
	for {
		kind := t.TypeKind()
		if kind == llvm.ArrayTypeKind {
			t = t.ElementType()
			continue
		}
		if kind == llvm.StructTypeKind {
			fields := t.StructElementTypes()
			if len(fields) == 1 {
				t = fields[0]
				continue
			}
		}
		break
	}

	// Do a few checks to see whether we need to generate any object layout
	// information at all.
	objectSizeBytes := c.targetData.TypeAllocSize(t)
	pointerSize := c.targetData.TypeAllocSize(c.i8ptrType)
	pointerAlignment := c.targetData.PrefTypeAlignment(c.i8ptrType)
	if objectSizeBytes < pointerSize {
		// Too small to contain a pointer.
		layout := (uint64(1) << 1) | 1
		return llvm.ConstIntToPtr(llvm.ConstInt(c.uintptrType, layout, false), c.i8ptrType)
	}
	bitmap := c.getPointerBitmap(t, pos)
	if bitmap.BitLen() == 0 {
		// There are no pointers in this type, so we can simplify the layout.
		// TODO: this can be done in many other cases, e.g. when allocating an
		// array (like [4][]byte, which repeats a slice 4 times).
		layout := (uint64(1) << 1) | 1
		return llvm.ConstIntToPtr(llvm.ConstInt(c.uintptrType, layout, false), c.i8ptrType)
	}
	if objectSizeBytes%uint64(pointerAlignment) != 0 {
		// This shouldn't happen except for packed structs, which aren't
		// currently used.
		c.addError(pos, "internal error: unexpected object size for object with pointer field")
		return llvm.ConstNull(c.i8ptrType)
	}
	objectSizeWords := objectSizeBytes / uint64(pointerAlignment)

	pointerBits := pointerSize * 8
	var sizeFieldBits uint64
	switch pointerBits {
	case 16:
		sizeFieldBits = 4
	case 32:
		sizeFieldBits = 5
	case 64:
		sizeFieldBits = 6
	default:
		panic("unknown pointer size")
	}
	layoutFieldBits := pointerBits - 1 - sizeFieldBits

	// Try to emit the value as an inline integer. This is possible in most
	// cases.
	if objectSizeWords < layoutFieldBits {
		// If it can be stored directly in the pointer value, do so.
		// The runtime knows that if the least significant bit of the pointer is
		// set, the pointer contains the value itself.
		layout := bitmap.Uint64()<<(sizeFieldBits+1) | (objectSizeWords << 1) | 1
		return llvm.ConstIntToPtr(llvm.ConstInt(c.uintptrType, layout, false), c.i8ptrType)
	}

	// Unfortunately, the object layout is too big to fit in a pointer-sized
	// integer. Store it in a global instead.

	// Try first whether the global already exists. All objects with a
	// particular name have the same type, so this is possible.
	globalName := "runtime/gc.layout:" + fmt.Sprintf("%d-%0*x", objectSizeWords, (objectSizeWords+15)/16, bitmap)
	global := c.mod.NamedGlobal(globalName)
	if !global.IsNil() {
		return llvm.ConstBitCast(global, c.i8ptrType)
	}

	// Create the global initializer.
	bitmapBytes := make([]byte, int(objectSizeWords+7)/8)
	bitmap.FillBytes(bitmapBytes)
	var bitmapByteValues []llvm.Value
	for _, b := range bitmapBytes {
		bitmapByteValues = append(bitmapByteValues, llvm.ConstInt(c.ctx.Int8Type(), uint64(b), false))
	}
	initializer := c.ctx.ConstStruct([]llvm.Value{
		llvm.ConstInt(c.uintptrType, objectSizeWords, false),
		llvm.ConstArray(c.ctx.Int8Type(), bitmapByteValues),
	}, false)

	global = llvm.AddGlobal(c.mod, initializer.Type(), globalName)
	global.SetInitializer(initializer)
	global.SetUnnamedAddr(true)
	global.SetGlobalConstant(true)
	global.SetLinkage(llvm.LinkOnceODRLinkage)
	if c.targetData.PrefTypeAlignment(c.uintptrType) < 2 {
		// AVR doesn't have alignment by default.
		global.SetAlignment(2)
	}
	if c.Debug && pos != token.NoPos {
		// Creating a fake global so that the value can be inspected in GDB.
		// For example, the layout for strings.stringFinder (as of Go version
		// 1.15) has the following type according to GDB:
		//   type = struct {
		//       uintptr numBits;
		//       uint8 data[33];
		//   }
		// ...that's sort of a mixed C/Go type, but it is readable. More
		// importantly, these object layout globals can be read and printed by
		// GDB which may be useful for debugging.
		position := c.program.Fset.Position(pos)
		diglobal := c.dibuilder.CreateGlobalVariableExpression(c.difiles[position.Filename], llvm.DIGlobalVariableExpression{
			Name: globalName,
			File: c.getDIFile(position.Filename),
			Line: position.Line,
			Type: c.getDIType(types.NewStruct([]*types.Var{
				types.NewVar(pos, nil, "numBits", types.Typ[types.Uintptr]),
				types.NewVar(pos, nil, "data", types.NewArray(types.Typ[types.Byte], int64(len(bitmapByteValues)))),
			}, nil)),
			LocalToUnit: false,
			Expr:        c.dibuilder.CreateExpression(nil),
		})
		global.AddMetadata(0, diglobal)
	}

	return llvm.ConstBitCast(global, c.i8ptrType)
}

// getPointerBitmap scans the given LLVM type for pointers and sets bits in a
// bigint at the word offset that contains a pointer. This scan is recursive.
func (c *compilerContext) getPointerBitmap(typ llvm.Type, pos token.Pos) *big.Int {
	alignment := c.targetData.PrefTypeAlignment(c.i8ptrType)
	switch typ.TypeKind() {
	case llvm.IntegerTypeKind, llvm.FloatTypeKind, llvm.DoubleTypeKind:
		return big.NewInt(0)
	case llvm.PointerTypeKind:
		return big.NewInt(1)
	case llvm.StructTypeKind:
		ptrs := big.NewInt(0)
		if typ.StructName() == "runtime.funcValue" {
			// Hack: the type runtime.funcValue contains an 'id' field which is
			// of type uintptr, but before the LowerFuncValues pass it actually
			// contains a pointer (ptrtoint) to a global. This trips up the
			// interp package. Therefore, make the id field a pointer for now.
			typ = c.ctx.StructType([]llvm.Type{c.i8ptrType, c.i8ptrType}, false)
		}
		for i, subtyp := range typ.StructElementTypes() {
			subptrs := c.getPointerBitmap(subtyp, pos)
			if subptrs.BitLen() == 0 {
				continue
			}
			offset := c.targetData.ElementOffset(typ, i)
			if offset%uint64(alignment) != 0 {
				// This error will let the compilation fail, but by continuing
				// the error can still easily be shown.
				c.addError(pos, "internal error: allocated struct contains unaligned pointer")
				continue
			}
			subptrs.Lsh(subptrs, uint(offset)/uint(alignment))
			ptrs.Or(ptrs, subptrs)
		}
		return ptrs
	case llvm.ArrayTypeKind:
		subtyp := typ.ElementType()
		subptrs := c.getPointerBitmap(subtyp, pos)
		ptrs := big.NewInt(0)
		if subptrs.BitLen() == 0 {
			return ptrs
		}
		elementSize := c.targetData.TypeAllocSize(subtyp)
		if elementSize%uint64(alignment) != 0 {
			// This error will let the compilation fail (but continues so that
			// other errors can be shown).
			c.addError(pos, "internal error: allocated array contains unaligned pointer")
			return ptrs
		}
		for i := 0; i < typ.ArrayLength(); i++ {
			ptrs.Lsh(ptrs, uint(elementSize)/uint(alignment))
			ptrs.Or(ptrs, subptrs)
		}
		return ptrs
	default:
		// Should not happen.
		panic("unknown LLVM type")
	}
}
