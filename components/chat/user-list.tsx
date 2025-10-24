"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Function to get specific avatar for known users
const getAvatarUrl = (username: string, avatarUrl: string | null) => {
  if (avatarUrl) return avatarUrl
  
  // Specific avatars for Ahmed and Ali
  if (username?.toLowerCase() === 'ahmed') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=54c5e6e3-13a9-4285-9e17-0e57b0332e2c'
  }
  if (username?.toLowerCase() === 'ali') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=9ca03876-8625-4451-ad6f-02e143dacfc7'
  }
  
  // Default avatar for other users
  return `https://api.dicebear.com/7.x/personas/svg?seed=${username || 'user'}&backgroundColor=transparent&size=64`
}

interface RoomUser {
  id: string
  username: string
  avatar_url: string | null
  status: string
}

export function UserList({ roomId }: { roomId: string }) {
  const [users, setUsers] = useState<RoomUser[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()

    const channel = supabase
      .channel(`room-users:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchUsers(),
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("room_members")
      .select("user_id, profiles!inner(id, username, avatar_url, status)")
      .eq("room_id", roomId)

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return
    }

    setUsers(
      data?.map((m: any) => ({
        id: m.profiles.id,
        username: m.profiles.username,
        avatar_url: m.profiles.avatar_url,
        status: m.profiles.status || "offline",
      })) || [],
    )
  }

  return (
    <div className="w-48 border-l bg-muted/30 flex flex-col hidden md:flex">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Members ({users.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={getAvatarUrl(user.username, user.avatar_url)} 
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
              </div>
              <div
                className={`h-2 w-2 rounded-full transition-colors ${user.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
