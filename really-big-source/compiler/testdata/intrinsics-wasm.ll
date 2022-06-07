; ModuleID = 'intrinsics.go'
source_filename = "intrinsics.go"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-wasi"

declare noalias nonnull i8* @runtime.alloc(i32, i8*, i8*)

declare void @runtime.trackPointer(i8* nocapture readonly, i8*)

; Function Attrs: nounwind
define hidden void @main.init(i8* %context) unnamed_addr #0 {
entry:
  ret void
}

; Function Attrs: nounwind
define hidden double @main.mySqrt(double %x, i8* %context) unnamed_addr #0 {
entry:
  %0 = call double @llvm.sqrt.f64(double %x)
  ret double %0
}

; Function Attrs: nofree nosync nounwind readnone speculatable willreturn
declare double @llvm.sqrt.f64(double) #1

; Function Attrs: nounwind
define hidden double @main.myTrunc(double %x, i8* %context) unnamed_addr #0 {
entry:
  %0 = call double @llvm.trunc.f64(double %x)
  ret double %0
}

; Function Attrs: nofree nosync nounwind readnone speculatable willreturn
declare double @llvm.trunc.f64(double) #1

attributes #0 = { nounwind }
attributes #1 = { nofree nosync nounwind readnone speculatable willreturn }
