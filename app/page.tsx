import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    redirect("/chat")
  } else {
    redirect("/auth/login")
  }
}
