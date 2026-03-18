import type { SupportedLanguage } from "@/prompts/health";

export type UiStrings = {
    appName: string;
    speak: string;
    online: string;
    askPlaceholder: string;
    medicine: string;
    medicineSublabel: string;
    clinic: string;
    clinicSublabel: string;
    scanning: string;
    analyzingMedicine: string;
    replay: string;
    switchLanguage: string;
    safe: string;
    caution: string;
    urgent: string;
    comingSoon: string;
    robotName: string;
    pickImage: string;
    findClinic: string;
    permissionDenied: string;
    listenHint: string;
    yourHealthYourLanguage: string;
    prescriptionComingSoon: string;
    processing: string;
    downloadSummary: string;
    noConversationError: string;
    summaryHeader: string;
    consultationDetails: string;
    importantNotice: string;
    disclaimer: string;
};

export const STRINGS: Record<SupportedLanguage, UiStrings> = {
    kannada: {
        appName: "Arogya AI | ಆರೋಗ್ಯ AI",
        speak: "ಮಾತನಾಡಿ",
        online: "ಆನ್‌ಲೈನ್",
        askPlaceholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ...",
        medicine: "ಮಾತ್ರೆ",
        medicineSublabel: "ಮಾತ್ರೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
        clinic: "ಆಸ್ಪತ್ರೆ",
        clinicSublabel: "ಹತ್ತಿರದ ಕೇಂದ್ರ ಹುಡುಕಿ",
        scanning: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
        analyzingMedicine: "ನಿಮ್ಮ ಮಾತ್ರೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ",
        replay: "ಮತ್ತೆ ಕೇಳಿ",
        switchLanguage: "ಭಾಷೆ",
        safe: "Safe · ಸಾಮಾನ್ಯ",
        caution: "Monitor · ಗಮನಿಸಿ",
        urgent: "See doctor · ತಕ್ಷಣ ಹೋಗಿ",
        comingSoon: "ಶೀಘ್ರದಲ್ಲೇ",
        robotName: "Dr. Arogya Bot",
        pickImage: "ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ",
        findClinic: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ",
        permissionDenied: "ಸ್ಥಳ ಮಾಹಿತಿ ಅನುಮತಿ ಬೇಕಾಗಿದೆ.",
        listenHint: "ಒಮ್ಮೆ ಟ್ಯಾಪ್ ಮಾಡಿ ಮಾತನಾಡಿ",
        yourHealthYourLanguage: "ನಿಮ್ಮ ಆರೋಗ್ಯ. ನಿಮ್ಮ ಭಾಷೆ.",
        prescriptionComingSoon: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ರೀಡರ್ ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತಿದೆ",
        processing: "ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...",
        downloadSummary: "ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಪಡೆಯಿರಿ",
        noConversationError: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಯಾವುದೇ ಸಂಭಾಷಣೆ ಇಲ್ಲ.",
        summaryHeader: "--- Dr. Arogya ಇ-ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ---",
        consultationDetails: "--- ಸಮಾಲೋಚನೆ ವಿವರಗಳು ---",
        importantNotice: "--- ಪ್ರಮುಖ ಸೂಚನೆ ---",
        disclaimer: "ಹಕ್ಕುತ್ಯಾಗ: ಇದು AI ರಚಿಸಿದ ಸಾರಾಂಶವಾಗಿದೆ. ಇದು ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಲ್ಲ. ಗಂಭೀರ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳಿಗೆ ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    },
    hindi: {
        appName: "Arogya AI | आरोग्य AI",
        speak: "बोलिए",
        online: "ऑनलाइन",
        askPlaceholder: "अपना प्रश्न पूछिए...",
        medicine: "दवाई",
        medicineSublabel: "दवाई स्कैन करें",
        clinic: "अस्पताल",
        clinicSublabel: "नजदीकी केंद्र खोजें",
        scanning: "जांच की जा रही है...",
        analyzingMedicine: "आपकी दवाई का विश्लेषण किया जा रहा है",
        replay: "फिर सुनें",
        switchLanguage: "भाषा",
        safe: "Safe · सामान्य",
        caution: "Monitor · ध्यान दें",
        urgent: "See doctor · तुरंत जाएं",
        comingSoon: "जल्द आ रहा है",
        robotName: "Dr. Arogya Bot",
        pickImage: "तस्वीर चुनें",
        findClinic: "नजदीकी अस्पताल खोजें",
        permissionDenied: "लोकेशन अनुमति आवश्यक है।",
        listenHint: "टैप करके बोलना शुरू करें",
        yourHealthYourLanguage: "आपका स्वास्थ्य. आपकी भाषा.",
        prescriptionComingSoon: "पर्ची रीडर जल्द आ रहा है",
        processing: "प्रोसेस किया जा रहा है...",
        downloadSummary: "डॉक्टर का पर्चा प्राप्त करें",
        noConversationError: "डाउनलोड करने के लिए कोई बातचीत नहीं है|",
        summaryHeader: "--- Dr. Arogya ई-पर्चा ---",
        consultationDetails: "--- परामर्श विवरण ---",
        importantNotice: "--- जरूरी सूचना ---",
        disclaimer: "अस्वीकरण: यह AI द्वारा बनाया गया सारांश है। यह एक आधिकारिक मेडिकल नुस्खा नहीं है। गंभीर स्वास्थ्य समस्याओं के लिए कृपया डॉक्टर से परामर्श लें।",
    },
    english: {
        appName: "Arogya AI",
        speak: "Speak",
        online: "Online",
        askPlaceholder: "Ask your question...",
        medicine: "Medicine",
        medicineSublabel: "Scan medicine",
        clinic: "Clinic",
        clinicSublabel: "Find clinic",
        scanning: "Scanning...",
        analyzingMedicine: "Analyzing your medicine",
        replay: "Replay",
        switchLanguage: "Language",
        safe: "Safe · ಸಾಮಾನ್ಯ",
        caution: "Monitor · ಗಮನಿಸಿ",
        urgent: "See doctor · ತಕ್ಷಣ ಹೋಗಿ",
        comingSoon: "Coming soon",
        robotName: "Dr. Arogya Bot",
        pickImage: "Pick an image",
        findClinic: "Find nearest clinic",
        permissionDenied: "Location permission is needed.",
        listenHint: "Tap once to start speaking",
        yourHealthYourLanguage: "Your health. Your language.",
        prescriptionComingSoon: "Prescription reader is coming soon",
        processing: "Processing...",
        downloadSummary: "Get Doctor's Prescription",
        noConversationError: "No conversation to generate prescription from.",
        summaryHeader: "--- Dr. Arogya E-Prescription ---",
        consultationDetails: "--- Consultation Details ---",
        importantNotice: "--- Important Notice ---",
        disclaimer: "Disclaimer: This is an AI-generated summary. It is NOT a professional medical diagnosis or official prescription. Please consult a qualified doctor for serious health concerns.",
    },
    telugu: {
        appName: "Arogya AI | ఆరోగ్య AI",
        speak: "మాట్లాడండి",
        online: "ఆన్‌లైన్",
        askPlaceholder: "మీ ప్రశ్న అడగండి...",
        medicine: "మందు",
        medicineSublabel: "మందు స్కాన్ చేయండి",
        clinic: "క్లినిక్",
        clinicSublabel: "దగ్గరి క్లినిక్ కనుగొనండి",
        scanning: "స్కాన్ చేస్తోంది...",
        analyzingMedicine: "మీ మందును విశ్లేషిస్తోంది",
        replay: "మళ్ళీ వినండి",
        switchLanguage: "భాష",
        safe: "Safe · సాధారణ",
        caution: "Monitor · గమనించండి",
        urgent: "See doctor · డాక్టర్ దగ్గరికి వెళ్ళండి",
        comingSoon: "త్వరలో",
        robotName: "Dr. Arogya Bot",
        pickImage: "చిత్రం ఎంచుకోండి",
        findClinic: "దగ్గరి క్లినిక్ కనుగొనండి",
        permissionDenied: "స్థాన అనుమతి అవసరం.",
        listenHint: "మాట్లాడటానికి ఒకసారి నొక్కండి",
        yourHealthYourLanguage: "మీ ఆరోగ్యం. మీ భాష.",
        prescriptionComingSoon: "ప్రిస్క్రిప్షన్ రీడర్ త్వరలో రాబోతోంది",
        processing: "ప్రాసెస్ చేస్తోంది...",
        downloadSummary: "డాక్టర్ ప్రిస్క్రిప్షన్ పొందండి",
        noConversationError: "ప్రిస్క్రిప్షన్ రూపొందించడానికి సంభాషణ లేదు.",
        summaryHeader: "--- Dr. Arogya ఇ-ప్రిస్క్రిప్షన్ ---",
        consultationDetails: "--- సంప్రదింపుల వివరాలు ---",
        importantNotice: "--- ముఖ్యమైన గమనిక ---",
        disclaimer: "నిరాకరణ: ఇది AI రూపొందించిన సారాంశం. ఇది అధికారిక వైద్య నిర్ధారణ కాదు. తీవ్రమైన ఆరోగ్య సమస్యల కోసం దయచేసి అర్హత కలిగిన వైద్యుడిని సంప్రదించండి.",
    },
};

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    kannada: "ಕನ್ನಡ Kannada",
    hindi: "हिंदी Hindi",
    english: "English",
    telugu: "తెలుగు Telugu",
};
