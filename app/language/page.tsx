"use client"

import { useState } from "react"
import { Volume2 } from "lucide-react"

export default function LanguageBuddy() {
  const [selectedLanguage, setSelectedLanguage] = useState("spanish")
  const [inputText, setInputText] = useState("")
  const [translation, setTranslation] = useState("")
  const [currentCard, setCurrentCard] = useState(0)

  const languages = [
    { code: "spanish", name: "Spanish", flag: "🇪🇸" },
    { code: "french", name: "French", flag: "🇫🇷" },
    { code: "german", name: "German", flag: "🇩🇪" },
    { code: "italian", name: "Italian", flag: "🇮🇹" },
    { code: "hindi", name: "Hindi", flag: "🇮🇳" },
    { code: "tamil", name: "Tamil", flag: "🇮🇳" },
  ]

  const flashcards = {
    spanish: [
      { word: "Hola", translation: "Hello", pronunciation: "OH-lah" },
      { word: "Gracias", translation: "Thank you", pronunciation: "GRAH-see-ahs" },
      { word: "Adiós", translation: "Goodbye", pronunciation: "ah-DYOHS" },
      { word: "Agua", translation: "Water", pronunciation: "AH-gwah" },
    ],
    french: [
      { word: "Bonjour", translation: "Hello", pronunciation: "bon-ZHOOR" },
      { word: "Merci", translation: "Thank you", pronunciation: "mer-SEE" },
      { word: "Au revoir", translation: "Goodbye", pronunciation: "oh ruh-VWAHR" },
      { word: "Eau", translation: "Water", pronunciation: "OH" },
    ],
  }

  const handleTranslate = () => {
    if (!inputText.trim()) return

    // Simulate translation
    setTranslation(`Translation: "${inputText}" in ${languages.find((l) => l.code === selectedLanguage)?.name}`)
  }

  const playPronunciation = (word: string) => {
    // In a real app, this would play the actual pronunciation
    console.log(`Playing pronunciation for: ${word}`)
  }

  const currentCards = flashcards[selectedLanguage as keyof typeof flashcards] || flashcards.spanish

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌍</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Language Buddy</h1>
          <p className="text-lg text-purple-600">Let's explore different languages together!</p>
        </div>

        {/* Language Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-orange-200 mb-8">
          <h2 className="text-xl font-bold text-purple-800 mb-4 text-center">Choose a Language to Learn</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`p-4 rounded-2xl text-center transition-all duration-200 ${
                  selectedLanguage === lang.code
                    ? "bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg"
                    : "bg-white border-2 border-orange-200 hover:border-orange-400 text-purple-800"
                }`}
              >
                <div className="text-2xl mb-1">{lang.flag}</div>
                <p className="font-semibold text-sm">{lang.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Translation Tool */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200 mb-8">
          <h2 className="text-xl font-bold text-purple-800 mb-4 text-center">Translation Tool</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What do you want to translate?"
              className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim()}
              className="w-full kid-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Translate to {languages.find((l) => l.code === selectedLanguage)?.name}
            </button>
            {translation && (
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4">
                <p className="text-green-800 font-medium">{translation}</p>
                <button
                  onClick={() => playPronunciation(translation)}
                  className="mt-2 flex items-center space-x-2 text-green-700 hover:text-green-900"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Listen</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Flashcards */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-purple-800">
              Common Words in {languages.find((l) => l.code === selectedLanguage)?.name}
            </h2>
            <div className="text-sm text-purple-600">
              {currentCard + 1} of {currentCards.length}
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 mb-6">
              <div className="text-4xl font-bold text-purple-800 mb-2">{currentCards[currentCard]?.word}</div>
              <div className="text-lg text-purple-600 mb-2">{currentCards[currentCard]?.translation}</div>
              <div className="text-sm text-purple-500">Pronunciation: {currentCards[currentCard]?.pronunciation}</div>
              <button
                onClick={() => playPronunciation(currentCards[currentCard]?.word)}
                className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </button>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                disabled={currentCard === 0}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-2xl hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentCard(Math.min(currentCards.length - 1, currentCard + 1))}
                disabled={currentCard === currentCards.length - 1}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
