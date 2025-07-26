"use client"

import { usePathname } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return <main>{children}</main>
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 min-h-screen">
      <Navigation />
      <main className="pb-20">{children}</main>
      <Footer />
    </div>
  )
} 