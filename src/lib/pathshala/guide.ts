import type { Lang } from "./types";

export interface GuideSection {
  id: string;
  title: { en: string; bn: string };
  body: { en: string[]; bn: string[] };
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "what",
    title: { en: "What Pathshala is", bn: "পাঠশালা কী" },
    body: {
      bn: [
        "পাঠশালা আপনার কোচিংয়ের খাতা — শিক্ষার্থী, ফি, রুটিন, হাজিরা, শিক্ষকের বেতন, প্রশ্নপত্র। কাগজের রেজিস্টারের ডিজিটাল রূপ।",
        "সব তথ্য এই ফোনেই থাকে। সার্ভারে পাঠায় না। ইন্টারনেট না থাকলেও খোলা যাবে — যদি আগে একবার ক্রোমে খুলে হোম স্ক্রিনে বসিয়ে থাকেন।",
        "এখন যে নাম দেখছেন «অ্যাডভান্স এডুকেয়ার» — সেটা শুধু নমুনা। আপনার কোচিং আলাদা। আরও → কোচিং সেটআপ থেকে নিজের নাম দিন।",
        "কোনো কিছু বুঝতে না পারলে এই চ্যাটে সরাসরি লিখুন। মালিক নিজে জিজ্ঞেস করলেই হবে।",
      ],
      en: [
        "Pathshala is the coaching khata: students, fees, routine, attendance, teacher pay, question papers.",
        "Everything stays on this phone. Nothing is sent to a server. After you add it to the home screen it works offline.",
        "Advance Educare is sample data only. Start your own centre from More → Set up coaching.",
        "If something is unclear, ask in this same Grok chat.",
      ],
    },
  },
  {
    id: "week",
    title: { en: "The first week — only these", bn: "প্রথম সপ্তাহ — শুধু এগুলো করুন" },
    body: {
      bn: [
        "সব মেনু একসাথে শেখার দরকার নেই। প্রথম সপ্তাহে চারটা কাজই যথেষ্ট।",
        "১) আরও → সেটিংস → উপরে বাংলা চাপুন।",
        "২) আরও → কোচিং সেটআপ → «আমার কোচিং শুরু» — নাম, ঠিকানা, ফোন দিন। অথবা ডেমো রেখে শুধু নাম বদলান।",
        "৩) আরও → সেটিংস → রুম ও পিরিয়ড — আপনার রুম আর ব্যাচ যোগ করুন। শিক্ষক যোগ: আরও → শিক্ষক।",
        "৪) নিচের শিক্ষার্থী → ভর্তি — আসল ছেলেমেয়েদের নাম দিন। তারপর ফি → «মাসের ফি তৈরি».",
        "রুটিন, প্রশ্নপত্র, পরীক্ষা পরে। আগে খাতাটা চালু হোক।",
      ],
      en: [
        "Do not learn every menu at once. First week: language, setup, rooms/batches/teachers, then real students and month fees.",
        "Routine, papers and exams can wait until the khata is running.",
      ],
    },
  },
  {
    id: "menu",
    title: { en: "The five buttons at the bottom", bn: "নিচে পাঁচটা বাটন" },
    body: {
      bn: [
        "আজ — সকালে খুলবেন। আজকের আদায়, বকেয়া, ক্লাস, কাকে কল করতে হবে।",
        "শিক্ষার্থী — তালিকা, ভর্তি, প্রোফাইল।",
        "ফি — বকেয়া, আদায়, রসিদ।",
        "রুটিন — সাপ্তাহিক ক্লাস। তৈরি করুন চাপলে অ্যাপ নিজে বসায়, শিক্ষক/রুম দুই জায়গায় একসময়ে বসবে না।",
        "আরও — শিক্ষক, হিসাব, প্রশ্নপত্র, হাজিরা, সেটিংস, এই গাইড।",
        "উপরে খোঁজার ঘণ্টা/সার্চ — নাম, কোড বা রসিদ লিখলেই খুঁজে পাবেন।",
      ],
      en: [
        "Today, Students, Fees, Routine, More. Search at the top finds a name, code or receipt.",
      ],
    },
  },
  {
    id: "today",
    title: { en: "Today", bn: "আজ — সকালের ডেস্ক" },
    body: {
      bn: [
        "চারটা সংখ্যা: আজকের আদায়, মোট বকেয়া, হাতে নগদ, আজকের ক্লাস। টাকা লুকাতে সেটিংসে প্রাইভেসি মোড চালু করুন।",
        "আজকের কাজ — বকেয়া, অনুপস্থিত, প্রতিশ্রুতি। কল / আদায় চাপুন।",
        "নিচে আজকের ক্লাস। হাজিরা চাপলে সেই ক্লাসের হাজিরা খুলবে।",
        "শুক্রবার নিয়মিত ক্লাস থাকে না, অফিস খোলা। শনিবার পরীক্ষা/প্র্যাকটিস।",
      ],
      en: [
        "Four numbers, an action list, and today's classes. Friday is office-only. Saturday is exam/practice.",
      ],
    },
  },
  {
    id: "students",
    title: { en: "Students — admit and find", bn: "শিক্ষার্থী — ভর্তি ও খোঁজা" },
    body: {
      bn: [
        "শিক্ষার্থী → ভর্তি। নাম, মোবাইল, অভিভাবক, শ্রেণি, ব্যাচ, মাসিক ফি দিন। সেভ হলে আইডি কোড আপনা থেকে হবে।",
        "তালিকায় নাম চাপলে প্রোফাইল: ফি ইতিহাস, নোট, ব্যাচ বদল, ছেড়েছে চিহ্নিত, ভর্তি ফরম প্রিন্ট।",
        "একই নাম থাকলে সতর্ক করবে — তবুও ভর্তি করা যাবে।",
      ],
      en: [
        "Students → Admit. Open a name for profile, fee history, notes, transfer, drop, admission form.",
      ],
    },
  },
  {
    id: "fees",
    title: { en: "Fees", bn: "ফি — আদায় ও রসিদ" },
    body: {
      bn: [
        "প্রতি মাসের শুরুতে ফি → «মাসের ফি তৈরি»। না চাপলে নতুন মাসের বকেয়া আসবে না।",
        "বকেয়া তালিকা → আদায়। পরিমাণ, মাধ্যম (নগদ/বিকাশ/নগদ/ব্যাংক)। পুরনো বকেয়া আগে কাটে।",
        "রসিদ থেকে আবার প্রিন্ট। ভুল হলে রসিদ বাতিল — মুছে ফেলা নয়, খাতায় দাগ থাকে।",
        "অভিভাবক কল বা হোয়াটসঅ্যাপ বকেয়া তালিকা থেকেই।",
      ],
      en: [
        "Each month tap Generate month, then Collect on a due. Oldest dues first. Void a wrong receipt — do not delete history.",
      ],
    },
  },
  {
    id: "routine",
    title: { en: "Routine", bn: "রুটিন — কঠিন অংশ, সহজ রাস্তা" },
    body: {
      bn: [
        "তিনটা ট্যাব: আজ / মাস্টার রুটিন / সাপ্তাহিক চাহিদা।",
        "চাহিদায় প্রতি ব্যাচে সপ্তাহে কয়টা ক্লাস, কোন শিক্ষক — তারপর «তৈরি করুন»। অ্যাপ শিক্ষক ও রুম দুই জায়গায় একসময়ে বসাবে না।",
        "যা বসানো যায়নি তা বলে দেবে — জোর করে ভুল রুটিন দেবে না।",
        "রুম ক্লাসের জন্য আটকানো নয়। দুই ছোট ব্যাচে একই শেয়ার নাম দিলে এক রুমে বসতে পারে। খালি রাখলে নিজস্ব রুম।",
        "একটা ক্লাস চাপলে: সেই দিনের শিক্ষক বদল, পিন, আজকের তারিখ বাতিল।",
        "প্রিন্ট চাপলে পর্দায় প্রিভিউ — তারপর প্রিন্ট বা HTML নামান।",
      ],
      en: [
        "Set weekly need, tap Generate. Rooms are a pool — same share name may sit together. Tap a class to replace/pin/cancel. Print opens an in-app preview.",
      ],
    },
  },
  {
    id: "attendance",
    title: { en: "Student attendance", bn: "শিক্ষার্থীর হাজিরা" },
    body: {
      bn: [
        "আরও → হাজিরা, অথবা আজ থেকে সরাসরি। তারিখ বাছুন, ক্লাস বাছুন।",
        "সবাই উপস্থিত ধরে নিন। শুধু অনুপস্থিত/লেট চাপুন। ক্লাস হয়নি হলে সেটা মার্ক করুন।",
        "তিন দিন অনুপস্থিত থাকলে আজকের কাজে অভিভাবক কল উঠবে।",
      ],
      en: [
        "More → Attendance. Assume all present, tap exceptions. Three-day absence goes to Today's action list.",
      ],
    },
  },
  {
    id: "teachers",
    title: { en: "Teachers and pay", bn: "শিক্ষক — হাজিরা ও বেতন" },
    body: {
      bn: [
        "আরও → শিক্ষক। নিচে নাম + ধরন দিয়ে যোগ: ক্লাস শিক্ষক (ক্লাসপ্রতি), গাইড (ঘণ্টাপ্রতি), মাসিক।",
        "শিক্ষক হাজিরা ট্যাব: ক্লাস শিক্ষক — প্রতি ক্লাসে উপস্থিত/অনুপস্থিত। গাইড — ঘণ্টা। মাসিক — দিনের উপস্থিতি।",
        "বেতন ট্যাবে হিসাব দেখাবে। «শিক্ষককে দিন» চাপলে খরচ হিসাবে কাটবে।",
      ],
      en: [
        "Class / guide / monthly types. Attendance tab feeds the pay calculation. Pay teacher posts the expense.",
      ],
    },
  },
  {
    id: "finance",
    title: { en: "Accounts", bn: "হিসাব — লাভ-ক্ষতি" },
    body: {
      bn: [
        "আরও → হিসাব। মাস বাছুন। ফি আদায়, অন্য আয়, খরচ, শিক্ষক বেতন, নিট (লাভ বা ক্ষতি), নগদ/বিকাশ/নগদ/ব্যাংক।",
        "খরচ যোগ: ভাড়া, বিদ্যুৎ ইত্যাদি। «Other» হলে নিচে কী খরচ সেটা লিখুন। নোট আলাদা।",
        "অন্য আয়: বই বিক্রি, ফর্ম ফি ইত্যাদি যা মাসিক টিউশন নয়।",
      ],
      en: [
        "Month picker, fee income, other income, expenses, teacher pay, net, four accounts. Other expenses need the extra detail box.",
      ],
    },
  },
  {
    id: "papers",
    title: { en: "Question papers", bn: "প্রশ্নপত্র" },
    body: {
      bn: [
        "আরও → প্রশ্নপত্র। নতুন পেপার যোগ, শিরোনাম/পরীক্ষা/নম্বর।",
        "টাইপ বা পেস্ট: ১. ২. ৩. অপশন A. B. C. D. সৃজনশীল (a) (b)। নম্বর [১০]। তারপর প্রিন্ট-রেডি প্রশ্ন বানান।",
        "স্ক্যান/ছবি: হাতে লেখা পাতার ছবি রাখুন, পাশে টাইপ করুন। অ্যাপ নিজে বাংলা পড়ে প্রশ্ন বানাবে না।",
        "প্রিন্ট প্রিভিউ — পর্দায় দেখবেন, তারপর প্রিন্ট। উত্তরপত্র আলাদা। শাফল সেটে সঠিক উত্তর আইডি থাকে, এবিসিডি সরে গেলেও।",
      ],
      en: [
        "Type/paste numbered questions, or keep a photo and type beside it. Print preview is in-app. Shuffle keeps the correct option id.",
      ],
    },
  },
  {
    id: "other",
    title: { en: "Enquiries, exams, print", bn: "এনকোয়ারি, পরীক্ষা, প্রিন্ট" },
    body: {
      bn: [
        "এনকোয়ারি — ফোন/ওয়াক-ইন নাম রাখুন, ফলো-আপ তারিখ, পরে «এনকোয়ারি থেকে ভর্তি».",
        "পরীক্ষা — পরীক্ষা খুলুন, নম্বর দিন। মোট, শতাংশ, র‍্যাঙ্ক আপনা থেকে।",
        "প্রিন্ট সেন্টার — আগে যে প্রিভিউ খুলেছেন (রুটিন/প্রশ্ন/রসিদ) এখানে থেকে আবার।",
      ],
      en: [
        "Enquiries convert to admission. Exams auto-total. Print center reprints recent previews.",
      ],
    },
  },
  {
    id: "settings",
    title: { en: "Settings, PIN, backup", bn: "সেটিংস, পিন, ব্যাকআপ" },
    body: {
      bn: [
        "ভাষা, কোচিংয়ের নাম-ঠিকানা, রুম, ব্যাচ, শেয়ার নাম, পিন লক।",
        "ব্যাকআপ ফাইল নামান — Google Drive বা হোয়াটসঅ্যাপে রাখুন। ফোন হারালে বা ক্রোমের ডেটা মুছলে খাতা যাবে, ফাইল থাকলে ফিরবে।",
        "রিস্টোর: সেই JSON ফাইল বেছে নিন। সপ্তাহে একবার ব্যাকআপ করুন।",
        "পিন চালু থাকলে লক নাও। অফিসে ফোন পড়ে থাকলে দরকার।",
      ],
      en: [
        "Language, centre, rooms, batches, PIN. Export backup weekly. Restore from that JSON. Clearing Chrome wipes the khata.",
      ],
    },
  },
  {
    id: "ask",
    title: { en: "If something is wrong", bn: "সমস্যা হলে" },
    body: {
      bn: [
        "এই গাইডে না থাকলে এই একই গ্রক চ্যাটে লিখুন — মালিক নিজে। যেমন: «ফি আদায় হচ্ছে না», «রুটিনে রুম ভুল», «রসিদ প্রিন্ট হয় না».",
        "যা লিখবেন: কোন পাতা, কী চাপলেন, কী দেখতে চেয়েছিলেন, কী হলো।",
        "ডেমো মুছে নিজের কোচিং চালু করতে: আরও → কোচিং সেটআপ → আমার কোচিং শুরু। আগে ব্যাকআপ নামান যদি ডেমোর কিছু রাখতে চান।",
      ],
      en: [
        "Ask in this same Grok chat. Say which page, what you tapped, what you expected. Backup before Start my coaching if you need the demo data.",
      ],
    },
  },
];

export function guideHtml(lang: Lang, coaching: string): string {
  const title = lang === "bn" ? "পাঠশালা — মালিকের গাইড" : "Pathshala — owner guide";
  const sections = GUIDE_SECTIONS.map((s) => {
    const h = s.title[lang];
    const paras = s.body[lang].map((p) => `<p style="margin:0 0 8px;line-height:1.55">${escape(p)}</p>`).join("");
    return `<h2 style="font-size:16px;margin:22px 0 8px;border-bottom:1px solid #c5d0d4;padding-bottom:4px">${escape(h)}</h2>${paras}`;
  }).join("");
  return `<div style="font-family:'Noto Sans Bengali','Noto Sans',sans-serif;color:#2B3137">
    <div style="text-align:center;border-bottom:2.5px solid #183B5B;padding-bottom:10px">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#2D6F6D">${escape(coaching)}</div>
      <h1 style="margin:6px 0 0;font-size:26px">${escape(title)}</h1>
    </div>
    ${sections}
  </div>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}
