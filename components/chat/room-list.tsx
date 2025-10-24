// "use client"

// import type React from "react"

// import { createClient } from "@/lib/supabase/client"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { Plus, Trash2, MoreVertical } from "lucide-react"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { useToast } from "@/hooks/use-toast"

// interface Room {
//   id: string
//   name: string
//   description: string
// }

// export function RoomList({ selectedRoomId }: { selectedRoomId?: string }) {
//   const [rooms, setRooms] = useState<Room[]>([])
//   const [newRoomName, setNewRoomName] = useState("")
//   const [isCreating, setIsCreating] = useState(false)
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null)
//   const supabase = createClient()
//   const { toast } = useToast()

//   useEffect(() => {
//     fetchRooms()
//     getCurrentUser()

//     const channel = supabase
//       .channel("rooms")
//       .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
//         console.log("[v0] Room change detected:", payload.eventType, payload)
//         // Only refresh on INSERT or UPDATE, not DELETE (we handle DELETE manually)
//         if (payload.eventType !== 'DELETE') {
//           fetchRooms()
//         }
//       })
//       .subscribe()

//     return () => {
//       channel.unsubscribe()
//     }
//   }, [])

//   const getCurrentUser = async () => {
//     const { data } = await supabase.auth.getUser()
//     setCurrentUserId(data.user?.id || null)
//   }

//   const fetchRooms = async () => {
//     console.log("[v0] Fetching rooms...")
//     const { data, error } = await supabase.from("rooms").select("*").order("created_at", { ascending: false })
//     console.log("[v0] Fetched rooms:", data?.length || 0, "rooms")
//     if (error) console.error("[v0] Error fetching rooms:", error)
//     setRooms(data || [])
//   }

//   const createRoom = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!newRoomName.trim()) return

//     setIsCreating(true)
//     const { data: user } = await supabase.auth.getUser()

//     if (user.user) {
//       const { error } = await supabase.from("rooms").insert([
//         {
//           name: newRoomName,
//           created_by: user.user.id,
//         },
//       ])

//       if (!error) {
//         setNewRoomName("")
//         fetchRooms()
//       }
//     }
//     setIsCreating(false)
//   }

//   const deleteRoom = async (roomId: string) => {
//     console.log("[v0] Attempting to delete room:", roomId)
//     try {
//       const { error } = await supabase.from("rooms").delete().eq("id", roomId)
      
//       if (error) {
//         console.error("[v0] Room deletion error:", error)
//         toast({ 
//           title: "Error", 
//           description: `Failed to delete room: ${error.message}`, 
//           variant: "destructive" 
//         })
//       } else {
//         console.log("[v0] Room deleted successfully, updating UI...")
//         toast({ title: "Success", description: "Room deleted" })
        
//         // Immediately remove from local state
//         setRooms(prevRooms => {
//           const updatedRooms = prevRooms.filter(room => room.id !== roomId)
//           console.log("[v0] Removed room from local state, remaining:", updatedRooms.length)
//           return updatedRooms
//         })
        
//         // Don't fetch rooms immediately to avoid race condition
//         console.log("[v0] Room removed from UI, skipping database fetch to avoid race condition")
//       }
//     } catch (err) {
//       console.error("[v0] Unexpected error deleting room:", err)
//       toast({ title: "Error", description: "Failed to delete room", variant: "destructive" })
//     }
//   }

//   return (
//     <div className="flex flex-col gap-4 h-full">
//       <form onSubmit={createRoom} className="flex gap-2">
//         <Input
//           placeholder="New room name..."
//           value={newRoomName}
//           onChange={(e) => setNewRoomName(e.target.value)}
//           disabled={isCreating}
//         />
//         <Button type="submit" size="icon" disabled={isCreating}>
//           <Plus className="h-4 w-4" />
//         </Button>
//       </form>

//       <div className="flex-1 overflow-y-auto space-y-2">
//         {rooms.length === 0 ? (
//           <div className="text-sm text-muted-foreground text-center py-4">No rooms yet. Create one!</div>
//         ) : (
//           rooms.map((room) => (
//             <div key={room.id} className="flex items-center gap-2">
//               <Link href={`/chat/${room.id}`} className="flex-1">
//                 <Button variant={selectedRoomId === room.id ? "default" : "ghost"} className="w-full justify-start">
//                   {room.name}
//                 </Button>
//               </Link>
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost" size="icon" className="h-8 w-8">
//                     <MoreVertical className="h-4 w-4" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem 
//                     onClick={() => deleteRoom(room.id)} 
//                     className="text-destructive"
//                   >
//                     <Trash2 className="h-4 w-4 mr-2" />
//                     Delete Room
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   )
// }





















//////////////////////
"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Room {
  id: string
  name: string
  description: string
}

export function RoomList({ selectedRoomId }: { selectedRoomId?: string }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

    useEffect(() => {
    fetchRooms()
    getCurrentUser()

    const channel = supabase
      .channel("rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
        console.log("[v0] Room change detected:", payload.eventType, payload)
        // Only refresh on INSERT or UPDATE, not DELETE (we handle DELETE manually)
        if (payload.eventType !== 'DELETE') {
          fetchRooms()
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser()
    setCurrentUserId(data.user?.id || null)
  }

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error) setRooms(data || [])
  }

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    setIsCreating(true)
    const { data: user } = await supabase.auth.getUser()

    if (user.user) {
      const { error } = await supabase.from("rooms").insert([
        {
          name: newRoomName,
          created_by: user.user.id,
        },
      ])

      if (!error) {
        setNewRoomName("")
        fetchRooms()
      }
    }
    setIsCreating(false)
  }

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId)
      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete room: ${error.message}`,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: "Room deleted" })
        setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId))
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete room", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col h-full p-4 bg-gradient-to-b from-muted/30 to-background rounded-xl border shadow-sm">
      {/* Header */}
      <h2 className="text-lg font-semibold mb-2">Chat Rooms</h2>

      {/* Create room input */}
      <form
        onSubmit={createRoom}
        className="flex gap-2 items-center bg-muted/40 rounded-lg p-2 shadow-inner"
      >
        <Input
          placeholder="Enter a new room name..."
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          disabled={isCreating}
          className="flex-1 rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isCreating}
          className="rounded-lg transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 custom-scrollbar">
        {rooms.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg">
            No rooms yet — create one!
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className={`group flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                selectedRoomId === room.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50"
              }`}
            >
              <Link href={`/chat/${room.id}`} className="flex-1">
                <Button
                  variant={selectedRoomId === room.id ? "default" : "ghost"}
                  className={`w-full justify-start text-left font-medium truncate ${
                    selectedRoomId === room.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted/80"
                  }`}
                >
                  {room.name}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-muted"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => deleteRoom(room.id)}
                    className="text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Room
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
