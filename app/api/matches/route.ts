import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const teamId = searchParams.get("teamId")

    // Create cache key
    const cacheKey = `matches-${dateFrom}-${dateTo}-${teamId || "all"}`

    // Check cache first
    const cachedData = rateLimiter.getCached(cacheKey)
    if (cachedData) {
      console.log("Returning cached matches data")
      return NextResponse.json(cachedData)
    }

    // Check rate limit
    if (!rateLimiter.canMakeRequest("matches")) {
      const waitTime = rateLimiter.getTimeUntilReset("matches")
      console.log("Rate limit exceeded, wait time:", waitTime)

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request`,
          waitTime,
          matches: [],
        },
        { status: 429 },
      )
    }

    // Default to show matches from 2 days ago to 5 days ahead (7 days total)
    const defaultDateFrom = dateFrom || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const defaultDateTo = dateTo || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    let url = `${BASE_URL}/matches?dateFrom=${defaultDateFrom}&dateTo=${defaultDateTo}`

    if (teamId) {
      url += `&team=${teamId}`
    }

    console.log("Making API request to:", url)

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    console.log("API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            details: "The Football API is temporarily unavailable. Please try again in 60 seconds.",
            matches: [],
          },
          { status: 429 },
        )
      }

      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("API Response data:", {
      matchCount: data.matches?.length || 0,
      filters: data.filters,
      resultSet: data.resultSet,
    })

    // Transform the data
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
      resultSet: data.resultSet,
      filters: data.filters,
      cached: false,
      timestamp: new Date().toISOString(),
    }

    // Cache the response
    rateLimiter.setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch matches",
        details: error instanceof Error ? error.message : "Unknown error",
        matches: [],
      },
      { status: 500 },
    )
  }
}
