import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const competition = searchParams.get("competition") || "PL"

    const cacheKey = `standings-${competition}`

    // Check cache first
    const cachedData = rateLimiter.getCached(cacheKey)
    if (cachedData) {
      console.log("Returning cached standings data")
      return NextResponse.json(cachedData)
    }

    // Check rate limit
    if (!rateLimiter.canMakeRequest("standings")) {
      const waitTime = rateLimiter.getTimeUntilReset("standings")
      console.log("Standings rate limit exceeded, wait time:", waitTime)

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Please wait ${Math.ceil(waitTime / 1000)} seconds`,
          waitTime,
          standings: [{ table: [] }],
        },
        { status: 429 },
      )
    }

    console.log("Making standings API request for competition:", competition)

    const response = await fetch(`${BASE_URL}/competitions/${competition}/standings`, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    console.log("Standings API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Standings API Error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            details: "The Football API is temporarily unavailable. Please try again in 60 seconds.",
            standings: [{ table: [] }],
          },
          { status: 429 },
        )
      }

      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Standings data received:", {
      competition: data.competition?.name,
      standingsCount: data.standings?.length || 0,
    })

    // Transform standings data
    const transformedStandings =
      data.standings?.[0]?.table?.map((team: any) => ({
        position: team.position,
        team: {
          id: team.team.id,
          name: team.team.name,
          shortName: team.team.shortName || team.team.name,
          crest: team.team.crest || "/placeholder.svg?height=24&width=24",
        },
        playedGames: team.playedGames,
        won: team.won,
        draw: team.draw,
        lost: team.lost,
        points: team.points,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
      })) || []

    const responseData = {
      standings: [
        {
          table: transformedStandings,
        },
      ],
      competition: data.competition,
      season: data.season,
      cached: false,
      timestamp: new Date().toISOString(),
    }

    // Cache the response
    rateLimiter.setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch standings",
        details: error instanceof Error ? error.message : "Unknown error",
        standings: [{ table: [] }],
      },
      { status: 500 },
    )
  }
}
