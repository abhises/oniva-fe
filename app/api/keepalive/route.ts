import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Prevent static optimization

export async function GET() {
  try {
    const timestamp = Date.now();
    const fetchOptions = {
      method: "GET",
      headers: { "User-Agent": "OnivaKeepAlive/1.0" },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    };

    // 1. Keep Geocoding (Nominatim) Awake
    const geocodingUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    const geocodingPing = fetch(`${geocodingUrl}/search?q=Montreal&format=json&limit=1&t=${timestamp}`, fetchOptions);
    
    // 2. Keep Map Tiles Awake
    const mapTilesEnv = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://abhises-oniva-map-tiles.hf.space";
    const mapTilesBaseUrl = mapTilesEnv.split('/tile')[0];
    const mapTilesPing = fetch(`${mapTilesBaseUrl}/tile/0/0/0.png?t=${timestamp}`, fetchOptions);

    // 3. Keep Routing (OSRM) Awake
    const osrmUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://abhises-osrm-server.hf.space";
    const osrmPing = fetch(`${osrmUrl}/route/v1/driving/-17.4677,14.7167;-17.45,14.72?t=${timestamp}`, fetchOptions);

    // Fire all requests concurrently
    const results = await Promise.allSettled([geocodingPing, mapTilesPing, osrmPing]);
    
    const status = results.map((res, i) => ({
      service: i === 0 ? "Geocoding" : i === 1 ? "MapTiles" : "OSRM",
      status: res.status === "fulfilled" ? "Warm" : "Error/Timeout"
    }));

    return NextResponse.json({ 
      message: "Oniva HF Spaces Warmed", 
      timestamp: new Date().toISOString(),
      details: status
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      status: "Error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
