import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This secretly pings Hugging Face with a proper GET request to keep it awake!
    const geocodingUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    await fetch(`${geocodingUrl}/status`, { method: "GET" });
    
    return NextResponse.json({ status: "Awake" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "Error pinging HF" }, { status: 500 });
  }
}

// Accept UptimeRobot's HEAD request so it doesn't crash with a 405
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
