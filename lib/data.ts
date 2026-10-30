export type Lang = "ar" | "fr";
export type L10n = Record<Lang, string>;

export const CONTACT = {
  brand: "BAKKOUTELE",
  phones: [
    { display: "06 60 60 60 85", tel: "0660606085", intl: "212660606085" },
    { display: "06 67 68 28 31", tel: "0667682831", intl: "212667682831" },
  ],
  address: {
    ar: "سولد رضا، شارع الحسيمة، عمارة E رقم 28، الطابق 2، الرباط",
    fr: "Solde Reda, Avenue Al Hosaima, Imm E N°28, 2ème étage, Rabat",
  } satisfies L10n,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Avenue Al Hoceima, Rabat, Maroc"),
};

export const PARTNER: L10n = {
  ar: "غرفة التجارة والصناعة والخدمات لجهة الرباط-سلا-القنيطرة",
  fr: "Chambre de Commerce, d'Industrie et de Services Rabat-Salé-Kénitra",
};

export type ProductCategory = "solder" | "optics" | "power" | "cctv";
export type ProductIcon = "flame" | "pen" | "microscope" | "zap" | "cctv" | "camera" | "layers" | "wrench";

export interface Product {
  id: string;
  category: ProductCategory;
  icon: ProductIcon;
  name: L10n;
  spec: L10n;
  tags: string[];
  accent: "cyan" | "orange";
}

export const PRODUCTS: Product[] = [
  {
    id: "hot-air-2in1",
    category: "solder",
    icon: "flame",
    accent: "orange",
    name: { ar: "محطة هواء ساخن + كاوية 2 في 1", fr: "Station air chaud + fer 2-en-1" },
    spec: {
      ar: "تحكم رقمي في الحرارة وتدفق الهواء، لفك وتركيب الدوائر المدمجة BGA.",
      fr: "Température et débit d'air numériques, pour dépose/repose de circuits BGA.",
    },
    tags: ["Rework", "BGA", "SMD"],
  },
  {
    id: "t12-station",
    category: "solder",
    icon: "pen",
    accent: "orange",
    name: { ar: "محطة لحام دقيق T12 / C210", fr: "Station de micro-soudure T12 / C210" },
    spec: {
      ar: "تسخين سريع ورؤوس دقيقة للّحام الميكروسكوبي على اللوحات الأم.",
      fr: "Chauffe rapide et pannes fines pour la micro-soudure sur cartes mères.",
    },
    tags: ["Micro-soudure", "T12", "C210"],
  },
  {
    id: "trinocular-microscope",
    category: "optics",
    icon: "microscope",
    accent: "cyan",
    name: { ar: "مجهر ثلاثي العدسات 7x–45x", fr: "Microscope trinoculaire 7x–45x" },
    spec: {
      ar: "تكبير متغيّر ومنفذ كاميرا للتصوير وشرح الأعطال للطلبة.",
      fr: "Zoom continu et port caméra pour filmer et documenter les réparations.",
    },
    tags: ["Zoom", "LED", "Caméra"],
  },
  {
    id: "dc-supply",
    category: "power",
    icon: "zap",
    accent: "cyan",
    name: { ar: "مزوّد طاقة DC ‏30V / 5A", fr: "Alimentation DC 30V / 5A" },
    spec: {
      ar: "أمبيرمتر دقيق لقراءة استهلاك التيار وكشف الشورت في اللوحات.",
      fr: "Ampèremètre précis pour lire la consommation et détecter les courts-circuits.",
    },
    tags: ["Diagnostic", "30V", "5A"],
  },
  {
    id: "preheater",
    category: "solder",
    icon: "layers",
    accent: "orange",
    name: { ar: "صفيحة تسخين مسبق للوحات", fr: "Plaque de préchauffage PCB" },
    spec: {
      ar: "تسخين متجانس للوحة قبل فك المعالج أو الذاكرة لتجنّب التشوه.",
      fr: "Préchauffe homogène avant dépose CPU/NAND pour éviter la déformation.",
    },
    tags: ["Préchauffe", "CPU", "NAND"],
  },
  {
    id: "toolkit",
    category: "solder",
    icon: "wrench",
    accent: "cyan",
    name: { ar: "طقم أدوات فك + بساط مغناطيسي", fr: "Kit démontage + tapis magnétique" },
    spec: {
      ar: "مفكات دقيقة، ملاقط مضادة للكهرباء الساكنة، وأدوات فتح الشاشات.",
      fr: "Tournevis de précision, pinces antistatiques et outils d'ouverture d'écran.",
    },
    tags: ["ESD", "Précision"],
  },
  {
    id: "cctv-kit-4",
    category: "cctv",
    icon: "cctv",
    accent: "cyan",
    name: { ar: "طقم 4 كاميرات IP + NVR بتقنية PoE", fr: "Kit 4 caméras IP + NVR PoE" },
    spec: {
      ar: "متوفر بعلامتَي Hikvision و Dahua، مع قرص تسجيل وتهيئة كاملة.",
      fr: "Disponible en Hikvision et Dahua, avec disque d'enregistrement et configuration.",
    },
    tags: ["Hikvision", "Dahua", "PoE"],
  },
  {
    id: "wifi-dome",
    category: "cctv",
    icon: "camera",
    accent: "cyan",
    name: { ar: "كاميرا قبة IP لاسلكية", fr: "Caméra dôme IP Wi-Fi" },
    spec: {
      ar: "طرازات TP-Link و Xiaomi، دوران أفقي وعمودي ورؤية ليلية.",
      fr: "Modèles TP-Link et Xiaomi, pan/tilt et vision de nuit.",
    },
    tags: ["TP-Link", "Xiaomi", "Wi-Fi"],
  },
];

export const CCTV_BRANDS = [
  {
    id: "hikvision",
    name: "Hikvision",
    tools: ["SADP", "iVMS-4200", "Hik-Connect"],
    defaultIp: "192.168.1.64",
  },
  {
    id: "dahua",
    name: "Dahua",
    tools: ["ConfigTool", "SmartPSS", "DMSS"],
    defaultIp: "192.168.1.108",
  },
  {
    id: "tplink",
    name: "TP-Link",
    tools: ["VIGI Security Manager", "VIGI App", "Tapo"],
    defaultIp: "DHCP",
  },
  {
    id: "xiaomi",
    name: "Xiaomi",
    tools: ["Xiaomi Home", "Cloud / microSD"],
    defaultIp: "DHCP",
  },
] as const;

export function whatsappLink(message: string, phoneIntl = CONTACT.phones[0].intl) {
  return `https://wa.me/${phoneIntl}?text=${encodeURIComponent(message)}`;
}
