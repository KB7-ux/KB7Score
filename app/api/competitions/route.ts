import { NextResponse } from "next/server"

const API_KEY = "9e02395cb07d4f6eaf8642fc8b66bbcd"
const BASE_URL = "https://api.football-data.org/v4"

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/competitions`, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        competitions: [
          {
            id: 2021,
            name: "Premier League",
            code: "PL",
            type: "LEAGUE",
            emblem: "/placeholder.svg?height=32&width=32",
            currentSeason: {
              startDate: "2024-08-17",
              endDate: "2025-05-25",
              currentMatchday: 15,
            },
          },
          {
            id: 2014,
            name: "Primera División",
            code: "PD",
            type: "LEAGUE",
            emblem: "/placeholder.svg?height=32&width=32",
            currentSeason: {
              startDate: "2024-08-18",
              endDate: "2025-05-25",
              currentMatchday: 15,
            },
          },
        ],
      })
    }

    const data = await response.json()

    // Filter for major football competitions
    const majorCompetitions = data.competitions.filter((comp: any) =>
      ["PL", "PD", "SA", "BL1", "FL1", "CL", "EL", "EC"].includes(comp.code),
    )

    return NextResponse.json({ competitions: majorCompetitions })
  } catch (error) {
    console.error("Error fetching competitions:", error)
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 })
  }
}
