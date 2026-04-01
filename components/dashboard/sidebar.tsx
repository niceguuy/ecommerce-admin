"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  Box,
  ShoppingCart,
  Users,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

const mainNav = [
  { id: "overview", label: "Overview", icon: LayoutGrid, href: "/" },
  { id: "products", label: "Products", icon: Box, href: "/products" },
  { id: "chatbot", label: "Chat Bot", icon: MessageSquare, href: "/chatbot" },
  { id: "chats", label: "Chats", icon: MessageSquare, href: "/chats" },
  { id: "customers", label: "Customers", icon: Users, href: "/customers" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

const orderSubNav = [
  { id: "all-orders", label: "All Orders", href: "/orders" },
  { id: "pending-orders", label: "Pending", href: "/orders/pending" },
  { id: "processing-orders", label: "Processing", href: "/orders/processing" },
  { id: "completed-orders", label: "Completed", href: "/orders/completed" },
  { id: "cancelled-orders", label: "Cancelled", href: "/orders/cancelled" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isOrdersActive = pathname.startsWith("/orders");
  const [openOrders, setOpenOrders] = useState(isOrdersActive);

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-black md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-bold">
          C
        </div>
        <div>
          <p className="text-sm text-zinc-400">E-commerce</p>
          <h2 className="font-semibold text-white">Commerce Admin</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${active
                ? "bg-zinc-900 text-white"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpenOrders(!openOrders)}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition ${isOrdersActive
              ? "bg-zinc-900 text-white"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
              }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} />
              <span>Orders</span>
            </div>

            <ChevronDown
              size={16}
              className={`transition ${openOrders ? "rotate-180" : ""}`}
            />
          </button>

          {openOrders && (
            <div className="mt-2 ml-4 space-y-1 border-l border-zinc-800 pl-4">
              {orderSubNav.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 hover:bg-zinc-900 hover:text-white">
          <ChevronLeft size={18} />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
}