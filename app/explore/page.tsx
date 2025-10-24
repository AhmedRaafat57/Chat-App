"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Users, MessageCircle, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Room {
  id: string
  name: string
  description?: string
  created_at: string
  member_count?: number
}

export default function ExplorePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/auth/login")
        return
      }

      const { data: roomsData } = await supabase.from("rooms").select("*").order("created_at", { ascending: false })

      setRooms(roomsData || [])
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const joinRoom = async (roomId: string) => {
    const { data: user } = await supabase.auth.getUser()
    if (user.user) {
      await supabase.from("room_members").upsert({
        room_id: roomId,
        user_id: user.user.id,
      })
      router.push(`/chat/${roomId}`)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Explore Rooms</h1>
            <p className="text-muted-foreground">Discover and join chat rooms</p>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No rooms found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {room.name}
                    </CardTitle>
                    <CardDescription>{room.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{room.member_count || 0} members</span>
                    </div>
                    <Button className="w-full" onClick={() => joinRoom(room.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Join Room
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
