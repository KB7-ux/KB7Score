"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw, Trophy, AlertCircle, Wifi, WifiOff, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLiveMatches, useStandings, useCompetitions } from "@/hooks/use-live-data"
import { MatchCard } from "@/components/match-card"
import { TeamSearch } from "@/components/team-search"
import { LeagueSelector } from "@/components/league-selector"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function KB7ScorePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const {
    matches,
    liveMatches,
    loading: matchesLoading,
    error: matchesError,
    rateLimited,
    waitTime,
    refetch,
  } = useLiveMatches()
  const { standings, loading: standingsLoading, error: standingsError } = useStandings()
  const { competitions, loading: competitionsLoading, error: competitionsError } = useCompetitions()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [apiConnected, setApiConnected] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
      setApiConnected(!matchesError && !rateLimited)
    }, 30000)
    return () => clearInterval(interval)
  }, [matchesError, rateLimited])

  const today = new Date().toDateString()
  const selectedDateStr = selectedDate.toDateString()

  const todayMatches = matches.filter((match) => new Date(match.utcDate).toDateString() === today)
  const selectedDateMatches = matches.filter((match) => new Date(match.utcDate).toDateString() === selectedDateStr)

  const upcomingMatches = matches.filter((match) => match.status === "TIMED" && new Date(match.utcDate) > new Date())
  const finishedMatches = matches.filter((match) => match.status === "FINISHED")

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    setSelectedDate(newDate)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - KB7Score Branding */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-red-500" />
                <span className="text-2xl font-bold">KB7Score</span>
              </Link>

              {/* Sport Navigation */}
              <nav className="hidden md:flex space-x-1">
                <Button variant="default" size="sm" className="bg-red-500 hover:bg-red-600">
                  Football
                </Button>
                <Button variant="ghost" size="sm">
                  Hockey
                </Button>
                <Button variant="ghost" size="sm">
                  Basketball
                </Button>
                <Button variant="ghost" size="sm">
                  Tennis
                </Button>
                <Button variant="ghost" size="sm">
                  Cricket
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refetch} disabled={matchesLoading || rateLimited}>
                <RefreshCw className={`h-4 w-4 ${matchesLoading ? "animate-spin" : ""}`} />
                {rateLimited && waitTime > 0 && <span className="ml-1">{waitTime}s</span>}
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-center py-3 border-t">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge
                variant={selectedDateStr === today ? "default" : "outline"}
                className={selectedDateStr === today ? "bg-red-500" : ""}
              >
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(selectedDate)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Rate Limit Warning */}
        {rateLimited && (
          <Alert className="mb-4 max-w-2xl mx-auto">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Rate Limited:</strong> API requests are temporarily limited.
              {waitTime > 0 && <span> Please wait {waitTime} seconds before refreshing.</span>}
              <br />
              <small>Data is cached and will update automatically when available.</small>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {matchesError && !rateLimited && (
          <Alert className="mb-4 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Error:</strong> {matchesError}
              <br />
              <small>Using cached data when available.</small>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center space-x-1">
            {apiConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Total matches: {matches.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Live: {liveMatches.length}</span>
          </div>
          {rateLimited && (
            <div className="flex items-center space-x-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span>Rate limited</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="live" className="relative">
              Live
              {liveMatches.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {liveMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {matchesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : liveMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Live Matches</h3>
                  <p className="text-muted-foreground">
                    {matches.length > 0
                      ? "No matches are currently being played live."
                      : rateLimited
                        ? "Data temporarily unavailable due to rate limiting."
                        : "Unable to load match data. Please check your connection."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            {selectedDateMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedDateMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Matches</h3>
                  <p className="text-muted-foreground">No matches scheduled for {formatDate(selectedDate)}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.slice(0, 12).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Matches</h3>
                  <p className="text-muted-foreground">All upcoming matches are displayed here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {finishedMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {finishedMatches.slice(0, 12).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Results</h3>
                  <p className="text-muted-foreground">Recent match results will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leagues" className="space-y-4">
            <LeagueSelector />
          </TabsContent>

          <TabsContent value="standings" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premier League 2024/25</CardTitle>
                  <CardDescription>Current season standings - Real-time data (cached)</CardDescription>
                </CardHeader>
                <CardContent>
                  {standingsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : standings.length > 0 ? (
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

                      {standings.map((team) => (
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
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {standingsError ? `Error: ${standingsError}` : "Unable to load standings data"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Competitions Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Major Competitions</CardTitle>
                  <CardDescription>Available leagues and tournaments</CardDescription>
                </CardHeader>
                <CardContent>
                  {competitionsLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : competitions.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {competitions.map((comp) => (
                        <div key={comp.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Image
                            src={comp.emblem || "/placeholder.svg?height=32&width=32"}
                            alt={comp.name}
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div>
                            <h4 className="font-medium">{comp.name}</h4>
                            <p className="text-sm text-muted-foreground">{comp.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {competitionsError ? `Error: ${competitionsError}` : "Unable to load competitions data"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Search</CardTitle>
                <CardDescription>Search for detailed team information, squad, and recent matches</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamSearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
