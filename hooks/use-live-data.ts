"use client"

import { useState, useEffect } from "react"

interface Match {
  id: number
  homeTeam: { id: number; name: string; crest: string; shortName: string }
  awayTeam: { id: number; name: string; crest: string; shortName: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
  status: string
  minute?: number
  utcDate: string
  competition: { id: number; name: string; emblem: string }
  venue?: string
  matchday?: number
  stage?: string
  lastUpdated: string
}

interface Standing {
  position: number
  team: { id: number; name: string; crest: string; shortName: string }
  playedGames: number
  goalDifference: number
  points: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

export function useLiveMatches() {
  const [dateRange] = useState({
    from: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [matches, setMatches] = useState<Match[]>([])
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [waitTime, setWaitTime] = useState(0)

  const fetchMatches = async () => {
    try {
      setError(null)
      setRateLimited(false)

      let url = "/api/matches"
      const params = new URLSearchParams()

      if (dateRange.from) params.append("dateFrom", dateRange.from)
      if (dateRange.to) params.append("dateTo", dateRange.to)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("Fetching matches from:", url)

      // Only fetch live matches if we're not rate limited
      const promises = [fetch(url)]
      if (!rateLimited) {
        promises.push(fetch("/api/live"))
      }

      const responses = await Promise.all(promises)
      const [matchesResponse, liveResponse] = responses

      if (matchesResponse.status === 429) {
        const errorData = await matchesResponse.json()
        setRateLimited(true)
        setWaitTime(errorData.waitTime || 60000)
        setError("Rate limit exceeded. Using cached data.")
        return
      }

      if (!matchesResponse.ok) {
        throw new Error(`HTTP error! status: ${matchesResponse.status}`)
      }

      const matchesData = await matchesResponse.json()
      console.log("Matches data received:", matchesData)

      if (matchesData.error && matchesData.error !== "Rate limit exceeded") {
        throw new Error(matchesData.details || matchesData.error)
      }

      setMatches(matchesData.matches || [])

      // Handle live matches separately if available
      if (liveResponse && liveResponse.ok) {
        const liveData = await liveResponse.json()
        console.log("Live matches data received:", liveData)
        if (!liveData.error) {
          setLiveMatches(liveData.matches || [])
        }
      }
    } catch (err) {
      console.error("Error in fetchMatches:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()

    // Reduce refresh frequency to avoid rate limits
    // Refresh every 2 minutes instead of 30 seconds
    const interval = setInterval(fetchMatches, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dateRange.from, dateRange.to])

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimited && waitTime > 0) {
      const countdown = setInterval(() => {
        setWaitTime((prev) => {
          if (prev <= 1000) {
            setRateLimited(false)
            clearInterval(countdown)
            return 0
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(countdown)
    }
  }, [rateLimited, waitTime])

  return {
    matches: [...matches, ...liveMatches],
    liveMatches,
    loading,
    error,
    rateLimited,
    waitTime: Math.ceil(waitTime / 1000),
    refetch: fetchMatches,
    dateRange,
  }
}

export function useStandings(competition = "PL") {
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setError(null)
        console.log("Fetching standings for:", competition)

        const response = await fetch(`/api/standings?competition=${competition}`)

        if (response.status === 429) {
          const errorData = await response.json()
          setError(`Rate limited. Please wait ${Math.ceil((errorData.waitTime || 60000) / 1000)} seconds.`)
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Standings data received:", data)

        if (data.error && data.error !== "Rate limit exceeded") {
          throw new Error(data.details || data.error)
        }

        setStandings(data.standings?.[0]?.table || [])
      } catch (err) {
        console.error("Error in fetchStandings:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [competition])

  return { standings, loading, error }
}

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setError(null)
        console.log("Fetching competitions...")

        const response = await fetch("/api/competitions")

        if (response.status === 429) {
          const errorData = await response.json()
          setError(`Rate limited. Please wait ${Math.ceil((errorData.waitTime || 60000) / 1000)} seconds.`)
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Competitions data received:", data)

        if (data.error && data.error !== "Rate limit exceeded") {
          throw new Error(data.details || data.error)
        }

        setCompetitions(data.competitions || [])
      } catch (err) {
        console.error("Error in fetchCompetitions:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  return { competitions, loading, error }
}
