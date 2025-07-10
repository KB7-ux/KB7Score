"use client"

import { useState, useEffect } from "react"
import { Search, Users, MapPin, Calendar, Globe, Trophy } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Team {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
  address: string
  website: string
  founded: number
  clubColors: string
  venue: string
  coach?: { name: string }
  squad?: Array<{
    id: number
    name: string
    position: string
    dateOfBirth: string
    nationality: string
  }>
}

interface Match {
  id: number
  homeTeam: { name: string; crest: string }
  awayTeam: { name: string; crest: string }
  score: { fullTime: { home: number | null; away: number | null } }
  status: string
  utcDate: string
  competition: { name: string }
}

export function TeamSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMatches, setTeamMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const searchTeams = async (query: string) => {
    if (!query.trim()) {
      setTeams([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/teams?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Error searching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: number) => {
    setDetailsLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      const data = await response.json()
      setSelectedTeam(data.team)
      setTeamMatches(data.matches || [])
    } catch (error) {
      console.error("Error fetching team details:", error)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchTeams(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      )}

      {teams.length > 0 && (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {teams.map((team) => (
            <Dialog key={team.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3" onClick={() => fetchTeamDetails(team.id)}>
                      <Image
                        src={team.crest || "/placeholder.svg?height=40&width=40"}
                        alt={team.name}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.shortName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    <Image
                      src={selectedTeam?.crest || "/placeholder.svg?height=48&width=48"}
                      alt={selectedTeam?.name || "Team"}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                    <span>{selectedTeam?.name}</span>
                  </DialogTitle>
                  <DialogDescription>Complete team information and recent matches</DialogDescription>
                </DialogHeader>

                {detailsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                  </div>
                ) : selectedTeam ? (
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="info">Team Info</TabsTrigger>
                      <TabsTrigger value="squad">Squad</TabsTrigger>
                      <TabsTrigger value="matches">Recent Matches</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Trophy className="h-5 w-5" />
                              <span>Club Details</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Founded: {selectedTeam.founded}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{selectedTeam.venue}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={selectedTeam.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-600 hover:underline"
                              >
                                Official Website
                              </a>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Club Colors: </span>
                              <Badge variant="outline">{selectedTeam.clubColors}</Badge>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Address: </span>
                              <span className="text-sm text-muted-foreground">{selectedTeam.address}</span>
                            </div>
                          </CardContent>
                        </Card>

                        {selectedTeam.coach && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                <Users className="h-5 w-5" />
                                <span>Coaching Staff</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">Head Coach: </span>
                                  <span>{selectedTeam.coach.name}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="squad" className="space-y-4">
                      {selectedTeam.squad && selectedTeam.squad.length > 0 ? (
                        <div className="grid gap-2">
                          {selectedTeam.squad.map((player) => (
                            <Card key={player.id}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{player.name}</h4>
                                    <p className="text-sm text-muted-foreground">{player.position}</p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline">{player.nationality}</Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(player.dateOfBirth).getFullYear()}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Squad information not available</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="matches" className="space-y-4">
                      {teamMatches.length > 0 ? (
                        <div className="space-y-3">
                          {teamMatches.map((match) => (
                            <Card key={match.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      src={match.homeTeam.crest || "/placeholder.svg?height=24&width=24"}
                                      alt={match.homeTeam.name}
                                      width={24}
                                      height={24}
                                      className="rounded"
                                    />
                                    <span className="font-medium">{match.homeTeam.name}</span>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold">
                                      {match.score.fullTime.home !== null
                                        ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
                                        : "vs"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(match.utcDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="font-medium">{match.awayTeam.name}</span>
                                    <Image
                                      src={match.awayTeam.crest || "/placeholder.svg?height=24&width=24"}
                                      alt={match.awayTeam.name}
                                      width={24}
                                      height={24}
                                      className="rounded"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 text-center">
                                  <Badge variant="outline" className="text-xs">
                                    {match.competition.name}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No recent matches found</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : null}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  )
}
