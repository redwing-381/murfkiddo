"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b-2 border-purple-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/murfkiddo.png"
              alt="MurfKiddo Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MurfKiddo
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-full hover:bg-purple-100 transition-colors"
            >
              <Home className="w-5 h-5 text-purple-600" />
              <span className="text-purple-600 font-medium">Home</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-purple-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-purple-600" /> : <Menu className="w-6 h-6 text-purple-600" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-200">
            <Link
              href="/"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5 text-purple-600" />
              <span className="text-purple-600 font-medium">Home</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
