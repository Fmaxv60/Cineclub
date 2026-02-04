"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTokenFromStorage } from "@/lib/token"
import { Button } from "@/components/ui/button"
import UpcomingRooms from "@/components/logic/rooms"
import TopMovies from "@/components/logic/top"
import LatestReviews from "@/components/logic/reviews"
import UnratedMoviesReminder from "@/components/logic/unrated-movies"

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getTokenFromStorage()

    if (!token) {
      router.push("/login")
      return
    }

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Non authentifié")
        return res.json()
      })
      .then((data) => {
        setUsername(data.user.username)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem("token")
        router.push("/login")
      })
  }, [router])

  if (loading) {
    return (
      <main className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="theme-cineclub min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl text-foreground font-bold mb-2">Hello {username}</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace cinéma</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <UpcomingRooms />
            <TopMovies />
          </div>
          <div className="space-y-8">
            <LatestReviews />
            <UnratedMoviesReminder />
          </div>
        </div>
      </div>
    </main>
  )
}