"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

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

export function ChatHeader() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.user.id)
          .single()

        if (profile) {
          setUsername(profile.username)
          setAvatarUrl(profile.avatar_url)
        }
      }
    }

    fetchUserProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!mounted) return null

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Real Time
      </h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="transition-transform hover:scale-110"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={getAvatarUrl(username, avatarUrl)}
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
