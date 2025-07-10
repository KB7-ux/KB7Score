import { NextResponse } from "next/server"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const competitionId = searchParams.get("competition") || "PL"

    console.log("Fetching teams for competition:", competitionId, "search:", search)

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/teams`, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    console.log("Teams API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Teams API Error:", response.status, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Teams data received:", {
      teamsCount: data.teams?.length || 0,
      competition: data.competition?.name,
    })

    // Filter teams based on search query if provided
    let filteredTeams = data.teams || []
    if (search) {
      filteredTeams = data.teams.filter(
        (team: any) =>
          team.name.toLowerCase().includes(search.toLowerCase()) ||
          team.shortName?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Transform teams data
    const transformedTeams = filteredTeams.map((team: any) => ({
      id: team.id,
      name: team.name,
      shortName: team.shortName || team.name,
      tla: team.tla,
      crest: team.crest || "/placeholder.svg?height=64&width=64",
      address: team.address,
      website: team.website,
      founded: team.founded,
      clubColors: team.clubColors,
      venue: team.venue,
      lastUpdated: team.lastUpdated,
    }))

    return NextResponse.json({
      teams: transformedTeams,
      competition: data.competition,
    })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch teams",
        details: error instanceof Error ? error.message : "Unknown error",
        teams: [],
      },
      { status: 500 },
    )
  }
}
