target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64--linux"

@main.uint8SliceSrc.buf = internal global [2 x i8] c"\03d"
@main.uint8SliceSrc = internal unnamed_addr global { i8*, i64, i64 } { i8* getelementptr inbounds ([2 x i8], [2 x i8]* @main.uint8SliceSrc.buf, i32 0, i32 0), i64 2, i64 2 }
@main.uint8SliceDst = internal unnamed_addr global { i8*, i64, i64 } zeroinitializer
@main.int16SliceSrc.buf = internal global [3 x i16] [i16 5, i16 123, i16 1024]
@main.int16SliceSrc = internal unnamed_addr global { i16*, i64, i64 } { i16* getelementptr inbounds ([3 x i16], [3 x i16]* @main.int16SliceSrc.buf, i32 0, i32 0), i64 3, i64 3 }
@main.int16SliceDst = internal unnamed_addr global { i16*, i64, i64 } zeroinitializer

declare i64 @runtime.sliceCopy(i8* %dst, i8* %src, i64 %dstLen, i64 %srcLen, i64 %elemSize) unnamed_addr

declare i8* @runtime.alloc(i64, i8*) unnamed_addr

declare void @runtime.printuint8(i8)

declare void @runtime.printint16(i16)

define void @runtime.initAll() unnamed_addr {
entry:
  call void @main.init()
  ret void
}

define void @main() unnamed_addr {
entry:
  ; print(uintSliceSrc[0])
  %uint8SliceSrc.buf = load i8*, i8** getelementptr inbounds ({ i8*, i64, i64 }, { i8*, i64, i64 }* @main.uint8SliceSrc, i64 0, i32 0)
  %uint8SliceSrc.val = load i8, i8* %uint8SliceSrc.buf
  call void @runtime.printuint8(i8 %uint8SliceSrc.val)

  ; print(uintSliceDst[0])
  %uint8SliceDst.buf = load i8*, i8** getelementptr inbounds ({ i8*, i64, i64 }, { i8*, i64, i64 }* @main.uint8SliceDst, i64 0, i32 0)
  %uint8SliceDst.val = load i8, i8* %uint8SliceDst.buf
  call void @runtime.printuint8(i8 %uint8SliceDst.val)

  ; print(int16SliceSrc[0])
  %int16SliceSrc.buf = load i16*, i16** getelementptr inbounds ({ i16*, i64, i64 }, { i16*, i64, i64 }* @main.int16SliceSrc, i64 0, i32 0)
  %int16SliceSrc.val = load i16, i16* %int16SliceSrc.buf
  call void @runtime.printint16(i16 %int16SliceSrc.val)

  ; print(int16SliceDst[0])
  %int16SliceDst.buf = load i16*, i16** getelementptr inbounds ({ i16*, i64, i64 }, { i16*, i64, i64 }* @main.int16SliceDst, i64 0, i32 0)
  %int16SliceDst.val = load i16, i16* %int16SliceDst.buf
  call void @runtime.printint16(i16 %int16SliceDst.val)
  ret void
}

define internal void @main.init() unnamed_addr {
entry:
  ; equivalent of:
  ;     uint8SliceDst = make([]uint8, len(uint8SliceSrc))
  %uint8SliceSrc = load { i8*, i64, i64 }, { i8*, i64, i64 }* @main.uint8SliceSrc
  %uint8SliceSrc.len = extractvalue { i8*, i64, i64 } %uint8SliceSrc, 1
  %uint8SliceDst.buf = call i8* @runtime.alloc(i64 %uint8SliceSrc.len, i8* null)
  %0 = insertvalue { i8*, i64, i64 } undef, i8* %uint8SliceDst.buf, 0
  %1 = insertvalue { i8*, i64, i64 } %0, i64 %uint8SliceSrc.len, 1
  %2 = insertvalue { i8*, i64, i64 } %1, i64 %uint8SliceSrc.len, 2
  store { i8*, i64, i64 } %2, { i8*, i64, i64 }* @main.uint8SliceDst

  ; equivalent of:
  ;     copy(uint8SliceDst, uint8SliceSrc)
  %uint8SliceSrc.buf = extractvalue { i8*, i64, i64 } %uint8SliceSrc, 0
  %copy.n = call i64 @runtime.sliceCopy(i8* %uint8SliceDst.buf, i8* %uint8SliceSrc.buf, i64 %uint8SliceSrc.len, i64 %uint8SliceSrc.len, i64 1)

  ; equivalent of:
  ;     int16SliceDst = make([]int16, len(int16SliceSrc))
  %int16SliceSrc = load { i16*, i64, i64 }, { i16*, i64, i64 }* @main.int16SliceSrc
  %int16SliceSrc.len = extractvalue { i16*, i64, i64 } %int16SliceSrc, 1
  %int16SliceSrc.len.bytes = mul i64 %int16SliceSrc.len, 2
  %int16SliceDst.buf.raw = call i8* @runtime.alloc(i64 %int16SliceSrc.len.bytes, i8* null)
  %int16SliceDst.buf = bitcast i8* %int16SliceDst.buf.raw to i16*
  %3 = insertvalue { i16*, i64, i64 } undef, i16* %int16SliceDst.buf, 0
  %4 = insertvalue { i16*, i64, i64 } %3, i64 %int16SliceSrc.len, 1
  %5 = insertvalue { i16*, i64, i64 } %4, i64 %int16SliceSrc.len, 2
  store { i16*, i64, i64 } %5, { i16*, i64, i64 }* @main.int16SliceDst

  ; equivalent of:
  ;     copy(int16SliceDst, int16SliceSrc)
  %int16SliceSrc.buf = extractvalue { i16*, i64, i64 } %int16SliceSrc, 0
  %int16SliceSrc.buf.i8ptr = bitcast i16* %int16SliceSrc.buf to i8*
  %int16SliceDst.buf.i8ptr = bitcast i16* %int16SliceDst.buf to i8*
  %copy.n2 = call i64 @runtime.sliceCopy(i8* %int16SliceDst.buf.i8ptr, i8* %int16SliceSrc.buf.i8ptr, i64 %int16SliceSrc.len, i64 %int16SliceSrc.len, i64 2)

  ret void
}
