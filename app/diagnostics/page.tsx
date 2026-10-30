import type { Metadata } from "next";
import AIDiagnostic from "@/components/AIDiagnostic";

export const metadata: Metadata = {
  title: "Bakkou AI — واجهة التشخيص | Diagnostic",
  description: "Simulation de diagnostic matériel : smartphones, PC portables et systèmes CCTV.",
};

export default function DiagnosticsPage() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-blueprint absolute inset-0" />
        <div className="absolute -top-48 start-1/4 h-[55vh] w-[55vh] rounded-full bg-cyan/10 blur-[130px]" />
        <div className="absolute bottom-[-25%] end-[-5%] h-[50vh] w-[50vh] rounded-full bg-orange/10 blur-[130px]" />
      </div>
      <AIDiagnostic />
    </>
  );
}
