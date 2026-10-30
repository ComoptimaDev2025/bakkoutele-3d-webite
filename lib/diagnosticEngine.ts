import type { L10n, Lang } from "./data";
import { CCTV_BRANDS } from "./data";

/**
 * Rule-based diagnostic simulation. It reproduces the reasoning a bench
 * technician follows (symptom + DC current draw → most likely fault path).
 * It is a teaching aid, not a substitute for measurement.
 */

export type DeviceKind = "phone" | "laptop" | "cctv";

export const SYMPTOMS: Record<DeviceKind, { id: string; label: L10n }[]> = {
  phone: [
    { id: "no_power", label: { ar: "لا يشتغل", fr: "Ne s'allume pas" } },
    { id: "boot_loop", label: { ar: "إعادة تشغيل متكررة", fr: "Redémarre en boucle" } },
    { id: "no_charge", label: { ar: "لا يشحن", fr: "Ne charge pas" } },
    { id: "no_display", label: { ar: "لا صورة على الشاشة", fr: "Pas d'image" } },
    { id: "no_network", label: { ar: "لا توجد شبكة", fr: "Pas de réseau" } },
    { id: "overheating", label: { ar: "ارتفاع الحرارة", fr: "Surchauffe" } },
    { id: "liquid", label: { ar: "تعرض للماء", fr: "Oxydation / liquide" } },
  ],
  laptop: [
    { id: "no_power", label: { ar: "لا يشتغل", fr: "Ne s'allume pas" } },
    { id: "no_display", label: { ar: "يشتغل بدون صورة", fr: "S'allume sans image" } },
    { id: "boot_loop", label: { ar: "يعيد التشغيل", fr: "Redémarre seul" } },
    { id: "no_charge", label: { ar: "لا يشحن البطارية", fr: "Ne charge pas la batterie" } },
    { id: "overheating", label: { ar: "ارتفاع الحرارة", fr: "Surchauffe" } },
    { id: "liquid", label: { ar: "انسكاب سائل", fr: "Liquide renversé" } },
  ],
  cctv: [
    { id: "not_found", label: { ar: "الكاميرا غير مكتشفة", fr: "Caméra introuvable" } },
    { id: "no_video", label: { ar: "لا يوجد فيديو", fr: "Pas de vidéo" } },
    { id: "night_ir", label: { ar: "الرؤية الليلية لا تعمل", fr: "Vision nocturne HS" } },
    { id: "no_record", label: { ar: "لا يسجل", fr: "N'enregistre pas" } },
    { id: "remote", label: { ar: "لا وصول عن بعد", fr: "Pas d'accès distant" } },
  ],
};

export interface DiagInput {
  device: DeviceKind;
  symptoms: string[];
  current?: number;
  voltage?: number;
  brand?: string;
  power?: "poe" | "12v";
  cable?: number;
  notes?: string;
  lang: Lang;
}

export interface DiagResult {
  title: string;
  confidence: number;
  suspects: string[];
  steps: string[];
  products: string[];
}

interface Candidate {
  key: string;
  score: number;
  title: L10n;
  suspects: L10n[];
  steps: L10n[];
  products: string[];
}

const L = (ar: string, fr: string): L10n => ({ ar, fr });

type Band = "none" | "zero" | "low" | "normal" | "short";

function band(device: DeviceKind, current?: number): Band {
  if (current === undefined || Number.isNaN(current)) return "none";
  if (device === "laptop") {
    if (current < 0.01) return "zero";
    if (current < 0.12) return "low";
    if (current < 2) return "normal";
    return "short";
  }
  if (current < 0.005) return "zero";
  if (current < 0.15) return "low";
  if (current < 0.8) return "normal";
  return "short";
}

function phoneRules(s: Set<string>, b: Band): Candidate[] {
  const out: Candidate[] = [];
  if (b === "short" || (s.has("no_power") && s.has("overheating"))) {
    out.push({
      key: "short_vdd_main",
      score: b === "short" && s.has("overheating") ? 0.9 : 0.82,
      title: L("شورت على خط التغذية الرئيسي VDD_MAIN", "Court-circuit sur la ligne VDD_MAIN"),
      suspects: [L("مكثف مثقوب على VDD_MAIN", "Condensateur en court sur VDD_MAIN"), L("دارة الطاقة PMIC", "PMIC"), L("دارة الشحن", "Circuit de charge")],
      steps: [
        L("افصل البطارية وقِس المقاومة إلى الأرض على VDD_MAIN.", "Débranchez la batterie et mesurez la résistance à la masse sur VDD_MAIN."),
        L("احقن 1V بتيار محدود 3A وحدد المكوّن الساخن بالروزين أو الكاميرا الحرارية.", "Injectez 1 V limité à 3 A et localisez le composant chaud (colophane / caméra thermique)."),
        L("انزع المكثف المعطوب وأعد القياس.", "Retirez le condensateur défectueux puis re-mesurez."),
        L("إن كان الشورت تحت PMIC أو المعالج: سخّن اللوحة مسبقاً ثم أعد اللحام أو الاستبدال.", "Si le court est sous le PMIC/CPU : préchauffez la carte puis ressoudez ou remplacez."),
      ],
      products: ["dc-supply", "hot-air-2in1", "trinocular-microscope"],
    });
  }
  if (s.has("no_power") && b === "zero") {
    out.push({
      key: "pmic_no_start",
      score: 0.74,
      title: L("دارة الطاقة لا تنطلق (لا استهلاك عند التشغيل)", "Le PMIC ne démarre pas (aucune consommation)"),
      suspects: [L("فليكس زر التشغيل", "Nappe du bouton power"), L("موصل البطارية", "Connecteur batterie"), L("دارة الطاقة PMIC", "PMIC")],
      steps: [
        L("تحقق من جهد البطارية ونظافة أطراف الموصل.", "Vérifiez la tension batterie et l'état du connecteur."),
        L("قِس خط زر التشغيل PWR_KEY (حوالي 1.8V في وضع الراحة).", "Mesurez la ligne PWR_KEY (≈ 1,8 V au repos)."),
        L("تأكد من وجود الخطوط الدائمة قبل التشغيل.", "Contrôlez la présence des tensions permanentes avant démarrage."),
        L("إذا كانت المدخلات سليمة: أعد كُرات PMIC أو استبدله.", "Si les entrées sont bonnes : reballing ou remplacement du PMIC."),
      ],
      products: ["dc-supply", "t12-station", "preheater"],
    });
  }
  if ((s.has("no_power") || s.has("boot_loop") || s.has("no_display")) && b === "low") {
    out.push({
      key: "cpu_no_boot",
      score: 0.7,
      title: L("الطاقة تنطلق لكن المعالج لا يقلع", "Alimentation OK mais le CPU ne boote pas"),
      suspects: [L("الكريستال 24MHz", "Quartz 24 MHz"), L("لحام المعالج CPU", "Soudures du CPU"), L("ذاكرة NAND", "Mémoire NAND")],
      steps: [
        L("قِس إشارة الكريستال وخطوط تغذية المعالج.", "Mesurez l'oscillation du quartz et les rails du CPU."),
        L("سخّن اللوحة مسبقاً ثم جرّب إعادة صهر لحام المعالج.", "Préchauffez la carte et testez un reflow du CPU."),
        L("اقرأ الذاكرة NAND بالمبرمج لتأكيد سلامتها.", "Lisez la NAND au programmateur pour la valider."),
      ],
      products: ["preheater", "hot-air-2in1", "trinocular-microscope"],
    });
  }
  if (s.has("boot_loop") && (b === "normal" || b === "none")) {
    out.push({
      key: "firmware_nand",
      score: 0.68,
      title: L("خلل في النظام أو في ذاكرة NAND", "Système corrompu ou défaut NAND"),
      suspects: [L("نظام التشغيل", "Firmware"), L("ذاكرة NAND", "Mémoire NAND")],
      steps: [
        L("انسخ البيانات إن أمكن قبل أي تدخل.", "Sauvegardez les données si possible avant toute intervention."),
        L("أعد فلاش النظام الرسمي عبر وضع التحميل.", "Reflashez le firmware officiel en mode download."),
        L("إن ظهر خطأ في الفلاش: افحص NAND وخطوط تغذيتها.", "Si le flash échoue : contrôlez la NAND et ses alimentations."),
      ],
      products: ["toolkit", "dc-supply"],
    });
  }
  if (s.has("no_charge")) {
    out.push({
      key: "charge_path",
      score: s.has("liquid") ? 0.8 : 0.72,
      title: L("عطل في مسار الشحن", "Défaut sur le chemin de charge"),
      suspects: [L("منفذ الشحن", "Connecteur de charge"), L("دارة الشحن", "Circuit de charge"), L("دارة الحماية OVP", "Protection OVP")],
      steps: [
        L("نظّف أو استبدل منفذ الشحن واختبر بكابل سليم.", "Nettoyez/remplacez le connecteur et testez avec un câble sain."),
        L("قِس VBUS عند المنفذ وبعد دارة الحماية.", "Mesurez VBUS au connecteur puis après l'OVP."),
        L("راقب التيار بأمبيرمتر USB؛ إن بقي صفراً فاستبدل دارة الشحن.", "Surveillez au testeur USB ; à 0 A, remplacez le circuit de charge."),
      ],
      products: ["hot-air-2in1", "t12-station", "trinocular-microscope"],
    });
  }
  if (s.has("no_display") && (b === "normal" || b === "none")) {
    out.push({
      key: "backlight",
      score: 0.66,
      title: L("عطل في الشاشة أو دارة الإضاءة الخلفية", "Écran ou circuit de rétroéclairage"),
      suspects: [L("موصل الشاشة FPC", "Connecteur FPC"), L("دارة الإضاءة الخلفية (ملف، دايود، فلتر)", "Rétroéclairage (bobine, diode, filtre)"), L("وحدة الشاشة", "Module afficheur")],
      steps: [
        L("جرّب شاشة سليمة لعزل العطل.", "Testez avec un écran sain pour isoler la panne."),
        L("افحص أطراف موصل الشاشة تحت المجهر.", "Inspectez les broches du FPC au microscope."),
        L("قِس جهد الإضاءة الخلفية واستبدل المكوّن المعطوب.", "Mesurez la tension de rétroéclairage et remplacez le composant HS."),
      ],
      products: ["trinocular-microscope", "t12-station", "toolkit"],
    });
  }
  if (s.has("no_network")) {
    out.push({
      key: "rf",
      score: 0.6,
      title: L("عطل في دارة الشبكة RF / Baseband", "Défaut RF / baseband"),
      suspects: [L("فليكس الهوائي", "Nappe antenne"), L("مضخم الإشارة PA", "Amplificateur RF (PA)"), L("دارة Baseband", "Baseband")],
      steps: [
        L("تحقق من ظهور IMEI ونسخة Baseband في الإعدادات.", "Vérifiez l'IMEI et la version baseband dans les réglages."),
        L("أعد ضبط الشبكة ثم أعد الفلاش.", "Réinitialisez le réseau puis reflashez."),
        L("افحص موصلات الهوائي وأعد صهر دارات RF.", "Contrôlez les connecteurs antenne et faites un reflow RF."),
      ],
      products: ["trinocular-microscope", "hot-air-2in1"],
    });
  }
  return out;
}

function laptopRules(s: Set<string>, b: Band): Candidate[] {
  const out: Candidate[] = [];
  if (b === "short" || (s.has("no_power") && s.has("overheating"))) {
    out.push({
      key: "short_rail",
      score: 0.8,
      title: L("شورت على خط 19V أو خط المعالج VCORE", "Court-circuit sur le 19 V ou le VCORE"),
      suspects: [L("مكثفات VCORE / GPU", "Condensateurs VCORE / GPU"), L("ترانزستورات MOSFET", "MOSFET d'alimentation")],
      steps: [
        L("قِس المقاومة إلى الأرض على خطوط 19V و VCORE.", "Mesurez la résistance à la masse sur le 19 V et le VCORE."),
        L("احقن جهداً منخفضاً وحدد المكون الساخن.", "Injectez une basse tension et repérez le composant chaud."),
        L("استبدل المكثف أو MOSFET المعطوب.", "Remplacez le condensateur ou le MOSFET HS."),
      ],
      products: ["dc-supply", "hot-air-2in1", "preheater"],
    });
  }
  if (s.has("no_power") && b === "zero") {
    out.push({
      key: "input_stage",
      score: 0.72,
      title: L("لا يصل التيار: مرحلة الإدخال أو الحماية", "Aucune consommation : étage d'entrée / protection"),
      suspects: [L("الشاحن ومنفذ DC", "Chargeur et jack DC"), L("ترانزستورات الحماية", "MOSFET de protection"), L("دارة الشحن والـ EC", "Contrôleur de charge et EC")],
      steps: [
        L("تحقق من جهد الشاحن وخط التعريف ID.", "Vérifiez la tension et la ligne ID du chargeur."),
        L("قِس الجهد بعد ترانزستورات الحماية.", "Mesurez la tension après les MOSFET de protection."),
        L("تأكد من الخطوط الدائمة 3V و 5V وتغذية EC.", "Contrôlez les rails permanents 3 V / 5 V et l'alimentation EC."),
      ],
      products: ["dc-supply", "t12-station"],
    });
  }
  if ((s.has("no_power") || s.has("no_display") || s.has("boot_loop")) && b === "low") {
    out.push({
      key: "bios_ec",
      score: 0.68,
      title: L("الوضع الاحتياطي سليم والجهاز لا يقلع: BIOS أو RAM", "Veille OK mais pas de démarrage : BIOS / RAM"),
      suspects: [L("ذاكرة RAM", "Barrettes RAM"), L("شريحة BIOS", "Puce BIOS"), L("إشارات Power-Good", "Signaux Power-Good")],
      steps: [
        L("أعد تركيب RAM وجرّب شريحة واحدة.", "Réinstallez la RAM et testez une seule barrette."),
        L("امسح CMOS ثم أعد برمجة BIOS بالمبرمج.", "Effacez le CMOS puis reprogrammez le BIOS."),
        L("تتبع إشارات Power-Good لتحديد الخط الناقص.", "Suivez les Power-Good pour trouver le rail manquant."),
      ],
      products: ["toolkit", "dc-supply"],
    });
  }
  if (s.has("no_display") && (b === "normal" || b === "none")) {
    out.push({
      key: "display_gpu",
      score: 0.66,
      title: L("عطل في الشاشة أو كابل eDP أو المعالج الرسومي", "Écran, nappe eDP ou GPU"),
      suspects: [L("كابل eDP / LVDS", "Nappe eDP / LVDS"), L("فيوز الإضاءة الخلفية", "Fusible de rétroéclairage"), L("المعالج الرسومي GPU", "GPU")],
      steps: [
        L("اختبر بشاشة خارجية لعزل العطل.", "Testez sur écran externe pour isoler la panne."),
        L("افحص الكابل وفيوز الإضاءة.", "Contrôlez la nappe et le fusible de rétroéclairage."),
        L("إن لم تظهر صورة خارجية: افحص تغذية GPU.", "Sans image externe : contrôlez l'alimentation GPU."),
      ],
      products: ["trinocular-microscope", "hot-air-2in1"],
    });
  }
  if (s.has("no_charge")) {
    out.push({
      key: "charger_ic",
      score: 0.7,
      title: L("عطل في دارة شحن البطارية", "Défaut du contrôleur de charge"),
      suspects: [L("البطارية", "Batterie"), L("دارة الشحن", "Contrôleur de charge")],
      steps: [
        L("اختبر ببطارية سليمة.", "Testez avec une batterie saine."),
        L("قِس جهد الشحن عند موصل البطارية.", "Mesurez la tension de charge au connecteur batterie."),
      ],
      products: ["dc-supply", "t12-station"],
    });
  }
  if (s.has("overheating") && !out.length) {
    out.push({
      key: "thermal",
      score: 0.62,
      title: L("خلل في التبريد", "Problème de refroidissement"),
      suspects: [L("المروحة", "Ventilateur"), L("المعجون الحراري", "Pâte thermique")],
      steps: [
        L("نظّف المروحة والمشتت الحراري.", "Nettoyez ventilateur et radiateur."),
        L("جدّد المعجون الحراري وتحقق من دوران المروحة.", "Renouvelez la pâte thermique et vérifiez la rotation du ventilateur."),
      ],
      products: ["toolkit"],
    });
  }
  return out;
}

function cctvRules(s: Set<string>, input: DiagInput): Candidate[] {
  const out: Candidate[] = [];
  const brand = CCTV_BRANDS.find((b) => b.id === input.brand);
  const cable = input.cable ?? 0;
  const tool = brand?.tools[0] ?? "SADP / ConfigTool";

  if ((s.has("not_found") || s.has("no_video")) && cable > 100) {
    out.push({
      key: "ethernet_100m",
      score: 0.86,
      title: L("طول كابل الشبكة يتجاوز 100 متر", "Câble Ethernet au-delà de 100 m"),
      suspects: [L("طول الكابل", "Longueur de câble"), L("ضعف تغذية PoE على المسافة", "Chute PoE sur la distance")],
      steps: [
        L("حد Ethernet النحاسي هو 100 م: أضف موسّع PoE أو سويتش وسيط.", "La limite Ethernet cuivre est 100 m : ajoutez un extendeur PoE ou un switch."),
        L("للمسافات الطويلة استعمل الألياف البصرية مع محولات.", "Pour les longues distances, passez en fibre avec convertisseurs."),
      ],
      products: ["cctv-kit-4"],
    });
  }
  if (s.has("not_found")) {
    out.push({
      key: "ip_subnet",
      score: 0.74,
      title: L("عنوان IP خارج الشبكة أو متعارض", "Adresse IP hors sous-réseau ou en conflit"),
      suspects: [
        L(`العنوان الافتراضي ${brand?.defaultIp ?? ""}`.trim(), `IP par défaut ${brand?.defaultIp ?? ""}`.trim()),
        L("تعارض عناوين IP", "Conflit d'adresses IP"),
        L("كابل أو منفذ PoE", "Câble ou port PoE"),
      ],
      steps: [
        L(`ابحث عن الكاميرا بأداة ${tool} وفعّلها إن كانت غير مفعّلة.`, `Recherchez la caméra avec ${tool} et activez-la si besoin.`),
        L("ضع الكاميرا في نفس الشبكة الفرعية للمسجل أو الراوتر.", "Placez la caméra dans le même sous-réseau que le NVR/routeur."),
        L("تحقق من ضوء الربط في منفذ PoE واختبر الكابل.", "Vérifiez la LED de lien du port PoE et testez le câble."),
      ],
      products: ["cctv-kit-4", "toolkit"],
    });
  }
  if (s.has("night_ir")) {
    const longDc = input.power === "12v" && cable > 30;
    out.push({
      key: "ir",
      score: longDc ? 0.78 : 0.66,
      title: longDc
        ? L("هبوط الجهد على خط 12V يمنع تشغيل الأشعة تحت الحمراء", "Chute de tension 12 V empêchant l'IR")
        : L("مشكل في وضع الليل أو فلتر IR-Cut", "Mode nuit ou filtre IR-Cut"),
      suspects: [L("هبوط الجهد", "Chute de tension"), L("فلتر IR-Cut", "Filtre IR-Cut"), L("إعداد Day/Night", "Réglage jour/nuit")],
      steps: [
        L("قِس الجهد عند الكاميرا ليلاً (يجب أن يبقى قرب 12V).", "Mesurez la tension côté caméra la nuit (≈ 12 V attendus)."),
        L("استعمل كابل أغلظ أو مزوداً أقرب، أو انتقل إلى PoE.", "Câble plus épais, alimentation plus proche, ou passage en PoE."),
        L("اضبط وضع Day/Night على Auto وتحقق من صوت فلتر IR-Cut.", "Réglez Jour/Nuit sur Auto et écoutez le clic du filtre IR-Cut."),
      ],
      products: ["dc-supply", "cctv-kit-4"],
    });
  }
  if (s.has("no_record")) {
    out.push({
      key: "hdd",
      score: 0.78,
      title: L("القرص غير مهيأ أو جدول التسجيل غير مفعّل", "Disque non initialisé ou planning d'enregistrement absent"),
      suspects: [L("حالة القرص HDD", "État du disque"), L("جدول التسجيل", "Planning d'enregistrement")],
      steps: [
        L("افتح إدارة الأقراص في المسجل: يجب أن تكون الحالة Normal.", "Ouvrez la gestion disque du NVR : l'état doit être « Normal »."),
        L("هيّئ القرص (Initialize) ثم فعّل التسجيل المستمر أو بالحركة.", "Initialisez le disque puis activez l'enregistrement continu ou sur détection."),
        L("افحص S.M.A.R.T واستبدل القرص إن ظهرت أخطاء.", "Contrôlez le S.M.A.R.T et remplacez le disque en cas d'erreurs."),
      ],
      products: ["cctv-kit-4"],
    });
  }
  if (s.has("remote")) {
    const app = brand ? brand.tools[brand.tools.length - 1] : "P2P";
    out.push({
      key: "p2p",
      score: 0.7,
      title: L("الوصول عن بعد غير مفعّل أو إعداد الشبكة ناقص", "Accès distant désactivé ou réseau incomplet"),
      suspects: [L("خدمة P2P / السحابة", "Service P2P / cloud"), L("البوابة و DNS", "Passerelle et DNS")],
      steps: [
        L(`فعّل خدمة السحابة وأضف الجهاز في تطبيق ${app}.`, `Activez le service cloud et ajoutez l'appareil dans ${app}.`),
        L("تحقق من البوابة و DNS في إعدادات شبكة المسجل.", "Vérifiez la passerelle et le DNS du NVR."),
        L("تأكد من أن حالة الاتصال بالسحابة Online.", "Confirmez que l'état cloud est « Online »."),
      ],
      products: ["wifi-dome", "cctv-kit-4"],
    });
  }
  if (s.has("no_video") && !out.some((c) => c.key === "ethernet_100m")) {
    out.push({
      key: "stream",
      score: 0.62,
      title: L("إعداد القناة أو ميزانية PoE أو الترميز", "Canal, budget PoE ou codec"),
      suspects: [L("ميزانية طاقة PoE", "Budget PoE"), L("ترميز H.265", "Codec H.265"), L("ربط القناة في المسجل", "Affectation du canal")],
      steps: [
        L("تحقق أن مجموع استهلاك الكاميرات أقل من ميزانية PoE للمسجل.", "Vérifiez que la consommation totale reste sous le budget PoE."),
        L("جرّب الترميز H.264 للتوافق مع المشغّل.", "Testez le codec H.264 pour la compatibilité du lecteur."),
        L("أعد إضافة الكاميرا للقناة بكلمة المرور الصحيحة.", "Ré-ajoutez la caméra au canal avec le bon mot de passe."),
      ],
      products: ["cctv-kit-4", "wifi-dome"],
    });
  }
  return out;
}

const LIQUID_WORDS = /(ماء|سائل|مبلل|eau|liquide|mouill|humid|water)/i;

export function runDiagnosis(input: DiagInput): { log: string[]; result: DiagResult } {
  const s = new Set(input.symptoms);
  if (input.notes && LIQUID_WORDS.test(input.notes) && input.device !== "cctv") s.add("liquid");
  const b = input.device === "cctv" ? "none" : band(input.device, input.current);

  let cands =
    input.device === "phone" ? phoneRules(s, b) : input.device === "laptop" ? laptopRules(s, b) : cctvRules(s, input);

  if (s.has("liquid") && input.device !== "cctv") {
    cands.push({
      key: "corrosion",
      score: 0.76,
      title: L("أكسدة بسبب السائل", "Oxydation due au liquide"),
      suspects: [L("الموصلات والفلاتر المتأكسدة", "Connecteurs et filtres oxydés")],
      steps: [
        L("افصل البطارية فوراً.", "Débranchez immédiatement la batterie."),
        L("نظّف اللوحة بالكحول الإيزوبروبيلي أو بالموجات فوق الصوتية.", "Nettoyez la carte à l'IPA ou aux ultrasons."),
        L("افحص تحت المجهر وقِس الخطوط بحثاً عن الشورت.", "Inspectez au microscope et mesurez les lignes à la recherche de courts."),
      ],
      products: ["trinocular-microscope", "toolkit", "dc-supply"],
    });
  }

  cands = cands.sort((a, b2) => b2.score - a.score);
  const lang = input.lang;

  const log: string[] = [
    `[boot] bakkou-ai diagnostic core v2.6 · mode=simulation`,
    `[input] device=${input.device} symptoms=[${[...s].join(", ") || "∅"}]`,
  ];
  if (input.device !== "cctv" && input.current !== undefined) {
    log.push(`[probe] dc_supply=${(input.voltage ?? (input.device === "laptop" ? 19.5 : 4.2)).toFixed(2)}V draw=${input.current.toFixed(3)}A → band=${b}`);
  }
  if (input.device === "cctv") {
    log.push(`[probe] brand=${input.brand ?? "unknown"} power=${input.power ?? "?"} cable=${input.cable ?? "?"}m`);
  }
  log.push(`[rules] evaluating ${cands.length} hypothesis${cands.length === 1 ? "" : "es"}…`);
  cands.slice(0, 4).forEach((c) => log.push(`  ├─ ${c.key.padEnd(16, " ")} p=${c.score.toFixed(2)}`));

  const top = cands[0];
  if (!top) {
    log.push("[warn] not enough signal — request DC current reading");
    return {
      log,
      result: {
        title: lang === "ar" ? "بيانات غير كافية: أضف قراءة التيار أو عرضاً آخر" : "Données insuffisantes : ajoutez une mesure de courant ou un symptôme",
        confidence: 0.35,
        suspects: [],
        steps: [
          lang === "ar" ? "صِل الجهاز بمزوّد DC واقرأ التيار عند الضغط على زر التشغيل." : "Branchez l'appareil sur alimentation DC et lisez le courant à l'appui sur power.",
        ],
        products: ["dc-supply"],
      },
    };
  }

  log.push(`[match] ${top.key} selected · confidence ${(top.score * 100).toFixed(0)}%`);
  log.push(`[plan] ${top.steps.length} verification steps generated`);
  log.push("[done] ✓ report ready");

  const second = cands[1];
  const suspects = [...top.suspects, ...(second ? second.suspects.slice(0, 1) : [])].map((x) => x[lang]);
  const products = [...new Set([...top.products, ...(second?.products ?? [])])].slice(0, 3);

  return {
    log,
    result: {
      title: top.title[lang],
      confidence: top.score,
      suspects: [...new Set(suspects)],
      steps: top.steps.map((x) => x[lang]),
      products,
    },
  };
}
