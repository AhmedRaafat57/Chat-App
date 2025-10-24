import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestUser() {
  try {
    console.log("[Real Time] Creating test user: ahmed@gmail.com")

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "ahmed@gmail.com",
      password: "123456",
      email_confirm: true,
    })

    if (authError) {
      console.error("[Real Time] Auth error:", authError.message)
      return
    }

    const userId = authData.user.id
    console.log("[Real Time] Auth user created with ID:", userId)

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username: "Ahmed",
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      status: "online",
    })

    if (profileError) {
      console.error("[Real Time] Profile error:", profileError.message)
      return
    }

    console.log("[Real Time] ✅ Test user created successfully!")
    console.log("[Real Time] Email: ahmed@gmail.com")
    console.log("[Real Time] Password: 123456")
  } catch (error) {
    console.error("[Real Time] Error:", error)
  }
}

seedTestUser()
