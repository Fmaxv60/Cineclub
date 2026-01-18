import { cookies } from "next/headers"
import { isTokenValid } from "@/lib/token"
import { redirect } from "next/navigation"

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value || null
  if (isTokenValid(token)) {
    redirect("/home")
  } else {
    redirect("/login")
  }
}