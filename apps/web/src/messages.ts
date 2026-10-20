import type { LocaleCode } from "@perkly/contracts";

export type HomeCopy = {
  languageLabel: string;
  lead: string;
  payment: string;
  shell: string;
  databaseNext: string;
  apiLoading: string;
  apiUp: string;
  apiDown: string;
};

export const languageNames: Record<LocaleCode, string> = {
  en: "English",
  he: "עברית",
  ar: "العربية",
};

export const homeCopy: Record<LocaleCode, HomeCopy> = {
  en: {
    languageLabel: "Language",
    lead: "Find participating businesses near Kfar Manda.",
    payment:
      "You can browse public offers without a membership. Perkly does not charge the purchase. The business charges on its own till.",
    shell: "This is the local application shell.",
    databaseNext: "The database is the next task.",
    apiLoading: "Checking the local server.",
    apiUp: "The local server is responding.",
    apiDown: "The local server is not responding.",
  },
  he: {
    languageLabel: "שפה",
    lead: "מצאו עסקים משתתפים ליד כפר מנדא.",
    payment: "אפשר לעיין במבצעים בלי מנוי. Perkly לא גובה את תשלום הקנייה. העסק גובה בקופה שלו.",
    shell: "זו מעטפת היישום המקומית.",
    databaseNext: "מסד הנתונים הוא המשימה הבאה.",
    apiLoading: "בודקים את השרת המקומי.",
    apiUp: "השרת המקומי עונה.",
    apiDown: "השרת המקומי לא עונה.",
  },
  ar: {
    languageLabel: "اللغة",
    lead: "اعثروا على المتاجر المشاركة قرب كفر مندا.",
    payment: "يمكن تصفح العروض من غير اشتراك. Perkly لا يحصّل ثمن الشراء. المتجر يقبض في صندوقه.",
    shell: "هذه واجهة التطبيق المحلية.",
    databaseNext: "قاعدة البيانات هي المهمة التالية.",
    apiLoading: "جارٍ التحقق من الخادم المحلي.",
    apiUp: "الخادم المحلي يجيب.",
    apiDown: "الخادم المحلي لا يجيب.",
  },
};
