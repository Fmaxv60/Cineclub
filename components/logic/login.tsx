"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    // Validation client
    const newErrors: string[] = []
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push("Veuillez fournir une adresse email valide")
    }
    if (!password || password.length === 0) {
      newErrors.push("Le mot de passe est requis")
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors([data.message || "Erreur de connexion"])
        return
      }

      // Stockage du token
      localStorage.setItem("token", data.token)

      toast("Connexion réussie !", {
        description: "Bienvenue " + data.user.username,
      })

      router.push("/home")
    } catch (error) {
      setErrors(["Une erreur est survenue. Veuillez réessayer."])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#03001e]">
      <Card className="w-full max-w-sm border border-[#7303c0] bg-white/5 text-white backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-center text-[#ec38bc]">Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500 rounded p-3">
                <ul className="space-y-1 text-sm text-red-200">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#03001e] border-[#7303c0] text-white mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#03001e] border-[#7303c0] text-white mt-2"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#7303c0] hover:bg-[#ec38bc] text-white"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <Separator className="mt-6 border-t border-[#7303c0]" />
            
            <div className="text-center text-sm text-muted-foreground mt-4">
                Pas encore de compte ? {" "}
                <a href="/register" className="text-[#ec38bc] hover:underline font-medium">
                    Créer un compte
                </a>
            </div>

        </CardContent>
      </Card>
    </div>
  )
}