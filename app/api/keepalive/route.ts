import { NextResponse } from "next/server";

export async function GET() {
  try {
    const fetchOptions = {
      method: "GET",
      headers: { "User-Agent": "OnivaKeepAlive/1.0" }
    };

    // 1. Keep Geocoding (Nominatim) Awake & Database Warm
    const geocodingUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    const geocodingPing = fetch(`${geocodingUrl}/search?q=Montreal&format=json&limit=1`, fetchOptions);
    
    // 2. Keep Map Tiles Awake & Database Warm
    const mapTilesEnv = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://abhises-oniva-map-tiles.hf.space";
    // We clean the URL in case it has the {z}/{x}/{y}.png pattern in the string
    const mapTilesBaseUrl = mapTilesEnv.split('/tile')[0];
    const mapTilesPing = fetch(`${mapTilesBaseUrl}/tile/0/0/0.png`, fetchOptions);

    // 3. Keep Routing (OSRM) Awake
    const osrmUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://abhises-osrm-server.hf.space";
    // Dummy route in Dakar to keep the OSRM active
    const osrmPing = fetch(`${osrmUrl}/route/v1/driving/-17.4677,14.7167;-17.45,14.72`, fetchOptions);

    // Fire all three requests concurrently so we don't slow down the Uptime Robot ping
    await Promise.allSettled([geocodingPing, mapTilesPing, osrmPing]);
    
    return NextResponse.json({ status: "All Oniva Hugging Face Spaces Warmed" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "Error pinging HF" }, { status: 500 });
  }
}

// Accept UptimeRobot's HEAD request so it doesn't crash with a 405
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
