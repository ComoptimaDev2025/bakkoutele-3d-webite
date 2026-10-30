"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang } from "./data";

const ar = {
  nav: {
    training: "التكوين",
    ai: "Bakkou AI",
    store: "المتجر",
    contact: "اتصل بنا",
    whatsapp: "واتساب",
    menu: "القائمة",
    close: "إغلاق",
    switchLang: "Français",
    hello: "السلام عليكم، أريد الاستفسار عن خدمات Bakkou Tele.",
  },
  hero: {
    eyebrow: "أكاديمية بكّو للتقنية والذكاء الاصطناعي · الرباط",
    title: "مستقبل صيانة الهواتف وكاميرات المراقبة بالذكاء الاصطناعي",
    lead: "تكوين تطبيقي في إصلاح الهواتف والحواسيب وتركيب أنظمة المراقبة، داخل مختبر مجهّز بأدوات اللحام الدقيق والتشخيص.",
    ctaTraining: "استكشف التكوين الثلاثي الأبعاد",
    ctaAi: "جرب الذكاء الاصطناعي",
    ctaStore: "متجر المعدات",
    partner: "بشراكة مع",
    hint: "حرّك المؤشر وانقر على المكونات",
    stats: [
      { k: "8", v: "أسابيع تكوين" },
      { k: "4", v: "علامات كاميرات" },
      { k: "2", v: "مسارات احترافية" },
    ],
  },
  parts: {
    cpu: { name: "المعالج (CPU / SoC)", info: "إعادة الكُرات (Reballing) وفحص خطوط التغذية VDD_CPU." },
    pmic: { name: "دارة الطاقة PMIC", info: "تشخيص غياب التشغيل وقراءة التيار على مزوّد DC." },
    nand: { name: "ذاكرة NAND", info: "الفلاش، استرجاع البيانات ونقل الذاكرة بين اللوحات." },
    camera: { name: "وحدة الكاميرا", info: "استبدال العدسات وإصلاح موصلات الكاميرا الخلفية." },
    battery: { name: "البطارية", info: "فحص الموصل ودارة الحماية والشحن." },
  },
  training: {
    kicker: "مسارات التكوين",
    title: "تعلّم على الجهاز، لا على الورق",
    lead: "كل وحدة مبنية حول أعطال حقيقية تمرّ على الطاولة كل يوم.",
    moduleA: {
      tag: "الوحدة A · الهواتف والحواسيب",
      title: "إصلاح الهواتف الذكية والحواسيب المحمولة",
      duration: "8 أسابيع · شهران",
      items: [
        { t: "اللحام الدقيق", d: "Micro-soudure على اللوحات الأم تحت المجهر." },
        { t: "تشخيص اللوحة الأم", d: "قراءة المخططات، قياس الخطوط وتتبع الشورت." },
        { t: "استبدال الشاشات", d: "Afficheur: الفك والتركيب والمعايرة." },
        { t: "الفلاش وفك التشفير", d: "Flash / Décodage وتحديث الأنظمة." },
        { t: "استرجاع البيانات", d: "إنقاذ الصور والملفات من الأجهزة المعطلة." },
      ],
      cta: "سجّل في هذه الوحدة",
      layers: { glass: "الغطاء الخلفي", camera: "الكاميرا", board: "Micro-soudure · اللوحة الأم", battery: "البطارية", display: "Afficheur · الشاشة" },
    },
    moduleB: {
      tag: "الوحدة B · أنظمة المراقبة",
      title: "تركيب وبرمجة كاميرات المراقبة",
      duration: "تكوين ميداني",
      items: [
        { t: "إعداد DVR / NVR", d: "التهيئة، التسجيل وإدارة الأقراص." },
        { t: "البرمجة والشبكات", d: "عناوين IP، PoE والوصول عن بعد." },
        { t: "التركيب الميداني", d: "التمديد، التثبيت وضبط زوايا الرؤية." },
      ],
      brandsTitle: "العلامات المدروسة",
      tools: "أدوات الإعداد",
      defaultIp: "IP الافتراضي",
      cta: "سجّل في تكوين المراقبة",
    },
  },
  ai: {
    kicker: "Bakkou AI",
    title: "مساعد تشخيص يفكّر مثل تقني",
    lead: "أدخل الأعراض وقراءة التيار، فيقترح عليك المسار الأرجح للعطل والمكونات المشتبه بها والأدوات اللازمة.",
    cta: "افتح واجهة التشخيص",
    preview: [
      "> device: smartphone · symptom: no_power",
      "> dc_supply: 4.2V · 1.40A ⟶ instant draw",
      "analyse: short probable on VDD_MAIN",
      "suggest: inject 1V · locate hot capacitor",
    ],
  },
  store: {
    kicker: "Bakkou Tech Store",
    title: "معدات المختبر الاحترافية",
    lead: "نفس الأدوات التي نستعملها في التكوين. اطلب مباشرة عبر واتساب.",
    filters: { all: "الكل", solder: "اللحام", optics: "البصريات", power: "الطاقة", cctv: "المراقبة" },
    price: "السعر عند الطلب",
    add: "أضف للطلب",
    added: "في الطلب",
    orderOne: "اطلب عبر واتساب",
    cart: "طلبك",
    cartEmpty: "لم تضف أي منتج بعد.",
    checkout: "إرسال الطلب عبر واتساب",
    qty: "الكمية",
    remove: "حذف",
    msgIntro: "السلام عليكم، أريد طلب المنتجات التالية من متجر Bakkou Tech:",
    msgOne: "السلام عليكم، أريد الاستفسار عن ثمن وتوفر المنتج:",
    msgEnd: "شكراً.",
  },
  contact: {
    kicker: "تواصل",
    title: "زورونا في الرباط",
    address: "العنوان",
    call: "اتصل",
    whatsapp: "واتساب",
    map: "افتح في خرائط Google",
    partner: "شريك مؤسساتي",
    rights: "جميع الحقوق محفوظة",
    registerMsg: "السلام عليكم، أريد التسجيل في تكوين:",
  },
  diag: {
    back: "العودة للرئيسية",
    title: "واجهة التشخيص Bakkou AI",
    lead: "محاكاة تعليمية لمسار التشخيص. النتائج تقديرية وتُؤكَّد دائماً بالقياس على الطاولة.",
    device: "الجهاز",
    devices: { phone: "هاتف", laptop: "حاسوب محمول", cctv: "نظام مراقبة" },
    symptoms: "الأعراض",
    current: "التيار المقروء (A)",
    voltage: "الجهد (V)",
    currentHint: "القراءة على مزوّد DC عند الضغط على زر التشغيل",
    brand: "العلامة",
    power: "التغذية",
    cable: "طول الكابل (m)",
    notes: "ملاحظات إضافية",
    notesPh: "مثال: سقط في الماء، يسخن قرب الشاحن…",
    run: "تشغيل التحليل",
    running: "جارٍ التحليل…",
    reset: "تحليل جديد",
    terminal: "مخرجات المحرك",
    idle: "في انتظار الإدخال…",
    result: "التشخيص",
    confidence: "درجة الترجيح",
    suspects: "المكونات المشتبه بها",
    steps: "خطوات التحقق",
    tools: "الأدوات المقترحة",
    order: "اطلب",
    needSymptom: "اختر عرضاً واحداً على الأقل.",
    error: "تعذّر الاتصال بالمحرك. حاول مرة أخرى.",
  },
  fallback: "وضع ثنائي الأبعاد مفعّل لتحسين الأداء على هذا الجهاز.",
};

export type Dict = typeof ar;

const fr: Dict = {
  nav: {
    training: "Formations",
    ai: "Bakkou AI",
    store: "Boutique",
    contact: "Contact",
    whatsapp: "WhatsApp",
    menu: "Menu",
    close: "Fermer",
    switchLang: "العربية",
    hello: "Bonjour, je souhaite me renseigner sur les services de Bakkou Tele.",
  },
  hero: {
    eyebrow: "Bakkou AI-Tech Academy · Rabat",
    title: "L'avenir de la réparation smartphone et de la vidéosurveillance, propulsé par l'IA",
    lead: "Formations pratiques en réparation de smartphones, d'ordinateurs portables et en installation de systèmes CCTV, dans un laboratoire équipé pour la micro-soudure et le diagnostic.",
    ctaTraining: "Explorer la formation 3D",
    ctaAi: "Essayer l'IA",
    ctaStore: "Boutique matériel",
    partner: "En partenariat avec",
    hint: "Bougez la souris et cliquez sur les composants",
    stats: [
      { k: "8", v: "semaines de formation" },
      { k: "4", v: "marques CCTV" },
      { k: "2", v: "filières pro" },
    ],
  },
  parts: {
    cpu: { name: "Processeur (CPU / SoC)", info: "Reballing et contrôle des lignes d'alimentation VDD_CPU." },
    pmic: { name: "Circuit d'alimentation PMIC", info: "Diagnostic « ne s'allume pas » et lecture du courant sur alimentation DC." },
    nand: { name: "Mémoire NAND", info: "Flash, récupération de données et transfert de mémoire." },
    camera: { name: "Module caméra", info: "Remplacement des lentilles et réparation des connecteurs caméra." },
    battery: { name: "Batterie", info: "Contrôle du connecteur, du circuit de protection et de charge." },
  },
  training: {
    kicker: "Filières de formation",
    title: "Apprendre sur l'appareil, pas sur le papier",
    lead: "Chaque module est construit autour des pannes réelles qui passent sur l'établi chaque jour.",
    moduleA: {
      tag: "Module A · Smartphones & PC portables",
      title: "Réparation smartphones et ordinateurs portables",
      duration: "8 semaines · 2 mois",
      items: [
        { t: "Micro-soudure", d: "Travail sur carte mère sous microscope." },
        { t: "Diagnostic carte mère", d: "Lecture de schémas, mesure des lignes, traque des courts-circuits." },
        { t: "Remplacement d'écran", d: "Afficheur : dépose, pose et calibration." },
        { t: "Flash & décodage", d: "Flash / Décodage et mise à jour logicielle." },
        { t: "Récupération de données", d: "Sauver photos et fichiers d'appareils en panne." },
      ],
      cta: "S'inscrire à ce module",
      layers: { glass: "Vitre arrière", camera: "Caméra", board: "Micro-soudure · Carte mère", battery: "Batterie", display: "Afficheur · Écran" },
    },
    moduleB: {
      tag: "Module B · Vidéosurveillance",
      title: "Installation et programmation CCTV",
      duration: "Formation terrain",
      items: [
        { t: "Configuration DVR / NVR", d: "Initialisation, enregistrement et gestion des disques." },
        { t: "Programmation & réseau", d: "Adressage IP, PoE et accès à distance." },
        { t: "Installation terrain", d: "Câblage, fixation et réglage des angles de vue." },
      ],
      brandsTitle: "Marques étudiées",
      tools: "Outils de configuration",
      defaultIp: "IP par défaut",
      cta: "S'inscrire à la formation CCTV",
    },
  },
  ai: {
    kicker: "Bakkou AI",
    title: "Un assistant de diagnostic qui raisonne comme un technicien",
    lead: "Saisissez les symptômes et la consommation : il propose la piste de panne la plus probable, les composants suspects et l'outillage nécessaire.",
    cta: "Ouvrir l'interface de diagnostic",
    preview: [
      "> device: smartphone · symptom: no_power",
      "> dc_supply: 4.2V · 1.40A ⟶ instant draw",
      "analyse: short probable on VDD_MAIN",
      "suggest: inject 1V · locate hot capacitor",
    ],
  },
  store: {
    kicker: "Bakkou Tech Store",
    title: "Matériel de laboratoire professionnel",
    lead: "Les mêmes outils que ceux utilisés en formation. Commandez directement via WhatsApp.",
    filters: { all: "Tout", solder: "Soudure", optics: "Optique", power: "Alimentation", cctv: "CCTV" },
    price: "Prix sur demande",
    add: "Ajouter",
    added: "Ajouté",
    orderOne: "Commander via WhatsApp",
    cart: "Votre commande",
    cartEmpty: "Aucun produit ajouté pour l'instant.",
    checkout: "Envoyer la commande via WhatsApp",
    qty: "Quantité",
    remove: "Retirer",
    msgIntro: "Bonjour, je souhaite commander les produits suivants sur Bakkou Tech Store :",
    msgOne: "Bonjour, je souhaite connaître le prix et la disponibilité de :",
    msgEnd: "Merci.",
  },
  contact: {
    kicker: "Contact",
    title: "Rendez-nous visite à Rabat",
    address: "Adresse",
    call: "Appeler",
    whatsapp: "WhatsApp",
    map: "Ouvrir dans Google Maps",
    partner: "Partenaire institutionnel",
    rights: "Tous droits réservés",
    registerMsg: "Bonjour, je souhaite m'inscrire à la formation :",
  },
  diag: {
    back: "Retour à l'accueil",
    title: "Interface de diagnostic Bakkou AI",
    lead: "Simulation pédagogique du raisonnement de diagnostic. Résultats indicatifs, toujours à confirmer par la mesure.",
    device: "Appareil",
    devices: { phone: "Smartphone", laptop: "PC portable", cctv: "Système CCTV" },
    symptoms: "Symptômes",
    current: "Courant mesuré (A)",
    voltage: "Tension (V)",
    currentHint: "Lecture sur alimentation DC à l'appui du bouton power",
    brand: "Marque",
    power: "Alimentation",
    cable: "Longueur de câble (m)",
    notes: "Notes complémentaires",
    notesPh: "Ex. : tombé dans l'eau, chauffe près du connecteur…",
    run: "Lancer l'analyse",
    running: "Analyse en cours…",
    reset: "Nouvelle analyse",
    terminal: "Sortie du moteur",
    idle: "En attente de saisie…",
    result: "Diagnostic",
    confidence: "Probabilité",
    suspects: "Composants suspects",
    steps: "Étapes de vérification",
    tools: "Outillage conseillé",
    order: "Commander",
    needSymptom: "Choisissez au moins un symptôme.",
    error: "Impossible de joindre le moteur. Réessayez.",
  },
  fallback: "Mode 2D activé pour préserver les performances sur cet appareil.",
};

const DICTS: Record<Lang, Dict> = { ar, fr };

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dict;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = new URLSearchParams(window.location.search).get("lang") ?? localStorage.getItem("bk-lang");
    } catch {}
    if (stored === "fr" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("bk-lang", l);
    } catch {}
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", t: DICTS[lang], setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
