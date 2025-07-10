import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET() {
  try {
    const cacheKey = "live-matches"

    // Check cache first (shorter cache time for live matches)
    const cachedData = rateLimiter.getCached(cacheKey)
    if (cachedData) {
      console.log("Returning cached live matches data")
      return NextResponse.json(cachedData)
    }

    // Check rate limit
    if (!rateLimiter.canMakeRequest("live")) {
      const waitTime = rateLimiter.getTimeUntilReset("live")
      console.log("Live matches rate limit exceeded, wait time:", waitTime)

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Please wait ${Math.ceil(waitTime / 1000)} seconds`,
          waitTime,
          matches: [],
          count: 0,
        },
        { status: 429 },
      )
    }

    console.log("Making live matches API request...")

    // Get today's date
    const today = new Date().toISOString().split("T")[0]

    const response = await fetch(`${BASE_URL}/matches?dateFrom=${today}&dateTo=${today}&status=LIVE,IN_PLAY,PAUSED`, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    console.log("Live matches API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Live matches API Error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            details: "The Football API is temporarily unavailable. Please try again in 60 seconds.",
            matches: [],
            count: 0,
          },
          { status: 429 },
        )
      }

      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Live matches data received:", {
      matchCount: data.matches?.length || 0,
      resultSet: data.resultSet,
    })

    // Transform the live matches data
    const transformedMatches =
      data.matches?.map((match: any) => ({
        id: match.id,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName || match.homeTeam.name,
          crest: match.homeTeam.crest || "/placeholder.svg?height=32&width=32",
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName || match.awayTeam.name,
          crest: match.awayTeam.crest || "/placeholder.svg?height=32&width=32",
        },
        score: {
          fullTime: {
            home: match.score?.fullTime?.home,
            away: match.score?.fullTime?.away,
          },
          halfTime: {
            home: match.score?.halfTime?.home,
            away: match.score?.halfTime?.away,
          },
        },
        status: match.status,
        minute: match.minute,
        utcDate: match.utcDate,
        competition: {
          id: match.competition.id,
          name: match.competition.name,
          emblem: match.competition.emblem || "/placeholder.svg?height=24&width=24",
        },
        venue: match.venue || "TBD",
        matchday: match.matchday,
        stage: match.stage,
        lastUpdated: match.lastUpdated,
      })) || []

    const responseData = {
      matches: transformedMatches,
      count: transformedMatches.length,
      lastUpdated: new Date().toISOString(),
      cached: false,
    }

    // Cache with shorter time for live data (2 minutes)
    rateLimiter.setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching live matches:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch live matches",
        details: error instanceof Error ? error.message : "Unknown error",
        matches: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
