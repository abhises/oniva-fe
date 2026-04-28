import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Ping the actual /search route instead of /status to force the database to read from RAM.
    // This keeps the PostgreSQL indexes "warm" and prevents the slow first search.
    const geocodingUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    
    // We use a dummy search query like "Paris" or "Montreal".
    await fetch(`${geocodingUrl}/search?q=Montreal&format=json&limit=1`, { 
      method: "GET",
      headers: {
        // Some Hugging Face spaces respond better with a generic User-Agent
        "User-Agent": "OnivaKeepAlive/1.0" 
      }
    });
    
    return NextResponse.json({ status: "Awake and Database Warmed" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "Error pinging HF" }, { status: 500 });
  }
}

// Accept UptimeRobot's HEAD request so it doesn't crash with a 405
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
