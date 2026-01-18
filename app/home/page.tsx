"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTokenFromStorage } from "@/lib/token"
import { Button } from "@/components/ui/button"

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

    // Récupérer les infos de l'utilisateur
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
    <main className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl text-foreground font-bold mb-4">Hello {username}</h1>
        <Button
          onClick={() => {
            localStorage.removeItem("token")
            router.push("/login")
          }}
          className="mt-4"
        >
          Se déconnecter
        </Button>
      </div>
    </main>
  )
}