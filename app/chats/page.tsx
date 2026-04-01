"use client";

import { useState } from "react";

const chatList = [
  {
    id: 1,
    name: "Somchai Jaidee",
    lastMessage: "สนใจสินค้าตัวนี้ครับ",
    time: "10:24",
    unread: 2,
  },
  {
    id: 2,
    name: "Mali Srisuk",
    lastMessage: "มีไซส์ไหมคะ",
    time: "09:48",
    unread: 0,
  },
  {
    id: 3,
    name: "Anan K.",
    lastMessage: "ขอราคาส่งหน่อยครับ",
    time: "เมื่อวาน",
    unread: 1,
  },
];

const messages = [
  {
    id: 1,
    from: "customer",
    text: "สวัสดีครับ สนใจสินค้าตัวนี้ครับ",
    time: "10:20",
  },
  {
    id: 2,
    from: "admin",
    text: "สวัสดีครับ สนใจรุ่นไหนเป็นพิเศษ แจ้งได้เลยครับ",
    time: "10:21",
  },
  {
    id: 3,
    from: "customer",
    text: "อยากทราบว่ามีของพร้อมส่งไหม",
    time: "10:24",
  },
];

const tags = ["VIP", "Facebook Lead", "รอตอบกลับ"];

export default function ChatsPage() {
  const [activeTab, setActiveTab] = useState<"invoice" | "payment" | "history">("invoice");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cod">("bank");

  
    return (
      <div className="grid h-[calc(100vh-100px)] grid-cols-12 gap-4 p-6 lg:p-8">
        <div className="col-span-3 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="border-b border-zinc-800 p-4">
            <h1 className="text-xl font-bold text-white">Chats</h1>
            <p className="mt-1 text-sm text-zinc-400">รายการห้องแชทลูกค้า</p>
          </div>

          <div className="border-b border-zinc-800 p-3">
            <input
              type="text"
              placeholder="ค้นหาลูกค้า..."
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-2 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          <div className="divide-y divide-zinc-800">
            {chatList.map((chat, index) => (
              <div
                key={chat.id}
                className={`cursor-pointer p-4 transition ${
                  index === 0 ? "bg-zinc-900" : "hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{chat.name}</p>
                    <p className="truncate text-sm text-zinc-400">
                      {chat.lastMessage}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{chat.time}</p>
                    {chat.unread > 0 && (
                      <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800 p-4">
            <h2 className="text-lg font-semibold text-white">Somchai Jaidee</h2>
            <p className="text-sm text-zinc-400">Facebook Messenger</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.from === "admin" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    message.from === "admin"
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-white"
                  }`}
                >
                  <p>{message.text}</p>
                  <p
                    className={`mt-2 text-xs ${
                      message.from === "admin"
                        ? "text-black/60"
                        : "text-zinc-500"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 p-4">
            <div className="flex items-end gap-3">
              <textarea
                placeholder="พิมพ์ข้อความ..."
                className="min-h-[80px] flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              <button className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black">
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-3 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="border-b border-zinc-800">
            <div className="grid grid-cols-3">
              <button
                onClick={() => setActiveTab("invoice")}
                className={`border-b px-4 py-3 text-sm font-medium transition ${
                  activeTab === "invoice"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-white"
                }`}
              >
                เปิดบิล
              </button>

              <button
                onClick={() => setActiveTab("payment")}
                className={`border-b px-4 py-3 text-sm font-medium transition ${
                  activeTab === "payment"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-white"
                }`}
              >
                แจ้งชำระเงิน
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`border-b px-4 py-3 text-sm font-medium transition ${
                  activeTab === "history"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-white"
                }`}
              >
                ประวัติการซื้อ
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {activeTab === "invoice" && "Open Invoice"}
                  {activeTab === "payment" && "Payment Notice"}
                  {activeTab === "history" && "Purchase History"}
                </h2>
                <p className="text-sm text-zinc-400">
                  {activeTab === "invoice" && "เปิดบิลจากแชทลูกค้า"}
                  {activeTab === "payment" && "บันทึกและตรวจสอบการชำระเงิน"}
                  {activeTab === "history" && "ดูประวัติการซื้อของลูกค้า"}
                </p>
              </div>

              <button className="text-sm text-zinc-400 hover:text-white">
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4 overflow-y-auto">
            {activeTab === "invoice" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    placeholder="ระบุชื่อลูกค้า"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    เบอร์โทร
                  </label>
                  <input
                    type="text"
                    placeholder="ระบุเบอร์โทร"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    ที่อยู่อื่น ๆ
                  </label>
                  <textarea
                    placeholder="บ้านเลขที่ / หมู่ / ซอย / ถนน / หมายเหตุ"
                    className="min-h-[100px] w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    ตำแหน่งของผู้รับ
                  </label>
                  <input
                    type="text"
                    placeholder="ค้นหา ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <button className="w-full rounded-2xl border border-dashed border-zinc-700 px-4 py-8 text-sm text-zinc-300 hover:bg-zinc-900">
                    + เพิ่มสินค้าจากในระบบ
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">
                      น้ำหนักสินค้า
                    </label>
                    <input
                      type="text"
                      placeholder="0.00"
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">
                      ค่าจัดส่ง
                    </label>
                    <input
                      type="text"
                      placeholder="0"
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    ส่วนลด
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Tags
                  </label>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-900">
                    + Add Tag
                  </button>
                </div>
              </>
            )}

            {activeTab === "payment" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    วิธีการชำระเงิน
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("bank")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        paymentMethod === "bank"
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-black text-white"
                      }`}
                    >
                      โอนเงิน
                    </button>

                    <button
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        paymentMethod === "cod"
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-black text-white"
                      }`}
                    >
                      เก็บเงินปลายทาง
                    </button>
                  </div>
                </div>

                {paymentMethod === "bank" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">
                        แนบสลิป
                      </label>

                      <button className="w-full rounded-2xl border border-dashed border-zinc-700 px-4 py-8 text-sm text-zinc-300 hover:bg-zinc-900">
                        + เพิ่มรูปสลิป
                      </button>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">
                        หรือลิงก์สลิป (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        placeholder="วาง link ที่นี่"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">
                        จำนวนเงินที่โอน
                      </label>
                      <input
                        type="text"
                        placeholder="จำนวนเงินที่โอน"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white">
                          วันที่โอน
                        </label>
                        <input
                          type="text"
                          placeholder="dd/mm/yyyy"
                          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white">
                          เวลาที่โอน
                        </label>
                        <input
                          type="text"
                          placeholder="--:--"
                          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">
                        ผู้รับเงิน
                      </label>
                      <input
                        type="text"
                        placeholder="ระบุผู้รับเงิน"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === "cod" && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-6 text-center">
                    <p className="text-lg font-semibold text-white">
                      เก็บเงินปลายทาง (COD)
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      ไม่ต้องแนบสลิป ระบบจะบันทึกว่าออเดอร์นี้เป็นแบบเก็บเงินปลายทาง
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-400">12/03/2026</p>
                  <p className="mt-2 font-medium text-white">ออเดอร์ #1001</p>
                  <p className="mt-1 text-sm text-zinc-400">ยอดรวม ฿1,580</p>
                  <p className="mt-1 text-sm text-green-400">Completed</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-400">04/03/2026</p>
                  <p className="mt-2 font-medium text-white">ออเดอร์ #0954</p>
                  <p className="mt-1 text-sm text-zinc-400">ยอดรวม ฿890</p>
                  <p className="mt-1 text-sm text-yellow-400">Pending</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">ยอดรวมสุทธิ</span>
              <span className="text-lg font-semibold text-white">฿0</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-900">
                ยกเลิก
              </button>
              <button className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black">
                ยืนยันสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}