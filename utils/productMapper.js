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
  if (!raw) return "";

  let hex = raw.startsWith("#") ? raw.slice(1) : raw;

  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (/^[0-9A-Fa-f]{8}$/.test(hex)) {
    hex = hex.slice(0, 6);
  }

  return /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}`.toUpperCase() : "";
}

function parseColorItem(item) {
  if (typeof item === "string") {
    const hex = normalizeHex(item);
    return hex ? { name: "", hex } : null;
  }

  if (!item || typeof item !== "object") return null;

  const hex = normalizeHex(item.hex ?? item.color ?? item.value ?? item.code ?? item.colour);
  if (!hex) return null;

  return {
    name: String(item.name ?? item.label ?? item.title ?? "").trim(),
    hex,
  };
}

function parseProductColors(input) {
  if (input === undefined || input === null || input === "") return undefined;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      input = JSON.parse(trimmed);
    } catch {
      const hex = normalizeHex(trimmed);
      return hex ? [{ name: "", hex }] : [];
    }
  }

  if (!Array.isArray(input)) {
    const single = parseColorItem(input);
    return single ? [single] : [];
  }

  return input.map(parseColorItem).filter(Boolean);
}

function parseBool(value) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function readMultipleColorsFlag(body) {
  const raw =
    body.hasMultipleColors ??
    body.hasmultiplecolors ??
    body.multipleColors ??
    body.multiplecolors ??
    body.multiple_colors;

  if (raw === undefined || raw === null || raw === "") return undefined;
  return parseBool(raw);
}

function parseJsonField(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeProductBody(input) {
  const body = { ...(input || {}) };

  for (const key of ["data", "product", "payload", "form", "body", "productData"]) {
    const parsed = parseJsonField(body[key]);
    if (parsed) {
      Object.assign(body, parsed);
    }
  }

  for (const key of ["tags", "articles", "whyLoveIt", "qa", "sizes", "pictures", "img"]) {
    const parsed = parseJsonField(body[key]);
    if (parsed) body[key] = parsed;
  }

  return body;
}

function extractColorsFromBody(body) {
  const candidates = [
    body.colors,
    body.colorOptions,
    body.productColors,
    body.couleurs,
    body.couleur,
    body.color,
    body.selectedColors,
    body.variantColors,
  ];

  for (const candidate of candidates) {
    const parsed = parseProductColors(candidate);
    if (parsed !== undefined) return parsed;
  }

  return undefined;
}

function dashboardToProductFields(input, options = {}) {
  const { partial = false } = options;
  const body = normalizeProductBody(input);
  const price = Number(body.price);
  const category = String(body.category ?? "").trim();
  const ageStr = body.age ? String(body.age) : undefined;
  const tags = parseTags(body.tags);
  const parsedColors = extractColorsFromBody(body);
  const wantsMultipleColors = readMultipleColorsFlag(body);
  const hasColorInput = parsedColors !== undefined;
  const colors = hasColorInput ? parsedColors : [];
  const hasMultipleColors = hasColorInput ? colors.length > 0 : undefined;

  const imgSource = body.pictures ?? body.img ?? [];
  const img = Array.isArray(imgSource)
    ? imgSource.filter((url) => typeof url === "string" && url.trim())
    : [];

  const fields = {
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
  };

  if (!partial || hasColorInput || wantsMultipleColors !== undefined) {
    fields.hasMultipleColors = Boolean(hasMultipleColors);
    fields.colors = colors;
  }

  return fields;
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
    multiplecolors: Boolean(d.hasMultipleColors),
    colors: parseProductColors(d.colors) ?? [],
    sku: String(d.sku ?? ""),
    stock: Number(d.stock ?? 0),
    rating: Number(d.rating ?? 0),
  };
}

module.exports = {
  dashboardToProductFields,
  productToDashboard,
  parseProductColors,
  normalizeProductBody,
};
