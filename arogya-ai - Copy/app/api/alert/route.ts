import { NextResponse } from "next/server";

// import twilio from "twilio";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const fromNumber = process.env.TWILIO_FROM_NUMBER;
// const toNumber = process.env.EMERGENCY_TO_NUMBER;

type AlertPayload = {
    symptom: string;
    lat: number | null;
    lng: number | null;
    timestamp: string;
    language?: string;
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as AlertPayload;

        if (!body.symptom || !body.timestamp) {
            return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
        }

        const locationString =
            body.lat !== null && body.lng !== null
                ? `https://maps.google.com/?q=${body.lat},${body.lng}`
                : "Location unavailable";

        const smsText = `EMERGENCY: Arogya AI has flagged a severe symptom
([${body.symptom}]) for a patient. 
Location: ${locationString}
Time: [${body.timestamp}]. Please respond immediately.`;

        // const client = twilio(accountSid, authToken);
        // await client.messages.create({
        //     body: smsText,
        //     from: fromNumber,
        //     to: toNumber,
        // });

        console.log("--- MOCKED SMS DISPATCH ---");
        console.log(smsText);
        console.log("---------------------------");

        return NextResponse.json({
            success: true,
            action: "play_emergency_audio",
            message: "Emergency alert sent",
        });
    } catch (error) {
        console.error("Error processing emergency alert:", error);
        return NextResponse.json({ success: false, error: "Alert failed" }, { status: 500 });
    }
}
