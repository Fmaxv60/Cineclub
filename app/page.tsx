"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTokenFromStorage } from "@/lib/token"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getTokenFromStorage()
    
    if (!token) {
      router.push("/login")
    } else {
      router.push("/home")
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Redirection...</div>
  }

  return null
}