import { NextResponse } from "next/server";

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }

  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cols) => {
    const row: Row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").trim();
    });
    return row;
  });
}

function pick(row: Row, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k]) return row[k];
  }
  return "";
}

function normalizeSheetUrl(input: string): string {
  const url = input.trim();
  if (!url) return "";

  if (/output=csv/i.test(url) || url.endsWith(".csv")) return url;

  const editMatch = url.match(
    /docs\.google\.com\/spreadsheets\/d\/([^/]+)\/?.*?(?:gid=(\d+))?/i
  );
  if (editMatch) {
    const id = editMatch[1];
    const gid = editMatch[2] || "0";
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }

  return url;
}

export async function POST(req: Request) {
  try {
    const { sheetUrl } = await req.json();
    const csvUrl = normalizeSheetUrl(String(sheetUrl || ""));

    if (!csvUrl) {
      return NextResponse.json(
        { error: "sheetUrl is required" },
        { status: 400 }
      );
    }

    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "ดึง Google Sheet ไม่ได้ — ตรวจว่าได้ตั้ง 'แชร์: ทุกคนที่มีลิงก์' แล้ว",
          status: response.status,
        },
        { status: 400 }
      );
    }

    const text = await response.text();
    const rows = parseCsv(text);

    const grouped = new Map<string, any>();
    let nextId = Date.now();

    for (const row of rows) {
      const name = pick(row, "name", "ชื่อสินค้า", "product", "product_name");
      if (!name) continue;

      const key = name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: nextId++,
          name,
          sku: pick(row, "sku", "code"),
          keywords: pick(row, "keywords", "คีย์เวิร์ด"),
          description: pick(row, "description", "รายละเอียด"),
          highlights: pick(row, "highlights", "จุดเด่น"),
          usage: pick(row, "usage", "วิธีใช้"),
          salesNote: pick(row, "salesnote", "sales_note", "salesNote", "หมายเหตุการขาย"),
          imagesText: pick(row, "imagestext", "images", "images_text", "รูป"),
          pagesText: pick(row, "pagestext", "pages", "pages_text"),
          isActive: true,
          offers: [],
          faqBlocks: [],
        });
      }

      const product = grouped.get(key);
      const offerTitle = pick(row, "offertitle", "offer_title", "โปร", "promo");
      const offerPrice = pick(row, "offerprice", "offer_price", "ราคา", "price");

      if (offerTitle || offerPrice) {
        product.offers.push({
          id: nextId++,
          title: offerTitle,
          price: offerPrice,
          note: pick(row, "offernote", "offer_note", "หมายเหตุ"),
          imagesText: pick(row, "offerimages", "offer_images", "offerimagestext"),
          isActive: true,
        });
      }
    }

    const products = Array.from(grouped.values()).map((p) => {
      if (p.offers.length === 0) {
        p.offers.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: "",
          price: "",
          note: "",
          imagesText: "",
          isActive: true,
        });
      }
      return p;
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("import sheet error", error);
    return NextResponse.json({ error: "import failed" }, { status: 500 });
  }
}
