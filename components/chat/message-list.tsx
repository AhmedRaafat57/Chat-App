"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Edit2, Smile } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  edited_at: string | null
  is_deleted: boolean
  media_urls?: string[]
  profiles: {
    username: string
    avatar_url: string | null
  }[] | {
    username: string
    avatar_url: string | null
  } | null
  message_reactions?: Array<{
    emoji: string
    count: number
    hasUserReacted?: boolean
  }>
}

// Helper function to safely get profile data
const getProfileData = (profiles: any) => {
  if (!profiles) return { username: '', avatar_url: null }
  if (Array.isArray(profiles)) {
    return profiles[0] || { username: '', avatar_url: null }
  }
  return profiles
}

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

export function MessageList({ roomId, currentUserId, highlightedMessageId, setHighlightedMessageId }: { roomId: string; currentUserId: string; highlightedMessageId?: string | null; setHighlightedMessageId?: (id: string | null) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    fetchMessages()

    const handleOptimisticMessage = (event: Event) => {
      const customEvent = event as CustomEvent
      const optimisticMessage = customEvent.detail
      console.log("[v0] Optimistic message received:", optimisticMessage.id)
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === optimisticMessage.id)
        return exists ? prev : [...prev, optimisticMessage]
      })
    }

    window.addEventListener("optimisticMessage", handleOptimisticMessage)

    const setupSubscription = () => {
      const channel = supabase
        .channel(`room:${roomId}:${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log("[v0] New message INSERT event:", payload.new.id)
            fetchSingleMessage(payload.new.id)
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log("[v0] Message UPDATE event:", payload.new.id)
            fetchSingleMessage(payload.new.id)
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_reactions",
          },
          () => {
            console.log("[v0] Reaction INSERT event - refreshing messages")
            fetchMessages()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "message_reactions",
          },
          () => {
            console.log("[v0] Reaction DELETE event - refreshing messages")
            fetchMessages()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Channel subscription status:", status)
          if (status === "CLOSED") {
            console.log("[v0] Subscription closed, attempting to reconnect...")
            setTimeout(setupSubscription, 3000)
          }
        })

      subscriptionRef.current = channel
    }

    setupSubscription()

    const pollInterval = setInterval(() => {
      console.log("[v0] Polling for new messages...")
      fetchMessages()
    }, 5000)

    return () => {
      window.removeEventListener("optimisticMessage", handleOptimisticMessage)
      clearInterval(pollInterval)
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [roomId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        // Use explicit FK to avoid wrong implicit joins
        .select(
          "id, content, user_id, created_at, edited_at, is_deleted, media_urls, profiles:profiles!fk_messages_user_id(username, avatar_url)"
        )
        .eq("room_id", roomId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching messages:", error)
        return
      }

      if (data) {
        console.log("[v0] Fetched messages:", data.length)
        const messagesWithReactions = await Promise.all(
          data.map(async (msg) => {
            const { data: reactions } = await supabase
              .from("message_reactions")
              .select("emoji, user_id")
              .eq("message_id", msg.id)

            const groupedReactions =
              reactions?.reduce(
                (acc, reaction) => {
                  const existing = acc.find((r) => r.emoji === reaction.emoji)
                  if (existing) {
                    existing.count += 1
                    if (reaction.user_id === currentUserId) {
                      existing.hasUserReacted = true
                    }
                  } else {
                    acc.push({ 
                      emoji: reaction.emoji, 
                      count: 1,
                      hasUserReacted: reaction.user_id === currentUserId
                    })
                  }
                  return acc
                },
                [] as Array<{ emoji: string; count: number; hasUserReacted?: boolean }>,
              ) || []

            return {
              ...msg,
              message_reactions: groupedReactions,
            }
          }),
        )
        setMessages(messagesWithReactions as Message[])
      }
    } catch (err) {
      console.error("[v0] Error fetching messages:", err)
    }
    setIsLoading(false)
  }

  const fetchSingleMessage = async (messageId: string, retries = 5) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        // Use explicit FK to avoid wrong implicit joins
        .select(
          "id, content, user_id, created_at, edited_at, is_deleted, media_urls, profiles:profiles!fk_messages_user_id(username, avatar_url)"
        )
        .eq("id", messageId)
        .single()

      if (error) {
        if (retries > 0 && error.code === "PGRST116") {
          console.log(`[v0] Message not found, retrying... (${retries} retries left)`)
          await new Promise((resolve) => setTimeout(resolve, 300))
          return fetchSingleMessage(messageId, retries - 1)
        }
        console.error("[v0] Error fetching single message:", error)
        return
      }

      if (data) {
        console.log("[v0] Fetched single message:", data.id)
        const { data: reactions } = await supabase.from("message_reactions").select("emoji, user_id").eq("message_id", messageId)

        const groupedReactions =
          reactions?.reduce(
            (acc, reaction) => {
              const existing = acc.find((r) => r.emoji === reaction.emoji)
              if (existing) {
                existing.count += 1
                if (reaction.user_id === currentUserId) {
                  existing.hasUserReacted = true
                }
              } else {
                acc.push({ 
                  emoji: reaction.emoji, 
                  count: 1,
                  hasUserReacted: reaction.user_id === currentUserId
                })
              }
              return acc
            },
            [] as Array<{ emoji: string; count: number; hasUserReacted?: boolean }>,
          ) || []

        const messageWithReactions = {
          ...data,
          message_reactions: groupedReactions,
        } as Message

        setMessages((prev) => {
          const exists = prev.find((m) => m.id === messageId)
          if (exists) {
            console.log("[v0] Updating existing message:", messageId)
            return prev.map((m) => (m.id === messageId ? messageWithReactions : m))
          }
          const tempIndex = prev.findIndex((m) => m.id.startsWith("temp-") && m.content === data.content)
          if (tempIndex !== -1) {
            console.log("[v0] Replacing optimistic message with real message:", messageId)
            const updated = [...prev]
            updated[tempIndex] = messageWithReactions
            return updated
          }
          console.log("[v0] Adding new message:", messageId)
          return [...prev, messageWithReactions]
        })
      }
    } catch (err) {
      console.error("[v0] Error fetching single message:", err)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (messageId.startsWith("temp-")) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      return
    }

    try {
      const { error } = await supabase.from("messages").update({ is_deleted: true }).eq("id", messageId)

      if (error) {
        toast({ title: "Error", description: "Failed to delete message", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Message deleted" })
      }
    } catch (err) {
      console.error("[v0] Error deleting message:", err)
    }
  }

  const editMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from("messages")
        .update({ content: editContent, edited_at: new Date().toISOString() })
        .eq("id", messageId)

      if (error) {
        toast({ title: "Error", description: "Failed to edit message", variant: "destructive" })
      } else {
        setEditingId(null)
        setEditContent("")
        toast({ title: "Success", description: "Message updated" })
      }
    } catch (err) {
      console.error("[v0] Error editing message:", err)
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (messageId.startsWith("temp-")) {
      toast({ title: "Info", description: "Wait for message to be sent before reacting", variant: "default" })
      return
    }

    try {
      const { data: existingReaction } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji)
        .single()

      if (existingReaction) {
        await removeReaction(messageId, emoji)
      } else {
        const { error } = await supabase.from("message_reactions").insert([
          {
            message_id: messageId,
            user_id: currentUserId,
            emoji,
          },
        ])

        if (error) {
          console.error("[v0] Reaction error:", error)
          toast({ title: "Error", description: `Failed to add reaction: ${error.message}`, variant: "destructive" })
        }
      }
    } catch (err) {
      console.error("[v0] Unexpected error adding reaction:", err)
    }
  }

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji)

      if (error) {
        toast({ title: "Error", description: "Failed to remove reaction", variant: "destructive" })
      }
    } catch (err) {
      console.error("[v0] Error removing reaction:", err)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => {
          const isCurrentUser = message.user_id === currentUserId
          return (
            <div
              key={message.id}
              className={`flex gap-3 group ${isCurrentUser ? "flex-row-reverse" : "flex-row"} hover:bg-muted/50 p-2 rounded-lg transition`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage 
                  src={getAvatarUrl(getProfileData(message.profiles).username, getProfileData(message.profiles).avatar_url)} 
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                  {getProfileData(message.profiles).username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 min-w-0 ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`flex items-center gap-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="font-semibold text-sm">{getProfileData(message.profiles).username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {message.edited_at && <span className="text-xs text-muted-foreground">(edited)</span>}
                </div>
                {editingId === message.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => editMessage(message.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg mt-1 ${
                        isCurrentUser
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    {message.media_urls && message.media_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.media_urls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url || "/placeholder.svg"}
                            alt="Message media"
                            className="max-w-xs max-h-64 rounded"
                            onError={(e) => {
                              console.error("[v0] Image failed to load:", url)
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {message.message_reactions && message.message_reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.message_reactions.map((reaction: any) => (
                          <button
                            key={reaction.emoji}
                            onClick={() => addReaction(message.id, reaction.emoji)}
                            className={`px-2 py-1 rounded text-sm hover:bg-muted/80 transition ${
                              reaction.hasUserReacted 
                                ? "bg-blue-100 text-blue-700 border border-blue-300" 
                                : "bg-muted"
                            }`}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {currentUserId === message.user_id && !message.id.startsWith("temp-") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(message.id)
                        setEditContent(message.content)
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!message.id.startsWith("temp-") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => addReaction(message.id, "👍")}
                  title="React with 👍"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })
      )}
      <div ref={scrollRef} />
    </div>
  )
}
