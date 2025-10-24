"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface TypingUser {
  username: string
}

export function TypingIndicator({ roomId, currentUsername }: { roomId: string; currentUsername: string }) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const { data } = await supabase
            .from("typing_indicators")
            .select("*, profiles!inner(username)")
            .eq("room_id", roomId)

          setTypingUsers(
            data
              ?.filter((t: any) => t.profiles.username !== currentUsername)
              .map((t: any) => ({ username: t.profiles.username })) || [],
          )
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, currentUsername])

  if (typingUsers.length === 0) return null

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground animate-pulse">
      <span className="inline-flex gap-1">
        {typingUsers.map((u) => u.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
        <span className="inline-flex gap-0.5">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
            .
          </span>
          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
            .
          </span>
        </span>
      </span>
    </div>
  )
}
