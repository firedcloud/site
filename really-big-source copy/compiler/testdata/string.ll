; ModuleID = 'string.go'
source_filename = "string.go"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-wasi"

%runtime._string = type { i8*, i32 }

@"main$string" = internal unnamed_addr constant [3 x i8] c"foo", align 1

declare noalias nonnull i8* @runtime.alloc(i32, i8*, i8*)

declare void @runtime.trackPointer(i8* nocapture readonly, i8*)

; Function Attrs: nounwind
define hidden void @main.init(i8* %context) unnamed_addr #0 {
entry:
  ret void
}

; Function Attrs: nounwind
define hidden %runtime._string @main.someString(i8* %context) unnamed_addr #0 {
entry:
  ret %runtime._string { i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"main$string", i32 0, i32 0), i32 3 }
}

; Function Attrs: nounwind
define hidden %runtime._string @main.zeroLengthString(i8* %context) unnamed_addr #0 {
entry:
  ret %runtime._string zeroinitializer
}

; Function Attrs: nounwind
define hidden i32 @main.stringLen(i8* %s.data, i32 %s.len, i8* %context) unnamed_addr #0 {
entry:
  ret i32 %s.len
}

; Function Attrs: nounwind
define hidden i8 @main.stringIndex(i8* %s.data, i32 %s.len, i32 %index, i8* %context) unnamed_addr #0 {
entry:
  %.not = icmp ult i32 %index, %s.len
  br i1 %.not, label %lookup.next, label %lookup.throw

lookup.throw:                                     ; preds = %entry
  call void @runtime.lookupPanic(i8* undef) #0
  unreachable

lookup.next:                                      ; preds = %entry
  %0 = getelementptr inbounds i8, i8* %s.data, i32 %index
  %1 = load i8, i8* %0, align 1
  ret i8 %1
}

declare void @runtime.lookupPanic(i8*)

; Function Attrs: nounwind
define hidden i1 @main.stringCompareEqual(i8* %s1.data, i32 %s1.len, i8* %s2.data, i32 %s2.len, i8* %context) unnamed_addr #0 {
entry:
  %0 = call i1 @runtime.stringEqual(i8* %s1.data, i32 %s1.len, i8* %s2.data, i32 %s2.len, i8* undef) #0
  ret i1 %0
}

declare i1 @runtime.stringEqual(i8*, i32, i8*, i32, i8*)

; Function Attrs: nounwind
define hidden i1 @main.stringCompareUnequal(i8* %s1.data, i32 %s1.len, i8* %s2.data, i32 %s2.len, i8* %context) unnamed_addr #0 {
entry:
  %0 = call i1 @runtime.stringEqual(i8* %s1.data, i32 %s1.len, i8* %s2.data, i32 %s2.len, i8* undef) #0
  %1 = xor i1 %0, true
  ret i1 %1
}

; Function Attrs: nounwind
define hidden i1 @main.stringCompareLarger(i8* %s1.data, i32 %s1.len, i8* %s2.data, i32 %s2.len, i8* %context) unnamed_addr #0 {
entry:
  %0 = call i1 @runtime.stringLess(i8* %s2.data, i32 %s2.len, i8* %s1.data, i32 %s1.len, i8* undef) #0
  ret i1 %0
}

declare i1 @runtime.stringLess(i8*, i32, i8*, i32, i8*)

; Function Attrs: nounwind
define hidden i8 @main.stringLookup(i8* %s.data, i32 %s.len, i8 %x, i8* %context) unnamed_addr #0 {
entry:
  %0 = zext i8 %x to i32
  %.not = icmp ult i32 %0, %s.len
  br i1 %.not, label %lookup.next, label %lookup.throw

lookup.throw:                                     ; preds = %entry
  call void @runtime.lookupPanic(i8* undef) #0
  unreachable

lookup.next:                                      ; preds = %entry
  %1 = getelementptr inbounds i8, i8* %s.data, i32 %0
  %2 = load i8, i8* %1, align 1
  ret i8 %2
}

attributes #0 = { nounwind }
