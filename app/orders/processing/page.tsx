import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function ProcessingOrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-zinc-400">Orders</p>
          <h1 className="text-3xl font-bold text-white">Processing Orders</h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
          หน้านี้จะแสดงรายการออเดอร์ที่กำลังดำเนินการ
        </div>
      </div>
    </DashboardLayout>
  );
}