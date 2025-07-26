"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, Brain, Gamepad2, Globe, Moon } from "lucide-react"

export default function ExplorePage() {
  const modes = [
    {
      icon: BookOpen,
      title: "Story Time! 📚",
      description: "I'll tell you amazing stories!",
      href: "/story",
      gradient: "from-blue-400 to-cyan-400",
      emoji: "📚",
      kidFriendly: "Let's read together!"
    },
    {
      icon: Brain,
      title: "Learn & Explore! 🧠",
      description: "Ask me anything you want to know!",
      href: "/tutor",
      gradient: "from-green-400 to-emerald-400",
      emoji: "🧠",
      kidFriendly: "I love questions!"
    },
    {
      icon: Gamepad2,
      title: "Fun Games! 🎮",
      description: "Let's play riddles and word games!",
      href: "/play",
      gradient: "from-purple-400 to-pink-400",
      emoji: "🎮",
      kidFriendly: "Game time!"
    },
    {
      icon: Globe,
      title: "Language Fun! 🌍",
      description: "Learn cool words in other languages!",
      href: "/language",
      gradient: "from-orange-400 to-red-400",
      emoji: "🌍",
      kidFriendly: "¡Hola! Bonjour!"
    },
    {
      icon: Moon,
      title: "Sleepy Time! 🌙",
      description: "Calm stories to help you sleep!",
      href: "/bedtime",
      gradient: "from-indigo-400 to-purple-400",
      emoji: "🌙",
      kidFriendly: "Sweet dreams!"
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Super Friendly Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="w-40 h-40 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-2xl">
              <Image
                src="/murfkiddo.png"
                alt="MurfKiddo Logo"
                width={120}
                height={120}
                className="rounded-full"
              />
            </div>
            <h1 className="text-6xl md:text-8xl font-black rainbow-text mb-6">
              MurfKiddo
            </h1>
            <p className="text-4xl md:text-5xl text-purple-700 font-bold bounce-animation">Your Fun Voice Friend! 👋</p>
          </div>

          <div className="kid-message-box max-w-4xl mx-auto">
            <p className="text-2xl md:text-3xl text-purple-800 leading-relaxed font-bold">
              Hi there, awesome kid! 🌟 I'm MurfKiddo, and I LOVE talking with you! 
              I can tell you stories, help you learn cool stuff, play games, and so much more! 
              What sounds fun today? 🎉
            </p>
          </div>
        </div>



        {/* Big Mode Selection Cards */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12 text-purple-800">
            🎯 Pick Your Adventure!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modes.map((mode, index) => {
              const IconComponent = mode.icon
              return (
                <Link key={mode.title} href={mode.href}>
                  <div className="mode-card group">
                    <div className="text-center">
                      {/* Huge emoji with animation */}
                      <div
                        className={`w-32 h-32 bg-gradient-to-r ${mode.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
                      >
                        <span className="kid-emoji bounce-animation">{mode.emoji}</span>
                      </div>
                      
                      {/* Big, friendly title */}
                      <h3 className="text-2xl md:text-3xl font-black text-purple-800 mb-4">
                        {mode.title}
                      </h3>
                      
                      {/* Kid-friendly description */}
                      <p className="text-xl text-purple-600 font-bold mb-4">
                        {mode.description}
                      </p>
                      
                      {/* Encouraging phrase */}
                      <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full py-3 px-6 text-lg font-black text-orange-800">
                        {mode.kidFriendly}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 