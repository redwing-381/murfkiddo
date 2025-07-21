import Link from "next/link"
import { Shield, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white/90 backdrop-blur-sm border-t-2 border-purple-200 py-6 fixed bottom-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Heart className="w-4 h-4 text-pink-500" />
            <span>Made with love for kids</span>
          </div>
          <Link
            href="/parental-guidance"
            className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Parental Guidance</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
