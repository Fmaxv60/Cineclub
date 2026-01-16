"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTokenFromStorage } from "@/lib/token"

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
      <main className="flex items-center justify-center min-h-screen bg-[#03001e]">
        <p className="text-white">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#03001e]">
      <div className="text-center">
        <h1 className="text-4xl text-white font-bold mb-4">
          Hello {username}
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem("token")
            router.push("/login")
          }}
          className="mt-4 px-6 py-2 bg-[#7303c0] hover:bg-[#ec38bc] text-white rounded"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  )
}