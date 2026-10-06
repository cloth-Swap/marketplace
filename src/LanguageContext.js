import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const LanguageContext = createContext();

const translations = {
  english: {
    home: "Home",
    browseClothes: "Browse Clothes",
    listClothes: "List Your Clothes",
    swapRequests: "Swap Requests",
    swapCalculator: "Swap Calculator",
    nearbySwaps: "Nearby Swaps",
    notifications: "Notifications",
    wishlist: "Wishlist",
    dashboard: "Dashboard",
    chat: "Chat",
    settings: "Settings",
    login: "Login",
    register: "Register",
    logout: "Logout",
    search: "Search",
    language: "Language",

    giveFashionAnotherLife: "Give Fashion Another Life",
    swapIt: "Swap It",
    browse: "Browse",
    list: "List",
    discover: "Discover",
    request: "Request",
    swap: "Swap",

    howItWorks: "How It Works",
    featuredClothes: "Featured Clothes",
    categories: "Categories",
    startSwapping: "Start Swapping",
    sustainability: "Sustainability",

    dresses: "Dresses",
    tops: "Tops",
    jeans: "Jeans",
    jackets: "Jackets",

    likeNew: "Like New",
    excellent: "Excellent",
    veryGood: "Very Good",

    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    continue: "Continue",
    back: "Back",
    next: "Next",
    viewDetails: "View Details",
    sendRequest: "Send Request",

    email: "Email",
    password: "Password",
    name: "Name",
    location: "Location",
    confirmPassword: "Confirm Password",

    noItemsFound: "No items found",
    loading: "Loading...",
    somethingWentWrong: "Something went wrong",

    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    communityGuidelines: "Community Guidelines",

    settingsTitle: "Settings",
    settingsSubtitle: "Manage your account and preferences",
    preferences: "Preferences",
    preferencesDescription:
      "Customize your ClothSwap experience.",
    notificationsTitle: "Notifications",
    notificationsDescription:
      "Manage how you receive notifications.",
    compactMode: "Compact Mode",
    compactModeDescription:
      "Use a more compact layout.",
    languageTitle: "Language",
    languageDescription:
      "Choose your preferred language.",

    privacy: "Privacy",
    privacyDescription:
      "Manage your privacy settings.",
    profileVisibility: "Profile Visibility",
    profileVisibilityDescription:
      "Choose who can see your profile.",
    public: "Public",
    private: "Private",
    showLocation: "Show Location",
    showLocationDescription:
      "Allow other users to see your location.",

    communication: "Communication",
    communicationDescription:
      "Manage communication preferences.",
    chatNotifications: "Chat Notifications",
    chatNotificationsDescription:
      "Receive notifications for new messages.",
    swapRequestNotifications:
      "Swap Request Notifications",
    swapRequestNotificationsDescription:
      "Receive notifications for swap requests.",

    helpSupport: "Help & Support",
    helpSupportDescription:
      "Get help with ClothSwap.",
    howClothSwapWorks: "How ClothSwap Works",
    howClothSwapWorksDescription:
      "Learn how the ClothSwap marketplace works.",
    frequentlyAskedQuestions:
      "Frequently Asked Questions",
    frequentlyAskedQuestionsDescription:
      "Find answers to common questions.",
    reportProblem: "Report a Problem",
    reportProblemDescription:
      "Let us know if something is not working.",

    legalPrivacy: "Privacy",
    legalPrivacyDescription:
      "Read our privacy policy.",
    privacyPolicyDescription:
      "Learn how we protect your information.",
    termsConditionsDescription:
      "Read the terms and conditions.",
    communityGuidelinesDescription:
      "Learn about our community rules.",

    settingsSaved: "Settings saved successfully."
  },

  hindi: {
    home: "होम",
    browseClothes: "कपड़े देखें",
    listClothes: "अपने कपड़े सूचीबद्ध करें",
    swapRequests: "स्वैप अनुरोध",
    swapCalculator: "स्वैप कैलकुलेटर",
    nearbySwaps: "आस-पास के स्वैप",
    notifications: "सूचनाएं",
    wishlist: "पसंदीदा",
    dashboard: "डैशबोर्ड",
    chat: "चैट",
    settings: "सेटिंग्स",
    login: "लॉगिन",
    register: "रजिस्टर",
    logout: "लॉगआउट",
    search: "खोजें",
    language: "भाषा",

    giveFashionAnotherLife: "फैशन को एक नई ज़िंदगी दें",
    swapIt: "इसे स्वैप करें",
    browse: "देखें",
    list: "सूचीबद्ध करें",
    discover: "खोजें",
    request: "अनुरोध करें",
    swap: "स्वैप करें",

    howItWorks: "यह कैसे काम करता है",
    featuredClothes: "विशेष कपड़े",
    categories: "श्रेणियां",
    startSwapping: "स्वैप शुरू करें",
    sustainability: "सस्टेनेबिलिटी",

    dresses: "ड्रेस",
    tops: "टॉप",
    jeans: "जींस",
    jackets: "जैकेट",

    likeNew: "नए जैसे",
    excellent: "उत्कृष्ट",
    veryGood: "बहुत अच्छा",

    save: "सहेजें",
    cancel: "रद्द करें",
    submit: "जमा करें",
    continue: "जारी रखें",
    back: "वापस",
    next: "अगला",
    viewDetails: "विवरण देखें",
    sendRequest: "अनुरोध भेजें",

    email: "ईमेल",
    password: "पासवर्ड",
    name: "नाम",
    location: "स्थान",
    confirmPassword: "पासवर्ड की पुष्टि करें",

    noItemsFound: "कोई आइटम नहीं मिला",
    loading: "लोड हो रहा है...",
    somethingWentWrong: "कुछ गलत हो गया",

    privacyPolicy: "गोपनीयता नीति",
    termsConditions: "नियम और शर्तें",
    communityGuidelines: "सामुदायिक दिशानिर्देश",

    settingsTitle: "सेटिंग्स",
    settingsSubtitle:
      "अपने अकाउंट और प्राथमिकताएं प्रबंधित करें",
    preferences: "प्राथमिकताएं",
    preferencesDescription:
      "अपने ClothSwap अनुभव को कस्टमाइज़ करें।",
    notificationsTitle: "सूचनाएं",
    notificationsDescription:
      "सूचनाएं प्राप्त करने का तरीका प्रबंधित करें।",
    compactMode: "कॉम्पैक्ट मोड",
    compactModeDescription:
      "अधिक कॉम्पैक्ट लेआउट का उपयोग करें।",
    languageTitle: "भाषा",
    languageDescription:
      "अपनी पसंदीदा भाषा चुनें।",

    privacy: "गोपनीयता",
    privacyDescription:
      "अपनी गोपनीयता सेटिंग्स प्रबंधित करें।",
    profileVisibility: "प्रोफ़ाइल दृश्यता",
    profileVisibilityDescription:
      "चुनें कि आपकी प्रोफ़ाइल कौन देख सकता है।",
    public: "सार्वजनिक",
    private: "निजी",
    showLocation: "स्थान दिखाएं",
    showLocationDescription:
      "अन्य उपयोगकर्ताओं को आपका स्थान देखने दें।",

    communication: "संचार",
    communicationDescription:
      "संचार प्राथमिकताएं प्रबंधित करें।",
    chatNotifications: "चैट सूचनाएं",
    chatNotificationsDescription:
      "नए संदेशों के लिए सूचनाएं प्राप्त करें।",
    swapRequestNotifications:
      "स्वैप अनुरोध सूचनाएं",
    swapRequestNotificationsDescription:
      "स्वैप अनुरोधों के लिए सूचनाएं प्राप्त करें।",

    helpSupport: "सहायता और समर्थन",
    helpSupportDescription:
      "ClothSwap से सहायता प्राप्त करें।",
    howClothSwapWorks: "ClothSwap कैसे काम करता है",
    howClothSwapWorksDescription:
      "जानें कि ClothSwap मार्केटप्लेस कैसे काम करता है।",
    frequentlyAskedQuestions:
      "अक्सर पूछे जाने वाले प्रश्न",
    frequentlyAskedQuestionsDescription:
      "सामान्य प्रश्नों के उत्तर खोजें।",
    reportProblem: "समस्या की रिपोर्ट करें",
    reportProblemDescription:
      "अगर कुछ काम नहीं कर रहा है तो हमें बताएं।",

    legalPrivacy: "गोपनीयता",
    legalPrivacyDescription:
      "हमारी गोपनीयता नीति पढ़ें।",
    privacyPolicyDescription:
      "जानें कि हम आपकी जानकारी की सुरक्षा कैसे करते हैं।",
    termsConditionsDescription:
      "नियम और शर्तें पढ़ें।",
    communityGuidelinesDescription:
      "हमारे सामुदायिक नियमों के बारे में जानें।",

    settingsSaved: "सेटिंग्स सफलतापूर्वक सहेजी गईं।"
  },

  gujarati: {
    home: "હોમ",
    browseClothes: "કપડાં જુઓ",
    listClothes: "તમારા કપડાં ઉમેરો",
    swapRequests: "સ્વેપ વિનંતીઓ",
    swapCalculator: "સ્વેપ કેલ્ક્યુલેટર",
    nearbySwaps: "નજીકના સ્વેપ",
    notifications: "સૂચનાઓ",
    wishlist: "વિશલિસ્ટ",
    dashboard: "ડેશબોર્ડ",
    chat: "ચેટ",
    settings: "સેટિંગ્સ",
    login: "લોગિન",
    register: "રજિસ્ટર",
    logout: "લોગઆઉટ",
    search: "શોધો",
    language: "ભાષા",

    giveFashionAnotherLife:
      "ફેશનને એક નવી જિંદગી આપો",
    swapIt: "સ્વેપ કરો",
    browse: "જુઓ",
    list: "ઉમેરો",
    discover: "શોધો",
    request: "વિનંતી કરો",
    swap: "સ્વેપ",

    howItWorks: "આ કેવી રીતે કામ કરે છે",
    featuredClothes: "પસંદગીના કપડાં",
    categories: "કેટેગરીઝ",
    startSwapping: "સ્વેપ શરૂ કરો",
    sustainability: "સસ્ટેનેબિલિટી",

    dresses: "ડ્રેસ",
    tops: "ટોપ્સ",
    jeans: "જીન્સ",
    jackets: "જેકેટ્સ",

    likeNew: "નવા જેવા",
    excellent: "ઉત્કૃષ્ટ",
    veryGood: "ખૂબ સારું",

    save: "સાચવો",
    cancel: "રદ કરો",
    submit: "સબમિટ કરો",
    continue: "આગળ વધો",
    back: "પાછળ",
    next: "આગળ",
    viewDetails: "વિગતો જુઓ",
    sendRequest: "વિનંતી મોકલો",

    email: "ઈમેલ",
    password: "પાસવર્ડ",
    name: "નામ",
    location: "સ્થળ",
    confirmPassword: "પાસવર્ડની પુષ્ટિ કરો",

    noItemsFound: "કોઈ આઇટમ મળી નથી",
    loading: "લોડ થઈ રહ્યું છે...",
    somethingWentWrong: "કંઈક ખોટું થયું",

    privacyPolicy: "ગોપનીયતા નીતિ",
    termsConditions: "નિયમો અને શરતો",
    communityGuidelines: "સમુદાય માર્ગદર્શિકા",

    settingsTitle: "સેટિંગ્સ",
    settingsSubtitle:
      "તમારા અકાઉન્ટ અને પસંદગીઓ મેનેજ કરો",
    preferences: "પસંદગીઓ",
    preferencesDescription:
      "તમારો ClothSwap અનુભવ કસ્ટમાઇઝ કરો.",
    notificationsTitle: "સૂચનાઓ",
    notificationsDescription:
      "સૂચનાઓ કેવી રીતે મેળવવી તે મેનેજ કરો.",
    compactMode: "કોમ્પેક્ટ મોડ",
    compactModeDescription:
      "વધુ કોમ્પેક્ટ લેઆઉટનો ઉપયોગ કરો.",
    languageTitle: "ભાષા",
    languageDescription:
      "તમારી પસંદગીની ભાષા પસંદ કરો.",

    privacy: "ગોપનીયતા",
    privacyDescription:
      "તમારી ગોપનીયતા સેટિંગ્સ મેનેજ કરો.",
    profileVisibility: "પ્રોફાઇલ વિઝિબિલિટી",
    profileVisibilityDescription:
      "તમારી પ્રોફાઇલ કોણ જોઈ શકે તે પસંદ કરો.",
    public: "જાહેર",
    private: "ખાનગી",
    showLocation: "સ્થળ બતાવો",
    showLocationDescription:
      "અન્ય યુઝર્સને તમારું સ્થાન જોવા દો.",

    communication: "સંચાર",
    communicationDescription:
      "સંચારની પસંદગીઓ મેનેજ કરો.",
    chatNotifications: "ચેટ સૂચનાઓ",
    chatNotificationsDescription:
      "નવા મેસેજ માટે સૂચનાઓ મેળવો.",
    swapRequestNotifications:
      "સ્વેપ વિનંતી સૂચનાઓ",
    swapRequestNotificationsDescription:
      "સ્વેપ વિનંતીઓ માટે સૂચનાઓ મેળવો.",

    helpSupport: "મદદ અને સપોર્ટ",
    helpSupportDescription:
      "ClothSwap માટે મદદ મેળવો.",
    howClothSwapWorks:
      "ClothSwap કેવી રીતે કામ કરે છે",
    howClothSwapWorksDescription:
      "ClothSwap માર્કેટપ્લેસ કેવી રીતે કામ કરે છે તે જાણો.",
    frequentlyAskedQuestions:
      "વારંવાર પૂછાતા પ્રશ્નો",
    frequentlyAskedQuestionsDescription:
      "સામાન્ય પ્રશ્નોના જવાબો શોધો.",
    reportProblem: "સમસ્યાની જાણ કરો",
    reportProblemDescription:
      "કંઈક કામ ન કરતું હોય તો અમને જણાવો.",

    legalPrivacy: "ગોપનીયતા",
    legalPrivacyDescription:
      "અમારી ગોપનીયતા નીતિ વાંચો.",
    privacyPolicyDescription:
      "અમે તમારી માહિતીની સુરક્ષા કેવી રીતે કરીએ છીએ તે જાણો.",
    termsConditionsDescription:
      "નિયમો અને શરતો વાંચો.",
    communityGuidelinesDescription:
      "અમારા સમુદાયના નિયમો વિશે જાણો.",

    settingsSaved:
      "સેટિંગ્સ સફળતાપૂર્વક સેવ થઈ ગઈ."
  }
};


/* ---------------------------------------------------
   Google Translate - GLOBAL WEBSITE TRANSLATION
--------------------------------------------------- */

function loadGoogleTranslate() {
  if (window.google && window.google.translate) {
    return;
  }

  if (document.getElementById("clothswap-google-translate-script")) {
    return;
  }

  window.clothSwapGoogleTranslateInit = function () {
    if (
      window.google &&
      window.google.translate &&
      document.getElementById("google_translate_element")
    ) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,gu",
          autoDisplay: false
        },
        "google_translate_element"
      );
    }
  };

  const script = document.createElement("script");

  script.id = "clothswap-google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=clothSwapGoogleTranslateInit";
  script.async = true;

  document.body.appendChild(script);
}


function hideGoogleTranslateUI() {
  if (document.getElementById("clothswap-google-translate-style")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "clothswap-google-translate-style";

  style.innerHTML = `
    /* Hide Google Translate dropdown */
    #google_translate_element {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }

    /* Hide top Google Translate bar */
    .goog-te-banner-frame {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
    }

    .goog-te-banner-frame.skiptranslate {
      display: none !important;
      visibility: hidden !important;
    }

    iframe.goog-te-banner-frame {
      display: none !important;
      visibility: hidden !important;
    }

    /* Prevent Google from moving the website down */
    html {
      margin-top: 0 !important;
    }

    body {
      top: 0 !important;
      margin-top: 0 !important;
    }

    body > .skiptranslate {
      display: none !important;
    }

    /* Hide Google tooltip */
    .goog-tooltip {
      display: none !important;
      visibility: hidden !important;
    }

    .goog-te-balloon-frame {
      display: none !important;
      visibility: hidden !important;
    }

    #goog-gt-tt {
      display: none !important;
      visibility: hidden !important;
    }

    .goog-text-highlight {
      background: transparent !important;
      box-shadow: none !important;
    }
  `;

  document.head.appendChild(style);
}


function applyGoogleLanguage(language) {
  const languageMap = {
    english: "en",
    hindi: "hi",
    gujarati: "gu"
  };

  const googleLanguage =
    languageMap[language] || "en";

  const select =
    document.querySelector(".goog-te-combo");

  if (!select) {
    return;
  }

  if (select.value === googleLanguage) {
    return;
  }

  select.value = googleLanguage;

  select.dispatchEvent(
    new Event("change", {
      bubbles: true
    })
  );
}


/* ---------------------------------------------------
   LANGUAGE PROVIDER
--------------------------------------------------- */

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(function () {
    const savedLanguage =
      localStorage.getItem("clothSwapLanguage") ||
      localStorage.getItem("clothswapLanguage") ||
      "english";

    const normalizedLanguage =
      String(savedLanguage)
        .trim()
        .toLowerCase();

    if (normalizedLanguage === "hindi") {
      return "hindi";
    }

    if (normalizedLanguage === "gujarati") {
      return "gujarati";
    }

    return "english";
  });


  useEffect(function () {
    localStorage.setItem(
      "clothSwapLanguage",
      language
    );

    localStorage.setItem(
      "clothswapLanguage",
      language
    );

    hideGoogleTranslateUI();
    loadGoogleTranslate();

    const timer = setInterval(function () {
      applyGoogleLanguage(language);

      if (
        document.querySelector(".goog-te-combo")
      ) {
        clearInterval(timer);
      }
    }, 500);

    return function () {
      clearInterval(timer);
    };
  }, [language]);


  useEffect(function () {
    const hiddenGoogleElement =
      document.getElementById(
        "google_translate_element"
      );

    if (!hiddenGoogleElement) {
      const div = document.createElement("div");

      div.id = "google_translate_element";

      div.style.display = "none";

      document.body.appendChild(div);
    }

    hideGoogleTranslateUI();
    loadGoogleTranslate();
  }, []);


  function changeLanguage(newLanguage) {
    const normalizedLanguage =
      String(newLanguage || "")
        .trim()
        .toLowerCase();

    if (!translations[normalizedLanguage]) {
      return;
    }

    setLanguage(normalizedLanguage);

    setTimeout(function () {
      applyGoogleLanguage(normalizedLanguage);
    }, 800);
  }


  function t(key) {
    const currentTranslations =
      translations[language] ||
      translations.english;

    return (
      currentTranslations[key] ||
      translations.english[key] ||
      key
    );
  }


  return React.createElement(
    LanguageContext.Provider,
    {
      value: {
        language,
        changeLanguage,
        t
      }
    },
    children
  );
}


export function useLanguage() {
  return useContext(LanguageContext);
}


export { translations };