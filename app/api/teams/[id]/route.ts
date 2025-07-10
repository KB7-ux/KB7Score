import { NextResponse } from "next/server"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const teamId = params.id

    console.log("Fetching team details for ID:", teamId)

    const [teamResponse, matchesResponse] = await Promise.all([
      fetch(`${BASE_URL}/teams/${teamId}`, {
        headers: { "X-Auth-Token": API_KEY },
      }),
      fetch(`${BASE_URL}/teams/${teamId}/matches?status=SCHEDULED,LIVE,IN_PLAY,FINISHED&limit=10`, {
        headers: { "X-Auth-Token": API_KEY },
      }),
    ])

    console.log("Team API Response status:", teamResponse.status)
    console.log("Team Matches API Response status:", matchesResponse.status)

    if (!teamResponse.ok) {
      const errorText = await teamResponse.text()
      console.error("Team API Error:", teamResponse.status, errorText)
      throw new Error(`Team API Error: ${teamResponse.status} - ${errorText}`)
    }

    const teamData = await teamResponse.json()
    let matchesData = { matches: [] }

    if (matchesResponse.ok) {
      matchesData = await matchesResponse.json()
    } else {
      console.warn("Failed to fetch team matches, continuing with team data only")
    }

    console.log("Team data received:", {
      teamName: teamData.name,
      squadSize: teamData.squad?.length || 0,
      matchesCount: matchesData.matches?.length || 0,
    })

    // Transform team data
    const transformedTeam = {
      id: teamData.id,
      name: teamData.name,
      shortName: teamData.shortName || teamData.name,
      tla: teamData.tla,
      crest: teamData.crest || "/placeholder.svg?height=128&width=128",
      address: teamData.address,
      website: teamData.website,
      founded: teamData.founded,
      clubColors: teamData.clubColors,
      venue: teamData.venue,
      coach: teamData.coach
        ? {
            id: teamData.coach.id,
            name: teamData.coach.name,
            dateOfBirth: teamData.coach.dateOfBirth,
            nationality: teamData.coach.nationality,
          }
        : null,
      squad:
        teamData.squad?.map((player: any) => ({
          id: player.id,
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth,
          nationality: player.nationality,
        })) || [],
      lastUpdated: teamData.lastUpdated,
    }

    // Transform matches data
    const transformedMatches =
      matchesData.matches?.map((match: any) => ({
        id: match.id,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          crest: match.homeTeam.crest || "/placeholder.svg?height=24&width=24",
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          crest: match.awayTeam.crest || "/placeholder.svg?height=24&width=24",
        },
        score: {
          fullTime: {
            home: match.score?.fullTime?.home,
            away: match.score?.fullTime?.away,
          },
        },
        status: match.status,
        utcDate: match.utcDate,
        competition: {
          id: match.competition.id,
          name: match.competition.name,
        },
      })) || []

    return NextResponse.json({
      team: transformedTeam,
      matches: transformedMatches,
    })
  } catch (error) {
    console.error("Error fetching team details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch team details",
        details: error instanceof Error ? error.message : "Unknown error",
        team: null,
        matches: [],
      },
      { status: 500 },
    )
  }
}
