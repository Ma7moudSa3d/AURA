// Run: node --env-file=.env.local scripts/seed.mjs
// Inserts sample bilingual products (no images; upload images from /admin/products).
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const products = [
  { slug: "aura-noir-oud", title_en: "Noir Oud", title_ar: "عود نوار", collection: "Signature", gender: "unisex", price: 2450, stock_qty: 25, is_featured: true,
    description_en: "A smoldering heart of aged oud wrapped in saffron and warm amber. Nocturnal, regal, unforgettable.",
    description_ar: "قلب متوهج من العود المعتق تحيط به نوتات الزعفران والعنبر الدافئ. ليلي، ملكي، لا يُنسى.",
    notes: { top: ["Saffron", "Bergamot", "Pink pepper"], heart: ["Aged oud", "Rose", "Incense"], base: ["Amber", "Sandalwood", "Musk"] } },
  { slug: "aura-royal-amber", title_en: "Royal Amber", title_ar: "عنبر ملكي", collection: "Signature", gender: "unisex", price: 2150, discount_percent: 10, stock_qty: 40, is_featured: true,
    description_en: "Golden amber, vanilla bean and soft resins in a velvety, long-lasting embrace.",
    description_ar: "عنبر ذهبي وفانيليا وراتنجات ناعمة في عناق مخملي يدوم طويلاً.",
    notes: { top: ["Cardamom", "Mandarin"], heart: ["Labdanum", "Jasmine"], base: ["Vanilla", "Amber", "Tonka bean"] } },
  { slug: "aura-velvet-rose", title_en: "Velvet Rose", title_ar: "ورد مخملي", collection: "Floral", gender: "women", price: 1950, stock_qty: 30, is_featured: true,
    description_en: "Damask rose petals dusted with violet and white musk. Soft power, worn with grace.",
    description_ar: "بتلات الورد الدمشقي مع لمسة بنفسج ومسك أبيض. قوة ناعمة بأناقة.",
    notes: { top: ["Lychee", "Pink pepper"], heart: ["Damask rose", "Violet", "Peony"], base: ["White musk", "Cedar"] } },
  { slug: "aura-midnight-vetiver", title_en: "Midnight Vetiver", title_ar: "فيتيفر منتصف الليل", collection: "Woody", gender: "men", price: 1850, stock_qty: 3, low_stock_threshold: 5, is_featured: true,
    description_en: "Cool vetiver and smoked cedar over a base of dark leather. Quiet confidence in a bottle.",
    description_ar: "فيتيفر منعش وأرز مدخن فوق قاعدة من الجلد الداكن. ثقة هادئة في زجاجة.",
    notes: { top: ["Grapefruit", "Juniper"], heart: ["Vetiver", "Smoked cedar"], base: ["Leather", "Patchouli", "Oakmoss"] } },
  { slug: "aura-white-jasmine", title_en: "White Jasmine", title_ar: "ياسمين أبيض", collection: "Floral", gender: "women", price: 1750, stock_qty: 18,
    description_en: "Night-blooming jasmine, orange blossom and creamy sandalwood.",
    description_ar: "ياسمين الليل وزهر البرتقال وخشب الصندل الكريمي.",
    notes: { top: ["Neroli", "Pear"], heart: ["Jasmine sambac", "Orange blossom"], base: ["Sandalwood", "Musk"] } },
  { slug: "aura-sahara-citrus", title_en: "Sahara Citrus", title_ar: "حمضيات الصحراء", collection: "Fresh", gender: "unisex", price: 1650, discount_price: 1400, stock_qty: 50,
    description_en: "Sun-warmed citrus, mint and desert woods. Radiant from the first spray.",
    description_ar: "حمضيات دافئة بالشمس ونعناع وأخشاب صحراوية. إشراقة من أول رشة.",
    notes: { top: ["Lemon", "Bergamot", "Mint"], heart: ["Neroli", "Green tea"], base: ["Cedar", "Ambroxan"] } },
];

for (const { notes, ...p } of products) {
  const { data, error } = await sb.from("products").upsert({ volume: "50ml", concentration: "EDP", is_active: true, tags: [p.collection.toLowerCase()], ...p }, { onConflict: "slug" }).select("id").single();
  if (error) { console.error(p.slug, error.message); continue; }
  await sb.from("product_notes").upsert({ product_id: data.id, top_notes: notes.top, heart_notes: notes.heart, base_notes: notes.base });
  console.log("seeded", p.slug);
}
await sb.from("coupons").upsert({ code: "WELCOME10", type: "percent", value: 10, max_uses: 100 }, { onConflict: "code" });
console.log("done");
