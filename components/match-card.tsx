"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"
import { LiveIndicator } from "./live-indicator"

interface Match {
  id: number
  homeTeam: { name: string; crest: string }
  awayTeam: { name: string; crest: string }
  score: { fullTime: { home: number | null; away: number | null } }
  status: string
  minute?: number
  utcDate?: string
  competition: { name: string }
  venue?: string
}

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === "IN_PLAY"
  const isFinished = match.status === "FINISHED"
  const isScheduled = match.status === "TIMED"

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {match.competition.name}
          </Badge>
          {isLive && <LiveIndicator />}
          {isFinished && <Badge variant="secondary">FT</Badge>}
        </div>

        <div className="space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src={match.homeTeam.crest || "/placeholder.svg?height=32&width=32"}
                alt={match.homeTeam.name}
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-semibold">{match.homeTeam.name}</span>
            </div>
            <div className="text-2xl font-bold">{match.score.fullTime.home ?? "-"}</div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src={match.awayTeam.crest || "/placeholder.svg?height=32&width=32"}
                alt={match.awayTeam.name}
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-semibold">{match.awayTeam.name}</span>
            </div>
            <div className="text-2xl font-bold">{match.score.fullTime.away ?? "-"}</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            {isLive && match.minute && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{match.minute}'</span>
              </div>
            )}
            {isScheduled && match.utcDate && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(match.utcDate)}</span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
