"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trophy, ExternalLink } from "lucide-react"
import Image from "next/image"
import { MatchCard } from "./match-card"

interface LeagueData {
  league: string
  season: string
  matches: any[]
  standings: any[]
  lastUpdated: string
  source: string
}

export function LeagueSelector() {
  const [premierLeague, setPremierLeague] = useState<LeagueData | null>(null)
  const [laLiga, setLaLiga] = useState<LeagueData | null>(null)
  const [serieA, setSerieA] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeagueData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [plResponse, laResponse, saResponse] = await Promise.all([
        fetch("/api/premier-league"),
        fetch("/api/la-liga"),
        fetch("/api/serie-a"),
      ])

      const [plData, laData, saData] = await Promise.all([
        plResponse.ok ? plResponse.json() : null,
        laResponse.ok ? laResponse.json() : null,
        saResponse.ok ? saResponse.json() : null,
      ])

      if (plData && !plData.error) setPremierLeague(plData)
      if (laData && !laData.error) setLaLiga(laData)
      if (saData && !saData.error) setSerieA(saData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch league data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeagueData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchLeagueData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const renderLeagueContent = (leagueData: LeagueData | null, leagueName: string, officialUrl: string) => {
    if (!leagueData) {
      return (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Unable to load {leagueName} data</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* League Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{leagueData.league}</h3>
            <p className="text-muted-foreground">Season {leagueData.season}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Official Site
              </a>
            </Button>
            <Badge variant="outline">Updated: {new Date(leagueData.lastUpdated).toLocaleTimeString()}</Badge>
          </div>
        </div>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matches">Recent Matches</TabsTrigger>
            <TabsTrigger value="table">League Table</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            {leagueData.matches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leagueData.matches.slice(0, 6).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent matches available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            {leagueData.standings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{leagueData.league} Table</CardTitle>
                  <CardDescription>Current season standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-8 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      <div>Pos</div>
                      <div className="col-span-2">Team</div>
                      <div className="text-center">MP</div>
                      <div className="text-center">W</div>
                      <div className="text-center">D</div>
                      <div className="text-center">L</div>
                      <div className="text-center">Pts</div>
                    </div>

                    {leagueData.standings.slice(0, 10).map((team: any) => (
                      <div
                        key={team.position}
                        className="grid grid-cols-8 gap-2 py-2 items-center hover:bg-muted/50 rounded"
                      >
                        <div className="font-medium">{team.position}</div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Image
                            src={team.team.crest || "/placeholder.svg?height=24&width=24"}
                            alt={team.team.name}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{team.team.name}</span>
                        </div>
                        <div className="text-center text-sm">{team.playedGames}</div>
                        <div className="text-center text-sm">{team.won || 0}</div>
                        <div className="text-center text-sm">{team.draw || 0}</div>
                        <div className="text-center text-sm">{team.lost || 0}</div>
                        <div className="text-center font-bold text-sm">{team.points}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">League table not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Major European Leagues</h2>
        <Button variant="outline" onClick={fetchLeagueData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <Tabs defaultValue="premier-league" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="premier-league" className="flex items-center space-x-2">
            <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
            <span>Premier League</span>
          </TabsTrigger>
          <TabsTrigger value="la-liga" className="flex items-center space-x-2">
            <span>🇪🇸</span>
            <span>La Liga</span>
          </TabsTrigger>
          <TabsTrigger value="serie-a" className="flex items-center space-x-2">
            <span>🇮🇹</span>
            <span>Serie A</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="premier-league" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : (
            renderLeagueContent(premierLeague, "Premier League", "https://www.premierleague.com")
          )}
        </TabsContent>

        <TabsContent value="la-liga" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : (
            renderLeagueContent(laLiga, "La Liga", "https://www.laliga.com")
          )}
        </TabsContent>

        <TabsContent value="serie-a" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : (
            renderLeagueContent(serieA, "Serie A", "https://www.legaseriea.it")
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
