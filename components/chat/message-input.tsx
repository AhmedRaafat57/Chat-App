"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Send, Paperclip, Bold, Italic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import React from "react"

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]

export function MessageInput({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("[v0] Auth error:", error)
          toast({ title: "Error", description: "Failed to get user", variant: "destructive" })
          return
        }
        setCurrentUserId(data.user?.id || null)
      } catch (err) {
        console.error("[v0] Unexpected error getting user:", err)
      }
    }
    getUser()
  }, [supabase, toast])

  const handleTyping = async () => {
    if (!currentUserId) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    try {
      await supabase.from("typing_indicators").upsert(
        {
          room_id: roomId,
          user_id: currentUserId,
        },
        { onConflict: "room_id,user_id" },
      )
    } catch (err) {
      console.error("[v0] Typing indicator error:", err)
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase.from("typing_indicators").delete().eq("room_id", roomId).eq("user_id", currentUserId)
      } catch (err) {
        console.error("[v0] Error clearing typing indicator:", err)
      }
    }, 3000)
  }

  const applyFormatting = (format: "bold" | "italic") => {
    if (format === "bold") {
      setMessage((prev) => `${prev}**text**`)
      setIsBold(!isBold)
    } else if (format === "italic") {
      setMessage((prev) => `${prev}_text_`)
      setIsItalic(!isItalic)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const mediaUrls: string[] = []
    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("message-media").upload(`${roomId}/${fileName}`, file)

      if (error) {
        toast({ title: "Error", description: "Failed to upload media", variant: "destructive" })
      } else {
        const { data } = supabase.storage.from("message-media").getPublicUrl(`${roomId}/${fileName}`)
        mediaUrls.push(data.publicUrl)
      }
    }

    if (mediaUrls.length > 0) {
      setMessage((prev) => prev || "📸 Image attached")
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast({ title: "Error", description: "Message cannot be empty", variant: "destructive" })
      return
    }

    if (!currentUserId) {
      toast({ title: "Error", description: "You must be logged in to send messages", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        toast({ title: "Error", description: "User not authenticated", variant: "destructive" })
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.user.id)
        .single()

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        room_id: roomId,
        user_id: user.user.id,
        content: message,
        is_deleted: false,
        created_at: new Date().toISOString(),
        edited_at: null,
        profiles: {
          username: profile?.username || "Unknown",
          avatar_url: profile?.avatar_url || null,
        },
        message_reactions: [],
      }

      window.dispatchEvent(
        new CustomEvent("optimisticMessage", {
          detail: optimisticMessage,
        }),
      )

      const { error } = await supabase.from("messages").insert([
        {
          room_id: roomId,
          user_id: user.user.id,
          content: message,
          is_deleted: false,
        },
      ])

      if (error) {
        console.error("[v0] Message send error:", error)
        toast({ title: "Error", description: `Failed to send message: ${error.message}`, variant: "destructive" })
      } else {
        setMessage("")
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        await supabase.from("typing_indicators").delete().eq("room_id", roomId).eq("user_id", user.user.id)
      }
    } catch (err) {
      console.error("[v0] Unexpected error sending message:", err)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSendMessage} className="flex flex-col gap-2 p-4 border-t bg-background">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={isBold ? "default" : "outline"}
          size="sm"
          onClick={() => applyFormatting("bold")}
          title="Bold"
          className="transition-all hover:scale-105"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isItalic ? "default" : "outline"}
          size="sm"
          onClick={() => applyFormatting("italic")}
          title="Italic"
          className="transition-all hover:scale-105"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <label className="flex items-center">
          <input type="file" multiple accept="image/*,video/*,.gif" onChange={handleMediaUpload} className="hidden" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.currentTarget.parentElement?.querySelector('input[type="file"]')?.click()
            }}
            title="Attach media"
            className="transition-all hover:scale-105"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </label>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Type a message... (supports **bold** and _italic_)"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleTyping()
          }}
          disabled={isLoading || !currentUserId}
          className="transition-all focus:ring-2"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !currentUserId}
          className="transition-all hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
