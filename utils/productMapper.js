function parseAgePlus(age) {
  if (typeof age === "number" && Number.isFinite(age)) return age;
  if (!age) return 3;
  const match = String(age).match(/(\d+)/);
  return match ? Number(match[1]) : 3;
}

function formatAgePlus(agePlus) {
  return `${agePlus}Y+`;
}

function parseTags(input) {
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim()).filter(Boolean);
  }
  if (!input) return [];
  return String(input)
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeHex(value) {
  const raw = String(value ?? "").trim();
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : "";
}

function parseProductColors(input) {
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const hex = normalizeHex(item.hex);
      if (!hex) return null;
      return {
        name: String(item.name ?? "").trim(),
        hex,
      };
    })
    .filter(Boolean);
}

function parseBool(value) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function dashboardToProductFields(input) {
  const body = input || {};
  const price = Number(body.price);
  const category = String(body.category ?? "").trim();
  const ageStr = body.age ? String(body.age) : undefined;
  const tags = parseTags(body.tags);
  const colors = parseProductColors(body.colors);
  const hasMultipleColors = parseBool(body.hasMultipleColors) && colors.length > 0;

  const imgSource = body.pictures ?? body.img ?? [];
  const img = Array.isArray(imgSource)
    ? imgSource.filter((url) => typeof url === "string" && url.trim())
    : [];

  return {
    name: String(body.name ?? ""),
    sku: String(body.sku ?? `SKU-${Date.now()}`),
    price: Number.isFinite(price) ? price : 0,
    description: String(body.description ?? ""),
    img,
    age_plus: parseAgePlus(ageStr ?? body.age_plus),
    age: ageStr ?? formatAgePlus(parseAgePlus(body.age_plus)),
    ageTranche: String(body.ageTranche ?? "").trim(),
    isEducational:
      parseBool(body.isBook) ||
      /book|livre|éducat|educat/i.test(category) ||
      tags.some((t) => /book|livre|éducat|educat/i.test(t)),
    category: category || "Autre",
    tags,
    sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ["standard"],
    rating: Number(body.rating ?? 0),
    stock: Number(body.stock ?? 100),
    articles: Array.isArray(body.articles) ? body.articles : [],
    characteristics: String(body.characteristics ?? ""),
    character: String(body.character ?? "").trim(),
    warning: String(body.warning ?? ""),
    whyLoveIt: Array.isArray(body.whyLoveIt) ? body.whyLoveIt : [],
    qa: Array.isArray(body.qa) ? body.qa : [],
    isBook: parseBool(body.isBook),
    isTrending: parseBool(body.isTrending),
    hasMultipleColors,
    colors: hasMultipleColors ? colors : [],
  };
}

function productToDashboard(doc) {
  const d = doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};
  const id = String(d._id ?? d.id ?? "");
  return {
    id,
    _id: id,
    name: String(d.name ?? ""),
    price: String(d.price ?? ""),
    description: String(d.description ?? ""),
    articles: d.articles ?? [],
    characteristics: String(d.characteristics ?? ""),
    age: d.age ? String(d.age) : formatAgePlus(Number(d.age_plus ?? 3)),
    ageTranche: String(d.ageTranche ?? ""),
    category: String(d.category ?? ""),
    character: String(d.character ?? ""),
    tags: d.tags ?? [],
    warning: String(d.warning ?? ""),
    pictures: d.img ?? [],
    img: d.img ?? [],
    whyLoveIt: d.whyLoveIt ?? [],
    qa: d.qa ?? [],
    isBook: Boolean(d.isBook),
    isTrending: Boolean(d.isTrending),
    hasMultipleColors: Boolean(d.hasMultipleColors),
    colors: parseProductColors(d.colors),
    sku: String(d.sku ?? ""),
    stock: Number(d.stock ?? 0),
    rating: Number(d.rating ?? 0),
  };
}

module.exports = {
  dashboardToProductFields,
  productToDashboard,
  parseProductColors,
};
