import { getTokenFromStorage } from "@/lib/token"
import { redirect } from "next/navigation"

export default async function Home() {
  const token = getTokenFromStorage()
  
  if (!token) {
    redirect("/login")
  } else {
    redirect("/home")
  }
}