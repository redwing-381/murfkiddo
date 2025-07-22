import Link from "next/link"
import { BookOpen, Brain, Gamepad2, Globe, Moon, MessageCircle, Mic, Zap } from "lucide-react"

export default function WelcomePage() {
  const modes = [
    {
      icon: BookOpen,
      title: "Story Mode",
      description: "Listen to amazing stories!",
      href: "/story",
      gradient: "from-blue-400 to-cyan-400",
      emoji: "📚",
    },
    {
      icon: Brain,
      title: "Tutor Mode",
      description: "Learn new things together!",
      href: "/tutor",
      gradient: "from-green-400 to-emerald-400",
      emoji: "🧠",
    },
    {
      icon: Gamepad2,
      title: "Play Mode",
      description: "Fun games and activities!",
      href: "/play",
      gradient: "from-purple-400 to-pink-400",
      emoji: "🎮",
    },
    {
      icon: Globe,
      title: "Language Buddy",
      description: "Explore different languages!",
      href: "/language",
      gradient: "from-orange-400 to-red-400",
      emoji: "🌍",
    },
    {
      icon: Moon,
      title: "Bedtime Mode",
      description: "Peaceful bedtime stories!",
      href: "/bedtime",
      gradient: "from-indigo-400 to-purple-400",
      emoji: "🌙",
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 float-animation">
              <span className="text-4xl">🎤</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
              MurfKiddo
            </h1>
            <p className="text-2xl md:text-3xl text-purple-700 font-semibold">Your Voice Friend! 👋</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-purple-200 max-w-2xl mx-auto">
            <p className="text-lg text-purple-800 leading-relaxed">
              Hi there! I'm MurfKiddo, your friendly AI voice companion. I can tell you stories, help you learn, play
              games, and so much more! What would you like to do today?
            </p>
          </div>
        </div>

        {/* Featured Chat Option */}
        <div className="mb-12">
          <Link href="/chat">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-8 shadow-2xl border-2 border-white/20 hover:shadow-3xl hover:scale-105 transform transition-all duration-300 text-center group cursor-pointer">
              <div className="w-24 h-24 mx-auto mb-6 p-4 rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">💬 Chat with MurfKiddo</h2>
              <p className="text-white/90 mb-6 text-lg">Have a real-time conversation! Ask me anything and I'll respond instantly with voice!</p>
              <div className="flex items-center justify-center space-x-6 text-white/90">
                <span className="flex items-center">
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Chat
                </span>
                <span className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Real-time
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversations
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode, index) => {
            const IconComponent = mode.icon
            return (
              <Link key={mode.title} href={mode.href}>
                <div className="mode-card group cursor-pointer">
                  <div className="text-center">
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${mode.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <span className="text-3xl">{mode.emoji}</span>
                    </div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2">{mode.title}</h3>
                    <p className="text-purple-600">{mode.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Fun Mascot Section */}
        <div className="text-center mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-yellow-200 max-w-md mx-auto">
            <div className="text-6xl mb-4 bounce-animation">🤖</div>
            <p className="text-purple-700 font-medium">I'm always here to help you learn and have fun safely!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
