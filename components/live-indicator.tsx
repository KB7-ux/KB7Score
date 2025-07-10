"use client"

import { Badge } from "@/components/ui/badge"

export function LiveIndicator() {
  return (
    <Badge variant="destructive" className="animate-pulse">
      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping" />
      LIVE
    </Badge>
  )
}
