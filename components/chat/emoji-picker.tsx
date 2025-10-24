"use client"

import { Button } from "@/components/ui/button"
import { Smile } from "lucide-react"
import { useState } from "react"

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "🚀", "✨", "💯", "🎊"]

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(!isOpen)}>
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-background border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 animate-in fade-in slide-in-from-bottom-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                setIsOpen(false)
              }}
              className="text-xl hover:bg-muted p-1 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
