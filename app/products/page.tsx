"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const defaultProducts = [
  {
    id: 1,
    name: "Tactical Gloves",
    sku: "TG-001",
    price: 790,
    stock: 24,
    channels: ["FB: Tactical 1", "FB: Tactical 2"],
    status: "Active",
  },
  {
    id: 2,
    name: "Combat Boots",
    sku: "CB-002",
    price: 2490,
    stock: 12,
    channels: ["FB: Outdoor Gear"],
    status: "Active",
  },
  {
    id: 3,
    name: "Utility Backpack",
    sku: "UB-003",
    price: 1890,
    stock: 5,
    channels: ["FB: Tactical 1", "Line OA"],
    status: "Low Stock",
  },
  {
    id: 4,
    name: "Survival Flashlight",
    sku: "SF-004",
    price: 590,
    stock: 40,
    channels: ["FB: Tactical 2"],
    status: "Active",
  },
];

const channelOptions = [
  "All Channels",
  "FB: Tactical 1",
  "FB: Tactical 2",
  "FB: Outdoor Gear",
  "Line OA",
];

export default function ProductsPage() {
  const [products, setProducts] = useState(defaultProducts);

useEffect(() => {
  const savedProducts = localStorage.getItem("products");
  if (savedProducts) {
    try {
      const parsed = JSON.parse(savedProducts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProducts(parsed);
      }
    } catch (error) {
      console.error("อ่านข้อมูลสินค้าไม่สำเร็จ", error);
    }
  }
}, []);
  const [selectedChannel, setSelectedChannel] = useState("All Channels");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"low-high" | "high-low">("low-high");

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedChannel !== "All Channels") {
      result = result.filter((product) =>
        product.channels.includes(selectedChannel)
      );
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(keyword) ||
          product.sku.toLowerCase().includes(keyword)
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "low-high") return a.price - b.price;
      return b.price - a.price;
    });

    return result;
  }, [selectedChannel, searchTerm, sortOrder]);

  return (
    <div className="space-y-5 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Warehouse</p>
            <h1 className="text-3xl font-bold text-white">Inventory</h1>
            <p className="mt-1 text-sm text-zinc-400">
              จัดการสินค้า สต๊อก ราคา และช่องทางขาย
            </p>
          </div>

          <Link
            href="/products/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            + Add Product
          </Link>
        </div>

        <div className="grid items-end gap-3 lg:grid-cols-[180px_minmax(0,1fr)_220px_56px]">
          <div>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none"
            >
              {channelOptions.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า หรือ SKU"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          <div>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "low-high" | "high-low")
              }
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none"
            >
              <option value="low-high">เรียงราคาจากต่ำ-สูง</option>
              <option value="high-low">เรียงราคาจากสูง-ต่ำ</option>
            </select>
          </div>

          <div className="flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400">
            ☰
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">สต๊อก</th>
                <th className="px-4 py-3">ช่องทางขาย</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-zinc-800 text-zinc-200 align-top"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{product.name}</div>
                  </td>

                  <td className="px-4 py-4">{product.sku}</td>

                  <td className="px-4 py-4">฿{product.price.toLocaleString()}</td>

                  <td className="px-4 py-4">{product.stock}</td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {product.channels.map((channel) => (
                        <span
                          key={channel}
                          className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs text-zinc-300"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${product.status === "Active"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-yellow-500/15 text-yellow-400"
                        }`}
                    >
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    ไม่พบสินค้าที่ตรงกับตัวกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
   
  );
}