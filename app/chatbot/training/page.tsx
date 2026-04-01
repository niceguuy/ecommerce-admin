"use client";

import { useEffect, useRef, useState } from "react";

type ProductOffer = {
  id: number;
  title: string;
  price: string;
  note: string;
  imagesText: string;
  isActive: boolean;
};

type ProductFaqBlock = {
  id: number;
  label: string;
  keywords: string;
  answer: string;
  imagesText: string;
  isActive: boolean;
};

type ProductItem = {
  id: number;
  name: string;
  sku: string;
  keywords: string;
  description: string;
  highlights: string;
  usage: string;
  salesNote: string;
  imagesText: string;
  pagesText: string;
  isActive: boolean;
  offers: ProductOffer[];
  faqBlocks: ProductFaqBlock[];
};

type SalesStrategy = {
  openingStyle: string;
  showOffersInFirstReply: boolean;
  maxOffersInFirstReply: string;
  closingQuestionStyle: string;
  toneStyle: string;
};

function createDefaultOffer(id: number): ProductOffer {
  return {
    id,
    title: "",
    price: "",
    note: "",
    imagesText: "",
    isActive: true,
  };
}

function createDefaultFaq(id: number): ProductFaqBlock {
  return {
    id,
    label: "วิธีใช้",
    keywords: "วิธีใช้, ใช้ยังไง, ใช้อย่างไร",
    answer: "",
    imagesText: "",
    isActive: true,
  };
}

function createDefaultProduct(id: number): ProductItem {
  return {
    id,
    name: "",
    sku: "",
    keywords: "",
    description: "",
    highlights: "",
    usage: "",
    salesNote: "",
    imagesText: "",
    pagesText: "",
    isActive: true,
    offers: [createDefaultOffer(id + 1)],
    faqBlocks: [createDefaultFaq(id + 2)],
  };
}

function normalizeOffer(offer: any, fallbackId: number): ProductOffer {
  return {
    id: typeof offer?.id === "number" ? offer.id : fallbackId,
    title: offer?.title ?? "",
    price: offer?.price ?? "",
    note: offer?.note ?? "",
    imagesText: offer?.imagesText ?? "",
    isActive: typeof offer?.isActive === "boolean" ? offer.isActive : true,
  };
}

function normalizeFaq(faq: any, fallbackId: number): ProductFaqBlock {
  return {
    id: typeof faq?.id === "number" ? faq.id : fallbackId,
    label: faq?.label ?? "",
    keywords: faq?.keywords ?? "",
    answer: faq?.answer ?? "",
    imagesText: faq?.imagesText ?? "",
    isActive: typeof faq?.isActive === "boolean" ? faq.isActive : true,
  };
}

function normalizeProduct(product: any, fallbackId: number): ProductItem {
  const offers = Array.isArray(product?.offers)
    ? product.offers.map((offer: any, index: number) =>
        normalizeOffer(offer, fallbackId + 100 + index)
      )
    : [createDefaultOffer(fallbackId + 1)];

  const faqBlocks = Array.isArray(product?.faqBlocks)
    ? product.faqBlocks.map((faq: any, index: number) =>
        normalizeFaq(faq, fallbackId + 200 + index)
      )
    : [createDefaultFaq(fallbackId + 2)];

  return {
    id: typeof product?.id === "number" ? product.id : fallbackId,
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    keywords: product?.keywords ?? "",
    description: product?.description ?? "",
    highlights: product?.highlights ?? "",
    usage: product?.usage ?? "",
    salesNote: product?.salesNote ?? "",
    imagesText: product?.imagesText ?? "",
    pagesText: product?.pagesText ?? "",
    isActive: typeof product?.isActive === "boolean" ? product.isActive : true,
    offers: offers.length > 0 ? offers : [createDefaultOffer(fallbackId + 1)],
    faqBlocks:
      faqBlocks.length > 0 ? faqBlocks : [createDefaultFaq(fallbackId + 2)],
  };
}

const inputClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none transition hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700";
const textareaClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700";

export default function ChatbotTrainingPage() {
  const [botRole, setBotRole] = useState("");
  const [botRules, setBotRules] = useState("");
  const [salesStrategy, setSalesStrategy] = useState<SalesStrategy>({
    openingStyle: "",
    showOffersInFirstReply: true,
    maxOffersInFirstReply: "2",
    closingQuestionStyle: "",
    toneStyle: "",
  });
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("chatbotRole");
    const savedRules = localStorage.getItem("chatbotRules");
    const savedProducts = localStorage.getItem("chatbotProducts");
    const savedStrategy = localStorage.getItem("chatbotSalesStrategy");

    if (savedRole) setBotRole(savedRole);
    if (savedRules) setBotRules(savedRules);

    if (savedStrategy) {
      try {
        const parsed = JSON.parse(savedStrategy);
        setSalesStrategy({
          openingStyle: parsed?.openingStyle || "",
          showOffersInFirstReply:
            typeof parsed?.showOffersInFirstReply === "boolean"
              ? parsed.showOffersInFirstReply
              : true,
          maxOffersInFirstReply: parsed?.maxOffersInFirstReply || "2",
          closingQuestionStyle: parsed?.closingQuestionStyle || "",
          toneStyle: parsed?.toneStyle || "",
        });
      } catch (error) {
        console.error("โหลด sales strategy ไม่สำเร็จ", error);
      }
    }

    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);

        if (Array.isArray(parsed)) {
          const normalizedProducts = parsed.map((product: any, index: number) =>
            normalizeProduct(product, Date.now() + index * 1000)
          );

          setProducts(
            normalizedProducts.length > 0
              ? normalizedProducts
              : [createDefaultProduct(Date.now())]
          );
        } else {
          setProducts([createDefaultProduct(Date.now())]);
        }
      } catch (error) {
        console.error("โหลด products ไม่สำเร็จ", error);
        setProducts([createDefaultProduct(Date.now())]);
      }
    } else {
      setProducts([createDefaultProduct(Date.now())]);
    }

    setIsMounted(true);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function updateSalesStrategy(
    field: keyof SalesStrategy,
    value: string | boolean
  ) {
    setSalesStrategy((prev) => ({ ...prev, [field]: value }));
  }

  function addProduct() {
    setProducts((prev) => [...prev, createDefaultProduct(Date.now())]);
  }

  function removeProduct(productId: number) {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  }

  function updateProduct(
    productId: number,
    field: keyof Omit<ProductItem, "offers" | "faqBlocks">,
    value: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, [field]: value } : product
      )
    );
  }

  function addOffer(productId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              offers: [...(product.offers || []), createDefaultOffer(Date.now())],
            }
          : product
      )
    );
  }

  function removeOffer(productId: number, offerId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              offers: (product.offers || []).filter(
                (offer) => offer.id !== offerId
              ),
            }
          : product
      )
    );
  }

  function updateOffer(
    productId: number,
    offerId: number,
    field: keyof ProductOffer,
    value: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              offers: (product.offers || []).map((offer) =>
                offer.id === offerId ? { ...offer, [field]: value } : offer
              ),
            }
          : product
      )
    );
  }

  function addFaqBlock(productId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              faqBlocks: [
                ...(product.faqBlocks || []),
                {
                  id: Date.now(),
                  label: "",
                  keywords: "",
                  answer: "",
                  imagesText: "",
                  isActive: true,
                },
              ],
            }
          : product
      )
    );
  }

  function removeFaqBlock(productId: number, faqId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              faqBlocks: (product.faqBlocks || []).filter(
                (faq) => faq.id !== faqId
              ),
            }
          : product
      )
    );
  }

  function updateFaqBlock(
    productId: number,
    faqId: number,
    field: keyof ProductFaqBlock,
    value: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              faqBlocks: (product.faqBlocks || []).map((faq) =>
                faq.id === faqId ? { ...faq, [field]: value } : faq
              ),
            }
          : product
      )
    );
  }

  function handleSave() {
    localStorage.setItem("chatbotRole", botRole);
    localStorage.setItem("chatbotRules", botRules);
    localStorage.setItem("chatbotSalesStrategy", JSON.stringify(salesStrategy));
    localStorage.setItem("chatbotProducts", JSON.stringify(products));

    setSaveMessage("บันทึกการตั้งค่าบอทแล้ว");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      setSaveMessage("");
    }, 2200);
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <p className="text-sm text-zinc-400">AI Workspace</p>
        <h1 className="text-3xl font-bold text-white">Chat Bot Training</h1>
        <p className="mt-1 text-sm text-zinc-400">
          ตั้งค่าบทบาท กฎการตอบ กลยุทธ์การขาย และคำตอบตามคีย์เวิร์ด
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm text-zinc-300">บทบาทของบอท</label>
          <textarea
            value={botRole}
            onChange={(e) => setBotRole(e.target.value)}
            placeholder="เช่น คุณคือแอดมินฝ่ายขายของร้านค้าออนไลน์ ตอบสุภาพ เป็นกันเอง ปิดการขายเก่ง และไม่ถามข้อมูลซ้ำ"
            className={`min-h-[120px] ${textareaClassName}`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">กฎการตอบ</label>
          <textarea
            value={botRules}
            onChange={(e) => setBotRules(e.target.value)}
            placeholder="เช่น ถ้าไม่มีข้อมูลห้ามเดา, ถ้าลูกค้าส่งชื่อเบอร์ที่อยู่แล้วห้ามถามซ้ำ, ถ้าจะปิดการขายให้สรุปแบบกระชับ"
            className={`min-h-[160px] ${textareaClassName}`}
          />
        </div>

        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Sales Strategy Layer</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">แนวเปิดบทสนทนา</label>
              <textarea
                value={salesStrategy.openingStyle}
                onChange={(e) =>
                  updateSalesStrategy("openingStyle", e.target.value)
                }
                placeholder="เช่น ถ้าลูกค้าถามราคาแบบกว้าง ๆ ให้เปิดด้วยสไตล์แอดมินขายของจริง แล้วสรุปโปรหลัก 2 ตัวเลือก"
                className={`min-h-[120px] ${textareaClassName}`}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  น้ำเสียงการตอบ
                </label>
                <input
                  type="text"
                  value={salesStrategy.toneStyle}
                  onChange={(e) => updateSalesStrategy("toneStyle", e.target.value)}
                  placeholder="เช่น สุภาพ เป็นกันเอง แบบแอดมินไทย ปิดการขายนุ่ม ๆ"
                  className={`h-12 ${inputClassName}`}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  ปิดท้ายถามแบบไหน
                </label>
                <input
                  type="text"
                  value={salesStrategy.closingQuestionStyle}
                  onChange={(e) =>
                    updateSalesStrategy("closingQuestionStyle", e.target.value)
                  }
                  placeholder="เช่น ถามให้ลูกค้าเลือกโปร, ถามลักษณะหน้างาน, ถามจำนวนที่ต้องการ"
                  className={`h-12 ${inputClassName}`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-600">
                  <input
                    type="checkbox"
                    checked={salesStrategy.showOffersInFirstReply}
                    onChange={(e) =>
                      updateSalesStrategy(
                        "showOffersInFirstReply",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />
                  <span>ให้โชว์หลายโปรในข้อความแรก</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    จำนวนโปรสูงสุดในข้อความแรก
                  </label>
                  <input
                    type="text"
                    value={salesStrategy.maxOffersInFirstReply}
                    onChange={(e) =>
                      updateSalesStrategy("maxOffersInFirstReply", e.target.value)
                    }
                    placeholder="เช่น 2"
                    className={`h-12 ${inputClassName}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                สินค้า Knowledge + Promo Engine
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                เพิ่มสินค้า ข้อเสนอ และชุดคำตอบตามคีย์เวิร์ดได้เอง
              </p>
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              + เพิ่มสินค้า
            </button>
          </div>

          <div className="space-y-5">
            {products.map((product, productIndex) => (
              <div
                key={product.id}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-5 space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      สินค้า #{productIndex + 1}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      สินค้า 1 ตัวมีหลายข้อเสนอและหลายกลุ่มคำตอบเฉพาะทางได้
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                      <span>เปิดใช้งาน</span>
                      <input
                        type="checkbox"
                        checked={product.isActive}
                        onChange={(e) =>
                          updateProduct(product.id, "isActive", e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="rounded-xl border border-red-900 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
                    >
                      ลบสินค้า
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      ชื่อสินค้า
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        updateProduct(product.id, "name", e.target.value)
                      }
                      placeholder="เช่น ผงกำจัดต้นไม้ สูตรเข้มข้น"
                      className={`h-12 ${inputClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">SKU</label>
                    <input
                      type="text"
                      value={product.sku}
                      onChange={(e) =>
                        updateProduct(product.id, "sku", e.target.value)
                      }
                      placeholder="เช่น TREE-500G"
                      className={`h-12 ${inputClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      คีย์เวิร์ดสินค้า
                    </label>
                    <input
                      type="text"
                      value={product.keywords}
                      onChange={(e) =>
                        updateProduct(product.id, "keywords", e.target.value)
                      }
                      placeholder="เช่น ตอไม้, รากไม้, กอไผ่, วัชพืช"
                      className={`h-12 ${inputClassName}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    รายละเอียดสินค้า
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) =>
                      updateProduct(product.id, "description", e.target.value)
                    }
                    placeholder="อธิบายว่าสินค้านี้เหมาะกับงานอะไร"
                    className={`min-h-[100px] ${textareaClassName}`}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      จุดเด่น
                    </label>
                    <textarea
                      value={product.highlights}
                      onChange={(e) =>
                        updateProduct(product.id, "highlights", e.target.value)
                      }
                      placeholder="เช่น ใช้ได้ทั้งผสมน้ำฉีดและโรยเพียว ๆ"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      วิธีใช้พื้นฐาน
                    </label>
                    <textarea
                      value={product.usage}
                      onChange={(e) =>
                        updateProduct(product.id, "usage", e.target.value)
                      }
                      placeholder="เช่น ผสมน้ำฉีดหรือโรยตรงโคน"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      ข้อความขายสั้น
                    </label>
                    <textarea
                      value={product.salesNote}
                      onChange={(e) =>
                        updateProduct(product.id, "salesNote", e.target.value)
                      }
                      placeholder="เช่น ถ้าหน้างานเป็นตอไม้หรือกอไผ่ ตัวนี้คุ้มมาก"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      รูปสินค้าหลัก (1 บรรทัดต่อ 1 รูป)
                    </label>
                    <textarea
                      value={product.imagesText}
                      onChange={(e) =>
                        updateProduct(product.id, "imagesText", e.target.value)
                      }
                      placeholder={`https://...
https://...`}
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      ใช้กับเพจไหนบ้าง
                    </label>
                    <textarea
                      value={product.pagesText}
                      onChange={(e) =>
                        updateProduct(product.id, "pagesText", e.target.value)
                      }
                      placeholder="เช่น เพจ A, เพจ B"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        ข้อเสนอ / ราคา
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        ใส่หลายราคา หลายโปรได้ในสินค้าตัวเดียว
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addOffer(product.id)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      + เพิ่มข้อเสนอ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(product.offers || []).map((offer, offerIndex) => (
                      <div
                        key={offer.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-sm font-semibold text-white">
                              ข้อเสนอ #{offerIndex + 1}
                            </h5>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                              <span>เปิดใช้งาน</span>
                              <input
                                type="checkbox"
                                checked={offer.isActive}
                                onChange={(e) =>
                                  updateOffer(
                                    product.id,
                                    offer.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => removeOffer(product.id, offer.id)}
                              className="rounded-xl border border-red-900 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
                            >
                              ลบข้อเสนอ
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ชื่อข้อเสนอ
                            </label>
                            <input
                              type="text"
                              value={offer.title}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น 1 ถัง / 2 ถัง / 3 ถัง"
                              className={`h-12 ${inputClassName.replace("bg-zinc-950", "bg-black")}`}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ราคา
                            </label>
                            <input
                              type="text"
                              value={offer.price}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "price",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น 159 / 290"
                              className={`h-12 ${inputClassName.replace("bg-zinc-950", "bg-black")}`}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              หมายเหตุ
                            </label>
                            <input
                              type="text"
                              value={offer.note}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "note",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น ค่าส่ง 40 / ส่งฟรี / คุ้มสุด"
                              className={`h-12 ${inputClassName.replace("bg-zinc-950", "bg-black")}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            รูปข้อเสนอนี้ (1 บรรทัดต่อ 1 รูป)
                          </label>
                          <textarea
                            value={offer.imagesText}
                            onChange={(e) =>
                              updateOffer(
                                product.id,
                                offer.id,
                                "imagesText",
                                e.target.value
                              )
                            }
                            placeholder={`https://...
https://...`}
                            className={`min-h-[100px] ${textareaClassName.replace("bg-zinc-950", "bg-black")}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        Keyword Response Blocks
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        ใช้ตอบคำถามเฉพาะทาง เช่น วิธีใช้ อันตรายไหม ใช้ได้นานไหม
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addFaqBlock(product.id)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      + เพิ่ม block คำตอบ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(product.faqBlocks || []).map((faq, faqIndex) => (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-sm font-semibold text-white">
                              Block #{faqIndex + 1}
                            </h5>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                              <span>เปิดใช้งาน</span>
                              <input
                                type="checkbox"
                                checked={faq.isActive}
                                onChange={(e) =>
                                  updateFaqBlock(
                                    product.id,
                                    faq.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => removeFaqBlock(product.id, faq.id)}
                              className="rounded-xl border border-red-900 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
                            >
                              ลบ block
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ชื่อหมวดคำตอบ
                            </label>
                            <input
                              type="text"
                              value={faq.label}
                              onChange={(e) =>
                                updateFaqBlock(
                                  product.id,
                                  faq.id,
                                  "label",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น วิธีใช้ / ความปลอดภัย / ขนาด"
                              className={`h-12 ${inputClassName.replace("bg-zinc-950", "bg-black")}`}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              คีย์เวิร์ดจับคำถาม
                            </label>
                            <input
                              type="text"
                              value={faq.keywords}
                              onChange={(e) =>
                                updateFaqBlock(
                                  product.id,
                                  faq.id,
                                  "keywords",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น วิธีใช้, ใช้ยังไง, ใช้อย่างไร"
                              className={`h-12 ${inputClassName.replace("bg-zinc-950", "bg-black")}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            คำตอบหลักของ block นี้
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) =>
                              updateFaqBlock(
                                product.id,
                                faq.id,
                                "answer",
                                e.target.value
                              )
                            }
                            placeholder="ใส่ fact ที่อยากให้บอทใช้ตอบเวลาเจอคำถามกลุ่มนี้"
                            className={`min-h-[120px] ${textareaClassName.replace("bg-zinc-950", "bg-black")}`}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            รูปประกอบของ block นี้ (1 บรรทัดต่อ 1 รูป)
                          </label>
                          <textarea
                            value={faq.imagesText}
                            onChange={(e) =>
                              updateFaqBlock(
                                product.id,
                                faq.id,
                                "imagesText",
                                e.target.value
                              )
                            }
                            placeholder={`https://...
https://...`}
                            className={`min-h-[100px] ${textareaClassName.replace("bg-zinc-950", "bg-black")}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
          <div className="min-h-[24px]">
            {saveMessage && (
              <p className="text-sm text-green-400 transition">{saveMessage}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
}