import Image from "next/image"

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <Image
            src="/murfkiddo.png"
            alt="MurfKiddo Logo"
            width={32}
            height={32}
            className="rounded-full animate-bounce"
          />
        </div>
      </div>
      <p className="mt-4 text-purple-600 font-medium animate-pulse">MurfKiddo is thinking...</p>
    </div>
  )
}
