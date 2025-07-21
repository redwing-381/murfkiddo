import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MurfKiddo - AI Voice Agent for Kids",
  description: "A safe, educational, and fun AI voice companion for children",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 min-h-screen`}>
        <Navigation />
        <main className="pb-20">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
