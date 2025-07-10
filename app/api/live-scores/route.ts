import { NextResponse } from "next/server"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET() {
  try {
    // Get matches for today with live status
    const today = new Date().toISOString().split("T")[0]

    const response = await fetch(`${BASE_URL}/matches?dateFrom=${today}&dateTo=${today}&status=LIVE,IN_PLAY,PAUSED`, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data to match our interface
    const transformedMatches = data.matches.map((match: any) => ({
      id: match.id,
      homeTeam: {
        name: match.homeTeam.name,
        crest: match.homeTeam.crest || "/placeholder.svg?height=32&width=32",
      },
      awayTeam: {
        name: match.awayTeam.name,
        crest: match.awayTeam.crest || "/placeholder.svg?height=32&width=32",
      },
      score: {
        fullTime: {
          home: match.score.fullTime.home,
          away: match.score.fullTime.away,
        },
      },
      status: match.status,
      minute: match.minute,
      utcDate: match.utcDate,
      competition: {
        name: match.competition.name,
        emblem: match.competition.emblem,
      },
      venue: match.venue || "TBD",
    }))

    return NextResponse.json({ matches: transformedMatches })
  } catch (error) {
    console.error("Error fetching live scores:", error)
    return NextResponse.json({ error: "Failed to fetch live scores" }, { status: 500 })
  }
}
