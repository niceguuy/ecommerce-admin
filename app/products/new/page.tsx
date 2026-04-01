"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const pageOptions = [
  "FB: Tactical 1",
  "FB: Tactical 2",
  "FB: Outdoor Gear",
  "Line OA",
  "Website Store",
  "Marketplace",
];

type FormErrors = {
  name?: string;
  sku?: string;
  category?: string;
  stock?: string;
  cost?: string;
  price?: string;
  weight?: string;
  width?: string;
  length?: string;
  height?: string;
  pages?: string;
  image?: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [color, setColor] = useState("");
  const [unit, setUnit] = useState("");
  const [width, setWidth] = useState("");
  const [lengthValue, setLengthValue] = useState("");
  const [height, setHeight] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [saveMessage, setSaveMessage] = useState("");

  function togglePage(page: string) {
    setSelectedPages((prev) =>
      prev.includes(page)
        ? prev.filter((item) => item !== page)
        : [...prev, page]
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: undefined }));
  }

  function handleRemoveImage() {
    setImageName("");
    setImagePreview("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!name.trim()) nextErrors.name = "กรุณากรอกชื่อสินค้า";
    if (!sku.trim()) nextErrors.sku = "กรุณากรอก SKU";
    if (!category.trim()) nextErrors.category = "กรุณากรอกหมวดหมู่";
    if (!stock.trim()) nextErrors.stock = "กรุณากรอกจำนวนสต๊อก";
    if (!cost.trim()) nextErrors.cost = "กรุณากรอกต้นทุน";
    if (!price.trim()) nextErrors.price = "กรุณากรอกราคา";
    if (!weight.trim()) nextErrors.weight = "กรุณากรอกน้ำหนักสินค้า";
    if (!width.trim()) nextErrors.width = "กรุณากรอกความกว้าง";
    if (!lengthValue.trim()) nextErrors.length = "กรุณากรอกความยาว";
    if (!height.trim()) nextErrors.height = "กรุณากรอกความสูง";
    if (selectedPages.length === 0) nextErrors.pages = "กรุณาเลือกอย่างน้อย 1 ช่องทางขาย";
    if (!imagePreview) nextErrors.image = "กรุณาอัปโหลดรูปสินค้า";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSave() {
    function handleSave() {
      setSaveMessage("");
      console.log("เริ่มกดบันทึกสินค้า");
    
      const isValid = validateForm();
      console.log("ผล validateForm =", isValid);
    
      if (!isValid) {
        setSaveMessage("ยังบันทึกไม่ได้ กรุณากรอกข้อมูลให้ครบ");
        return;
      }
    
      const newProduct = {
        id: Date.now(),
        name,
        sku,
        category,
        description,
        stock: Number(stock),
        cost: Number(cost),
        price: Number(price),
        weight,
        color,
        unit,
        width,
        length: lengthValue,
        height,
        allowNegativeStock,
        channels: selectedPages,
        imageName,
        imagePreview,
        status: Number(stock) <= 5 ? "Low Stock" : "Active",
      };
    
      console.log("สินค้าที่จะบันทึก =", newProduct);
    
      const existingProducts = localStorage.getItem("products");
      console.log("existingProducts ก่อนบันทึก =", existingProducts);
    
      const parsedProducts = existingProducts ? JSON.parse(existingProducts) : [];
      parsedProducts.push(newProduct);
    
      localStorage.setItem("products", JSON.stringify(parsedProducts));
    
      console.log("existingProducts หลังบันทึก =", localStorage.getItem("products"));
    
      setSaveMessage("บันทึกสินค้าเรียบร้อยแล้ว");
    
      setTimeout(() => {
        router.push("/products");
      }, 700);
    }
  
    const newProduct = {
      id: Date.now(),
      name,
      sku,
      category,
      description,
      stock: Number(stock),
      cost: Number(cost),
      price: Number(price),
      weight,
      color,
      unit,
      width,
      length: lengthValue,
      height,
      allowNegativeStock,
      channels: selectedPages,
      imageName,
      imagePreview,
      status: Number(stock) <= 5 ? "Low Stock" : "Active",
    };
  
    const existingProducts = localStorage.getItem("products");
    const parsedProducts = existingProducts ? JSON.parse(existingProducts) : [];
  
    parsedProducts.push(newProduct);
  
    localStorage.setItem("products", JSON.stringify(parsedProducts));
  
    setSaveMessage("บันทึกสินค้าเรียบร้อยแล้ว");
  
    setTimeout(() => {
      router.push("/products");
    }, 700);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm text-zinc-400">Warehouse</p>
          <h1 className="text-3xl font-bold text-white">Create Product</h1>
          <p className="mt-1 text-sm text-zinc-400">
            เพิ่มสินค้าใหม่ พร้อมกำหนดข้อมูลขายและช่องทางแสดงสินค้า
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xl font-semibold text-white">ข้อมูลสินค้า</h2>
          <p className="mt-1 text-sm text-zinc-400">
            ข้อมูลพื้นฐานของสินค้าและรายละเอียดที่ใช้แสดงในระบบ
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-300">ชื่อสินค้า *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Tactical Gloves"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">SKU *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="เช่น TG-001"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.sku && (
                <p className="mt-2 text-sm text-red-400">{errors.sku}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">หมวดหมู่ *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เช่น Accessories"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.category && (
                <p className="mt-2 text-sm text-red-400">{errors.category}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-300">
                รายละเอียดสินค้า
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายสินค้าแบบสั้น ๆ"
                className="min-h-[120px] w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm text-zinc-300">รูปสินค้า *</label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-white hover:bg-zinc-900"
                  >
                    ลบรูป
                  </button>
                )}
              </div>

              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black px-6 py-8 text-center hover:bg-zinc-900">
                {!imagePreview ? (
                  <>
                    <span className="text-sm text-zinc-400">
                      กดเพื่อเลือกรูปสินค้า
                    </span>
                    <span className="mt-2 text-xs text-zinc-500">
                      PNG / JPG / WEBP
                    </span>
                  </>
                ) : (
                  <div className="w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-64 rounded-xl object-contain"
                    />
                    <p className="mt-4 text-xs text-zinc-400">{imageName}</p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {errors.image && (
                <p className="mt-2 text-sm text-red-400">{errors.image}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xl font-semibold text-white">ข้อมูลการขายสินค้า</h2>
          <p className="mt-1 text-sm text-zinc-400">
            ข้อมูลที่ใช้กับสต๊อก ราคา น้ำหนัก และการขายจริง
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">สต๊อก *</label>
              <input
                type="text"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="เช่น 24"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.stock && (
                <p className="mt-2 text-sm text-red-400">{errors.stock}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">ต้นทุน *</label>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="เช่น 350"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.cost && (
                <p className="mt-2 text-sm text-red-400">{errors.cost}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">ราคา *</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="เช่น 790"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.price && (
                <p className="mt-2 text-sm text-red-400">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">น้ำหนัก (กก.) *</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="เช่น 0.50"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {errors.weight && (
                <p className="mt-2 text-sm text-red-400">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">สี</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="เช่น Black"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">หน่วยสินค้า</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="เช่น ชิ้น"
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">ขนาดสินค้า</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  ใช้สำหรับขนส่งและการคำนวณพัสดุ
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">ความกว้าง (ซม.) *</label>
                <input
                  type="text"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="เช่น 10"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
                />
                {errors.width && (
                  <p className="mt-2 text-sm text-red-400">{errors.width}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">ความยาว (ซม.) *</label>
                <input
                  type="text"
                  value={lengthValue}
                  onChange={(e) => setLengthValue(e.target.value)}
                  placeholder="เช่น 20"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
                />
                {errors.length && (
                  <p className="mt-2 text-sm text-red-400">{errors.length}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">ความสูง (ซม.) *</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="เช่น 5"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none"
                />
                {errors.height && (
                  <p className="mt-2 text-sm text-red-400">{errors.height}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-black p-4">
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="size-4"
              />
              อนุญาตให้ขายสินค้าได้แม้สต๊อกจะใกล้หมดหรือเป็นศูนย์
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xl font-semibold text-white">การแสดงสินค้า</h2>
          <p className="mt-1 text-sm text-zinc-400">
            เลือกว่าสินค้านี้จะแสดงในเพจหรือช่องทางขายไหนบ้าง
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-sm font-medium text-white">ช่องทางที่เลือกแล้ว</p>
              <p className="mt-1 text-xs text-zinc-500">
                สินค้านี้จะแสดงเฉพาะช่องทางที่อยู่ในรายการนี้
              </p>

              <div className="mt-4 flex min-h-[220px] flex-wrap gap-2">
                {selectedPages.length > 0 ? (
                  selectedPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => togglePage(page)}
                      className="h-fit rounded-full border border-white bg-white px-4 py-2 text-sm text-black"
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">ยังไม่ได้เลือกช่องทางขาย</p>
                )}
              </div>

              {errors.pages && (
                <p className="mt-3 text-sm text-red-400">{errors.pages}</p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-sm font-medium text-white">เลือกช่องทางขาย</p>
              <p className="mt-1 text-xs text-zinc-500">
                กดเลือกเพื่อเพิ่มหรือเอาออกจากสินค้านี้
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {pageOptions.map((page) => {
                  const active = selectedPages.includes(page);

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => togglePage(page)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
                      }`}
                    >
                      <span>{page}</span>
                      <span className="text-xs">
                        {active ? "เลือกแล้ว" : "เลือก"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pb-6">
          <div>
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.includes("ยังบันทึกไม่ได้")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {saveMessage}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-white hover:bg-zinc-900">
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
            >
              บันทึกสินค้า
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}