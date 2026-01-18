"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function RegisterForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    // Validation client
    const newErrors: string[] = []
    if (!username || username.trim().length < 3) {
      newErrors.push("Le nom d'utilisateur doit avoir au moins 3 caractères")
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push("Veuillez fournir une adresse email valide")
    }
    if (!password || password.length < 8) {
      newErrors.push("Le mot de passe doit avoir au moins 8 caractères")
    }
    if (password !== confirmPassword) {
      newErrors.push("Les mots de passe ne correspondent pas")
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors([data.message || "Erreur à l'inscription"])
        return
      }

      toast("Inscription réussie !", {
        description: "Votre compte a été créé avec succès.",
      })

      router.push("/login")
    } catch (error) {
      setErrors(["Une erreur est survenue. Veuillez réessayer."])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-primary">Inscription</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/20 border border-destructive rounded p-3">
                <ul className="space-y-1 text-sm text-destructive">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 bg-secondary/20 text-foreground"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-secondary/20 text-foreground"
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
                className="mt-2 bg-secondary/20 text-foreground"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 bg-secondary/20 text-foreground"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || password !== confirmPassword}>
              {loading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
        
            <Separator className="mt-6" />
            
            <div className="text-center text-sm text-muted-foreground mt-4">
                Tu as déjà un compte ? {" "}
                <a href="/login" className="text-accent hover:underline font-medium">
                    Se connecter
                </a>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}