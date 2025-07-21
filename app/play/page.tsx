"use client"

import { useState } from "react"
import { Star, Trophy, RefreshCw } from "lucide-react"

export default function PlayMode() {
  const [currentGame, setCurrentGame] = useState("animal-guess")
  const [score, setScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const animalQuestions = [
    {
      question: "Which animal says 'Moo'?",
      options: ["Dog", "Cow", "Cat", "Bird"],
      correct: 1,
      sound: "🐄",
    },
    {
      question: "Which animal has a long trunk?",
      options: ["Lion", "Tiger", "Elephant", "Monkey"],
      correct: 2,
      sound: "🐘",
    },
    {
      question: "Which animal likes to eat bananas?",
      options: ["Monkey", "Fish", "Snake", "Rabbit"],
      correct: 0,
      sound: "🐵",
    },
  ]

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === animalQuestions[currentQuestion].correct) {
      setScore(score + 1)
    }

    if (currentQuestion < animalQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Game completed
      setTimeout(() => {
        setCurrentQuestion(0)
        setScore(0)
      }, 2000)
    }
  }

  const resetGame = () => {
    setCurrentQuestion(0)
    setScore(0)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Play Mode</h1>
          <p className="text-lg text-purple-600">Let's play some fun games together!</p>
        </div>

        {/* Score Board */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-yellow-200 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-purple-800">Score: {score}</span>
            </div>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className={`w-8 h-8 ${i < score ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
          {currentQuestion < animalQuestions.length ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">{animalQuestions[currentQuestion].sound}</div>
                <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-2">
                  Question {currentQuestion + 1} of {animalQuestions.length}
                </h2>
                <p className="text-xl text-purple-700">{animalQuestions[currentQuestion].question}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {animalQuestions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-purple-800 mb-4">Great Job!</h2>
              <p className="text-xl text-purple-700 mb-6">
                You got {score} out of {animalQuestions.length} questions right!
              </p>
              <button onClick={resetGame} className="kid-button flex items-center space-x-2 mx-auto">
                <RefreshCw className="w-6 h-6" />
                <span>Play Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Game Selection */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "animal-guess", name: "Animal Sounds", emoji: "🐾", active: true },
            { id: "riddles", name: "Fun Riddles", emoji: "🧩", active: false },
            { id: "colors", name: "Color Game", emoji: "🌈", active: false },
          ].map((game) => (
            <button
              key={game.id}
              className={`p-6 rounded-2xl text-center shadow-lg border-2 transition-all duration-200 ${
                game.active
                  ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white border-purple-400"
                  : "bg-white/80 text-purple-800 border-purple-200 hover:border-purple-400"
              }`}
            >
              <div className="text-3xl mb-2">{game.emoji}</div>
              <p className="font-semibold">{game.name}</p>
              {!game.active && <p className="text-sm mt-1 opacity-75">Coming Soon!</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
