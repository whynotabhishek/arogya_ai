export function shareOnWhatsApp(responseText: string, language: string): void {
    let message = "";

    if (language === "kannada") {
        message = `🏥 ಆರೋಗ್ಯ AI ಸಲಹೆ:\n${responseText}\n\n⚠️ ಇದು AI ಮಾಹಿತಿ ಮಾತ್ರ. ತಕ್ಷಣದ ಸಮಸ್ಯೆಗೆ 108 ಕರೆ ಮಾಡಿ.\n📱 Arogya AI: arogyaai.in`;
    } else if (language === "hindi") {
        message = `🏥 आरोग्य AI सलाह:\n${responseText}\n\n⚠️ यह केवल AI जानकारी है। आपात स्थिति में 108 कॉल करें।\n📱 Arogya AI: arogyaai.in`;
    } else if (language === "telugu") {
        message = `🏥 ఆరోగ్య AI సలహా:\n${responseText}\n\n⚠️ ఇది AI సమాచారం మాత్రమే. అత్యవసర పరిస్థితులకు 108 కాల్ చేయండి.\n📱 Arogya AI: arogyaai.in`;
    } else {
        message = `🏥 Arogya AI Health Advice:\n${responseText}\n\n⚠️ AI information only. Call 108 for emergencies.\n📱 Arogya AI: arogyaai.in`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    if (typeof window !== "undefined") {
        window.open(url, "_blank");
    }
}
