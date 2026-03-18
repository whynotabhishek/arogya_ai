import { NextResponse } from "next/server";
import clinics from "@/lib/rag/clinics.json";

type Clinic = {
    name: string;
    district: string;
    lat: number;
    lng: number;
    timing: string;
    phone: string;
};

type ClinicPayload = {
    lat?: number;
    lng?: number;
};

function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function POST(req: Request) {
    try {
        const payload = (await req.json()) as ClinicPayload;

        if (typeof payload.lat !== "number" || typeof payload.lng !== "number") {
            return NextResponse.json({ error: "Location is needed to find the nearest clinic." }, { status: 400 });
        }

        const nearest = (clinics as Clinic[])
            .map((clinic) => ({
                ...clinic,
                distanceKm: distanceInKm(payload.lat!, payload.lng!, clinic.lat, clinic.lng),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)[0];

        return NextResponse.json({ clinic: nearest });
    } catch (error) {
        console.error("/api/clinic failed", error);
        return NextResponse.json(
            { error: "I could not find a clinic right now. Please try again." },
            { status: 500 },
        );
    }
}
