"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SearchResult {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
  }
}

export function MessageSearch({ roomId, onSelect }: { roomId: string; onSelect: (messageId: string) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const { data } = await supabase
      .from("messages")
      .select("id, content, created_at, profiles!inner(username)")
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .ilike("content", `%${searchQuery}%`)
      .limit(10)

    setResults(data || [])
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          placeholder="Search messages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          onFocus={() => setIsOpen(true)}
          className="flex-1"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => {
                onSelect(result.id)
                setIsOpen(false)
                setQuery("")
              }}
              className="w-full text-left px-4 py-2 hover:bg-muted border-b last:border-b-0 transition-colors"
            >
              <div className="text-sm font-medium">{result.profiles.username}</div>
              <div className="text-xs text-muted-foreground truncate">{result.content}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
