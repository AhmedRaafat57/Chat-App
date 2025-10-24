import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        // Check if profile exists
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (!profile) {
          // Create profile for OAuth users
          await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: data.user.email?.split("@")[0] || "user",
              status: "online",
            },
          ])
        }
      }

      return NextResponse.redirect(new URL("/chat", request.url))
    }
  }

  return NextResponse.redirect(new URL("/auth/error", request.url))
}
