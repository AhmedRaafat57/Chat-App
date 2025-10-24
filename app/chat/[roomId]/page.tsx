"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { RoomList } from "@/components/chat/room-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { ChatHeader } from "@/components/chat/header"
import { UserList } from "@/components/chat/user-list"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { MessageSearch } from "@/components/chat/message-search"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function RoomPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [roomName, setRoomName] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState("")
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/auth/login")
      } else {
        setCurrentUserId(data.user.id)
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).single()
        if (profile) {
          setCurrentUsername(profile.username)
        }
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await supabase.from("rooms").select("name").eq("id", roomId).single()

        if (data) {
          setRoomName(data.name)
          if (currentUserId) {
            const { error } = await supabase.from("room_members").upsert(
              {
                room_id: roomId,
                user_id: currentUserId,
              },
              { onConflict: "room_id,user_id" },
            )
            if (error) {
              console.error("[v0] Error joining room:", error)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching room:", error)
      }
    }

    if (currentUserId) {
      fetchRoom()
    }
  }, [roomId, currentUserId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:flex md:w-64 flex-col border rounded-lg p-4">
          <RoomList selectedRoomId={roomId} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">{roomName}</h2>
          </div>

          <div className="hidden md:block p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{roomName}</h2>
              <MessageSearch roomId={roomId} onSelect={setHighlightedMessageId} />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col">
              {currentUserId && (
                <MessageList 
                  roomId={roomId} 
                  currentUserId={currentUserId} 
                  highlightedMessageId={highlightedMessageId}
                  setHighlightedMessageId={setHighlightedMessageId}
                />
              )}
              {currentUsername && <TypingIndicator roomId={roomId} currentUsername={currentUsername} />}
              <MessageInput roomId={roomId} />
            </div>

            <UserList roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  )
}


////////////////////////////////////////////////////////




























// "use client";

// import { motion } from "framer-motion";
// import { createClient } from "@/lib/supabase/client";
// import { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { RoomList } from "@/components/chat/room-list";
// import { MessageList } from "@/components/chat/message-list";
// import { MessageInput } from "@/components/chat/message-input";
// import { ChatHeader } from "@/components/chat/header";
// import { UserList } from "@/components/chat/user-list";
// import { TypingIndicator } from "@/components/chat/typing-indicator";
// import { MessageSearch } from "@/components/chat/message-search";
// import { Button } from "@/components/ui/button";
// import { ChevronLeft, Circle } from "lucide-react";
// import { Spinner } from "@/components/ui/spinner";

// export default function RoomPage() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [roomName, setRoomName] = useState("");
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [currentUsername, setCurrentUsername] = useState("");
//   const [highlightedMessageId, setHighlightedMessageId] =
//     useState<string | null>(null);
//   const router = useRouter();
//   const params = useParams();
//   const roomId = params.roomId as string;
//   const supabase = createClient();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const { data } = await supabase.auth.getUser();
//       if (!data.user) {
//         router.push("/auth/login");
//       } else {
//         setCurrentUserId(data.user.id);
//         const { data: profile } = await supabase
//           .from("profiles")
//           .select("username")
//           .eq("id", data.user.id)
//           .single();
//         if (profile) setCurrentUsername(profile.username);
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, []);

//   useEffect(() => {
//     const fetchRoom = async () => {
//       try {
//         const { data } = await supabase
//           .from("rooms")
//           .select("name")
//           .eq("id", roomId)
//           .single();

//         if (data) {
//           setRoomName(data.name);
//           if (currentUserId) {
//             const { error } = await supabase.from("room_members").upsert(
//               { room_id: roomId, user_id: currentUserId },
//               { onConflict: "room_id,user_id" }
//             );
//             if (error) console.error("Error joining room:", error);
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching room:", error);
//       }
//     };
//     if (currentUserId) fetchRoom();
//   }, [roomId, currentUserId]);

//   if (isLoading)
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-950">
//         <Spinner />
//       </div>
//     );

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100">
//       {/* Header */}
//       <motion.div
//         initial={{ y: -30, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         className="border-b border-gray-800 bg-gray-900/80 shadow-md backdrop-blur-lg"
//       >
//         <div className="flex items-center justify-between p-4">
//           <ChatHeader />
//           <div className="flex items-center gap-2 text-sm text-gray-400">
//             <Circle className="w-3 h-3 text-green-500 fill-green-500" />
//             <span>Online</span>
//           </div>
//         </div>
//       </motion.div>

//       {/* Main area */}
//       <div className="flex flex-1 overflow-hidden gap-4 p-4">
//         {/* Sidebar */}
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.1 }}
//           className="hidden md:flex md:w-64 flex-col bg-gray-900/60 border border-gray-800 rounded-2xl p-4 shadow-inner backdrop-blur-md"
//         >
//           <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
//             Rooms
//           </h3>
//           <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
//             <RoomList selectedRoomId={roomId} />
//           </div>
//         </motion.div>

//         {/* Chat window */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="flex-1 flex flex-col bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md"
//         >
//           {/* Mobile Header */}
//           <div className="flex items-center gap-2 p-3 border-b border-gray-800 md:hidden bg-gray-900/80">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => router.push("/chat")}
//               className="text-gray-300 hover:text-white"
//             >
//               <ChevronLeft className="h-5 w-5" />
//             </Button>
//             <h2 className="font-semibold text-gray-100">{roomName}</h2>
//           </div>

//           {/* Desktop Header */}
//           <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/80">
//             <h2 className="font-semibold text-lg text-gray-100">
//               {roomName}
//             </h2>
//             <MessageSearch
//               roomId={roomId}
//               onSelect={setHighlightedMessageId}
//             />
//           </div>

//           {/* Chat body */}
//           <div className="flex flex-1 overflow-hidden">
//             <div className="flex-1 flex flex-col relative">
//               {/* Messages */}
//               <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 px-4 py-3 space-y-2">
//                 {currentUserId && (
//                   <MessageList
//                     roomId={roomId}
//                     currentUserId={currentUserId}
//                     highlightedMessageId={highlightedMessageId}
//                   />
//                 )}
//               </div>

//               {/* Typing Indicator */}
//               {currentUsername && (
//                 <div className="px-4 pb-2">
//                   <TypingIndicator
//                     roomId={roomId}
//                     currentUsername={currentUsername}
//                   />
//                 </div>
//               )}

//               {/* Input */}
//               <div className="border-t border-gray-800 bg-gray-900/80 p-3 backdrop-blur-md">
//                 <MessageInput roomId={roomId} />
//               </div>
//             </div>

//             {/* Users */}
//             <motion.div
//               initial={{ x: 20, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               transition={{ delay: 0.2 }}
//               className="hidden lg:flex flex-col w-60 border-l border-gray-800 bg-gray-900/60 rounded-r-2xl p-4"
//             >
//               <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
//                 Online
//               </h3>
//               <UserList roomId={roomId} />
//             </motion.div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////////////////////


















// "use client"

// import { createClient } from "@/lib/supabase/client"
// import { useEffect, useState } from "react"
// import { useRouter, useParams } from "next/navigation"
// import { RoomList } from "@/components/chat/room-list"
// import { MessageList } from "@/components/chat/message-list"
// import { MessageInput } from "@/components/chat/message-input"
// import { ChatHeader } from "@/components/chat/header"
// import { UserList } from "@/components/chat/user-list"
// import { TypingIndicator } from "@/components/chat/typing-indicator"
// import { MessageSearch } from "@/components/chat/message-search"
// import { Button } from "@/components/ui/button"
// import { ChevronLeft, Users } from "lucide-react"
// import { Spinner } from "@/components/ui/spinner"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// export default function RoomPage() {
//   // State and setup
//   const [isLoading, setIsLoading] = useState(true)
//   const [roomName, setRoomName] = useState("Loading...")
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null)
//   const [currentUsername, setCurrentUsername] = useState("")
//   const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

//   const router = useRouter()
//   const params = useParams()
//   const roomId = params.roomId as string
//   const supabase = createClient()

//   // Authentication and profile
//   useEffect(() => {
//     const checkAuth = async () => {
//       const { data } = await supabase.auth.getUser()
//       if (!data.user) {
//         router.push("/auth/login")
//       } else {
//         setCurrentUserId(data.user.id)

//         const { data: profile } = await supabase
//           .from("profiles")
//           .select("username")
//           .eq("id", data.user.id)
//           .single()

//         if (profile) {
//           setCurrentUsername(profile.username)
//         }

//         setIsLoading(false)
//       }
//     }

//     checkAuth()
//   }, [])

//   // Fetch room and join member
//   useEffect(() => {
//     const fetchRoom = async () => {
//       try {
//         const { data } = await supabase
//           .from("rooms")
//           .select("name")
//           .eq("id", roomId)
//           .single()

//         if (data) {
//           setRoomName(data.name)

//           if (currentUserId) {
//             const { error } = await supabase
//               .from("room_members")
//               .upsert(
//                 {
//                   room_id: roomId,
//                   user_id: currentUserId,
//                 },
//                 { onConflict: "room_id,user_id" },
//               )

//             if (error) {
//               console.error("[v0] Error joining room:", error)
//             }
//           }
//         }
//       } catch (error) {
//         console.error("[v0] Error fetching room:", error)
//       }
//     }

//     if (currentUserId) {
//       fetchRoom()
//     }
//   }, [roomId, currentUserId])

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Spinner />
//       </div>
//     )
//   }

//   // Main render
//   return (
//     <div className="flex flex-col h-screen bg-gray-50/50 dark:bg-gray-950/50">
//       {/* Header */}
//       <ChatHeader />

//       <div className="flex flex-1 overflow-hidden p-0 sm:p-4">
//         {/* Sidebar (Desktop) */}
//         <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-800 shadow-lg rounded-none md:rounded-l-xl">
//           <div className="p-4 border-b dark:border-gray-800">
//             <h3 className="font-bold text-xl">Chats</h3>
//           </div>
//           <RoomList selectedRoomId={roomId} />
//         </aside>

//         {/* Chat Container */}
//         <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 shadow-xl rounded-none md:rounded-r-xl overflow-hidden">
//           {/* Chat Header */}
//           <div className="flex items-center justify-between p-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shadow-sm">
//             <div className="flex items-center gap-3">
//               {/* Back button (Mobile) */}
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => router.push("/chat")}
//                 className="md:hidden"
//               >
//                 <ChevronLeft className="h-5 w-5" />
//               </Button>

//               <h2 className="font-bold text-xl truncate">{roomName}</h2>
//             </div>

//             {/* Search (Desktop) + User List (Mobile) */}
//             <div className="flex items-center gap-2">
//               <div className="hidden sm:block">
//                 <MessageSearch
//                   roomId={roomId}
//                   onSelect={setHighlightedMessageId}
//                 />
//               </div>

//               <Sheet>
//                 <SheetTrigger asChild>
//                   <Button variant="ghost" size="icon" className="md:hidden">
//                     <Users className="h-5 w-5" />
//                   </Button>
//                 </SheetTrigger>
//                 <SheetContent side="right" className="p-0">
//                   <div className="h-full flex flex-col pt-10">
//                     <h3 className="p-4 font-semibold border-b">Room Members</h3>
//                     <UserList roomId={roomId} />
//                   </div>
//                 </SheetContent>
//               </Sheet>
//             </div>
//           </div>

//           {/* Chat Content */}
//           <div className="flex flex-1 overflow-hidden">
//             {/* Messages + Input */}
//             <div className="flex-1 flex flex-col h-full">
//               <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {currentUserId && (
//                   <MessageList
//                     roomId={roomId}
//                     currentUserId={currentUserId}
//                     highlightedMessageId={highlightedMessageId}
//                     setHighlightedMessageId={setHighlightedMessageId}
//                   />
//                 )}
//               </div>

//               {/* Typing Indicator + Input */}
//               <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900/80">
//                 {currentUsername && (
//                   <TypingIndicator
//                     roomId={roomId}
//                     currentUsername={currentUsername}
//                   />
//                 )}
//                 <MessageInput roomId={roomId} />
//               </div>
//             </div>

//             {/* User List (Desktop) */}
//             <aside className="hidden md:block md:w-64 border-l dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto">
//               <h3 className="font-semibold mb-4 border-b pb-2">Room Members</h3>
//               <UserList roomId={roomId} />
//             </aside>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

































// "use client"

// import { useEffect, useState } from "react"
// import { useRouter, useParams } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"

// import { RoomList } from "@/components/chat/room-list"
// import { MessageList } from "@/components/chat/message-list"
// import { MessageInput } from "@/components/chat/message-input"
// import { ChatHeader } from "@/components/chat/header"
// import { UserList } from "@/components/chat/user-list"
// import { TypingIndicator } from "@/components/chat/typing-indicator"
// import { MessageSearch } from "@/components/chat/message-search"

// import { Button } from "@/components/ui/button"
// import { Spinner } from "@/components/ui/spinner"
// import { ChevronLeft } from "lucide-react"

// export default function RoomPage() {
//   const [isLoading, setIsLoading] = useState(true)
//   const [roomName, setRoomName] = useState("")
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null)
//   const [currentUsername, setCurrentUsername] = useState("")
//   const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

//   const router = useRouter()
//   const params = useParams()
//   const roomId = params.roomId as string
//   const supabase = createClient()

//   // ------------------------------
//   // التحقق من المستخدم وتسجيل الدخول
//   // ------------------------------
//   useEffect(() => {
//     const checkAuth = async () => {
//       const { data } = await supabase.auth.getUser()

//       if (!data.user) {
//         router.push("/auth/login")
//         return
//       }

//       setCurrentUserId(data.user.id)

//       // جلب اسم المستخدم من جدول profiles
//       const { data: profile } = await supabase
//         .from("profiles")
//         .select("username") // يمكن لاحقًا إضافة avatar_url هنا
//         .eq("id", data.user.id)
//         .single()

//       if (profile) setCurrentUsername(profile.username)
//       setIsLoading(false)
//     }

//     checkAuth()
//   }, [])

//   // ------------------------------
//   // جلب معلومات الغرفة وتسجيل العضو فيها
//   // ------------------------------
//   useEffect(() => {
//     const fetchRoom = async () => {
//       try {
//         const { data } = await supabase
//           .from("rooms")
//           .select("name")
//           .eq("id", roomId)
//           .single()

//         if (data) {
//           setRoomName(data.name)

//           if (currentUserId) {
//             const { error } = await supabase.from("room_members").upsert(
//               {
//                 room_id: roomId,
//                 user_id: currentUserId,
//               },
//               { onConflict: "room_id,user_id" },
//             )

//             if (error) console.error("[v0] Error joining room:", error)
//           }
//         }
//       } catch (error) {
//         console.error("[v0] Error fetching room:", error)
//       }
//     }

//     if (currentUserId) fetchRoom()
//   }, [roomId, currentUserId])

//   // ------------------------------
//   // شاشة تحميل أثناء التحقق من المستخدم
//   // ------------------------------
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Spinner />
//       </div>
//     )
//   }

//   // ------------------------------
//   // واجهة الدردشة الكاملة
//   // ------------------------------
//   return (
//     <div className="flex flex-col h-screen">
//       <ChatHeader />

//       <div className="flex flex-1 overflow-hidden gap-4 p-4">
//         {/* Sidebar (قائمة الغرف) - مخفية على الجوال */}
//         <div className="hidden md:flex md:w-64 flex-col border rounded-lg p-4">
//           <RoomList selectedRoomId={roomId} />
//         </div>

//         {/* منطقة الدردشة الرئيسية */}
//         <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
//           {/* ترويسة الغرفة في الجوال */}
//           <div className="flex items-center gap-2 p-4 border-b md:hidden">
//             <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
//               <ChevronLeft className="h-4 w-4" />
//             </Button>
//             <h2 className="font-semibold">{roomName}</h2>
//           </div>

//           {/* ترويسة الغرفة في الشاشات الكبيرة */}
//           <div className="hidden md:block p-4 border-b">
//             <div className="flex items-center justify-between">
//               <h2 className="font-semibold text-lg">{roomName}</h2>
//               <MessageSearch roomId={roomId} onSelect={setHighlightedMessageId} />
//             </div>
//           </div>

//           {/* محتوى الدردشة */}
//           <div className="flex flex-1 overflow-hidden">
//             <div className="flex-1 flex flex-col">
//               {currentUserId && (
//                 <MessageList
//                   roomId={roomId}
//                   currentUserId={currentUserId}
//                   highlightedMessageId={highlightedMessageId}
//                 />
//               )}
//               {currentUsername && (
//                 <TypingIndicator roomId={roomId} currentUsername={currentUsername} />
//               )}
//               <MessageInput roomId={roomId} />
//             </div>

//             <UserList roomId={roomId} />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
