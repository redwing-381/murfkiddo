"use client";

import Link from "next/link";
import React, { Suspense } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

// Use React.lazy for Spline as recommended in their documentation
const Spline = React.lazy(() => import('@splinetool/react-spline'));

export default function SimpleLandingPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Spline 3D Background - Fully Interactive */}
      <div className="absolute inset-0 z-10">
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4 drop-shadow-2xl"></div>
              <div className="bg-black/30 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/40 shadow-xl">
                <p className="text-white text-xl font-bold" style={{
                  textShadow: '0 0 15px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)'
                }}>Loading your magical world... ✨</p>
              </div>
            </div>
          </div>
        }>
          <Spline
            scene="https://prod.spline.design/1q7zkqBPYY5uXYou/scene.splinecode"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </Suspense>
      </div>

      {/* Static Text Overlay - No Pointer Events */}
      <div className="absolute inset-0 z-20 w-full h-full flex flex-col pointer-events-none">
        {/* Top Logo Area */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            {/* Simple Logo */}
            <div className="mb-8">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-2xl border-4 border-white/50">
                <span className="text-4xl md:text-6xl drop-shadow-2xl">🎤</span>
              </div>
              
                             {/* Title with enhanced visibility */}
               <div className="mb-4">
                 <h1 className="text-4xl md:text-6xl font-black mb-2 drop-shadow-2xl" style={{
                   background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #fab1a0, #fd79a8, #a29bfe)',
                   backgroundSize: '400% 400%',
                   WebkitBackgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                   backgroundClip: 'text',
                   animation: 'rainbowMove 3s ease infinite',
                   WebkitTextStroke: '3px white',
                   textShadow: '0 0 30px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.3), 0 0 50px rgba(255,200,100,0.4)'
                 }}>
                   MurfKiddo
                 </h1>
                 
                 <p className="text-lg md:text-xl text-white font-bold" style={{
                   textShadow: '0 0 15px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)'
                 }}>
                   Your Magical Voice Friend
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Area */}
        <div className="flex-shrink-0 pb-16 px-4">
          <div className="text-center">
            {/* Main CTA Button - Allow Pointer Events */}
            <div className="pointer-events-auto inline-block">
              <Link href="/explore">
                <button className="group bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-white font-black py-4 px-8 md:py-6 md:px-12 rounded-full text-lg md:text-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 shadow-2xl border-4 border-white/60 backdrop-blur-sm" style={{
                  boxShadow: '0 0 30px rgba(0,0,0,0.4), 0 10px 25px rgba(0,0,0,0.3), 0 0 60px rgba(255,165,0,0.3)'
                }}>
                  <div className="flex items-center justify-center space-x-3" style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    <Sparkles className="w-5 h-5 md:w-7 md:h-7 drop-shadow-lg" />
                    <span>Start Exploring!</span>
                    <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-1 transition-transform drop-shadow-lg" />
                  </div>
                </button>
              </Link>
            </div>
            
            {/* Interaction Hint */}
            <div className="mt-6">
              <div className="bg-black/25 backdrop-blur-md rounded-full px-6 py-3 border border-white/40 shadow-xl inline-block">
                <p className="text-white text-sm md:text-base font-bold flex items-center justify-center space-x-2" style={{
                  textShadow: '0 0 10px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7)'
                }}>
                  <Sparkles className="w-4 h-4 drop-shadow-lg" />
                  <span>Interact with the 3D world while you decide!</span>
                  <Sparkles className="w-4 h-4 drop-shadow-lg" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
