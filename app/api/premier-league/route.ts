import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

export async function GET() {
  try {
    const cacheKey = "premier-league-data"

    // Check cache first
    const cachedData = rateLimiter.getCached(cacheKey)
    if (cachedData) {
      console.log("Returning cached Premier League data")
      return NextResponse.json(cachedData)
    }

    // Check rate limit
    if (!rateLimiter.canMakeRequest("premier-league")) {
      const waitTime = rateLimiter.getTimeUntilReset("premier-league")
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Please wait ${Math.ceil(waitTime / 1000)} seconds`,
          waitTime,
          data: null,
        },
        { status: 429 },
      )
    }

    // Since direct scraping faces CORS issues, we'll use our existing Football-Data API
    // but enhance it with Premier League specific formatting
    const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
    const BASE_URL = "https://api.football-data.org/v4"

    const [matchesResponse, standingsResponse] = await Promise.all([
      fetch(`${BASE_URL}/competitions/PL/matches?status=SCHEDULED,LIVE,IN_PLAY,FINISHED&limit=20`, {
        headers: { "X-Auth-Token": API_KEY },
      }),
      fetch(`${BASE_URL}/competitions/PL/standings`, {
        headers: { "X-Auth-Token": API_KEY },
      }),
    ])

    if (!matchesResponse.ok || !standingsResponse.ok) {
      throw new Error("Failed to fetch Premier League data")
    }

    const [matchesData, standingsData] = await Promise.all([matchesResponse.json(), standingsResponse.json()])

    const responseData = {
      league: "Premier League",
      season: "2024/25",
      matches: matchesData.matches?.slice(0, 10) || [],
      standings: standingsData.standings?.[0]?.table || [],
      lastUpdated: new Date().toISOString(),
      source: "Football-Data.org API",
    }

    // Cache the response
    rateLimiter.setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching Premier League data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch Premier League data",
        details: error instanceof Error ? error.message : "Unknown error",
        data: null,
      },
      { status: 500 },
    )
  }
}
