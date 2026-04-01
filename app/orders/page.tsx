"use client";

import { usePathname } from "next/navigation";


const orders = [
  { id: 1, orderNo: "#1001", customer: "Somchai", total: "1580", status: "Pending" },
  { id: 2, orderNo: "#1002", customer: "Anan", total: "2490", status: "Processing" },
  { id: 3, orderNo: "#1003", customer: "Mali", total: "890", status: "Completed" },
  { id: 4, orderNo: "#1004", customer: "John", total: "1200", status: "Cancelled" },
];

export default function OrdersPage() {
  const pathname = usePathname();

  let filter = "All";

  if (pathname.includes("pending")) filter = "Pending";
  if (pathname.includes("processing")) filter = "Processing";
  if (pathname.includes("completed")) filter = "Completed";
  if (pathname.includes("cancelled")) filter = "Cancelled";

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status === filter);

      return (
        <div className="space-y-6 p-6 lg:p-8">
        <div>
          <p className="text-sm text-zinc-400">Orders</p>
          <h1 className="text-3xl font-bold text-white">
            {filter} Orders
          </h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3">Order No.</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-4 py-4">{order.orderNo}</td>
                  <td className="px-4 py-4">{order.customer}</td>
                  <td className="px-4 py-4">฿{order.total}</td>
                  <td className="px-4 py-4">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
  );
}