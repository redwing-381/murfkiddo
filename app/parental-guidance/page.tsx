import { Shield, Eye, Volume2, Clock, Users, Heart } from "lucide-react"

export default function ParentalGuidance() {
  const safetyFeatures = [
    {
      icon: Shield,
      title: "Content Safety",
      description: "All content is filtered and age-appropriate for children 5-12 years old",
    },
    {
      icon: Eye,
      title: "No Data Collection",
      description: "We do not collect, store, or share any personal information from children",
    },
    {
      icon: Volume2,
      title: "Voice Privacy",
      description: "Voice interactions are processed securely and not stored permanently",
    },
    {
      icon: Clock,
      title: "Usage Monitoring",
      description: "Built-in time limits and break reminders for healthy screen time",
    },
    {
      icon: Users,
      title: "Parental Controls",
      description: "Parents can monitor and control all interactions and settings",
    },
    {
      icon: Heart,
      title: "Educational Focus",
      description: "All activities are designed to be educational and developmentally appropriate",
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Parental Guidance</h1>
          <p className="text-lg text-purple-600">Your child's safety and privacy are our top priorities</p>
        </div>

        {/* Safety Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {safetyFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-green-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2">{feature.title}</h3>
                    <p className="text-purple-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Guidelines */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200 mb-8">
          <h2 className="text-2xl font-bold text-purple-800 mb-6 text-center">Guidelines for Parents</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-purple-700">
                <strong>Supervised Use:</strong> We recommend that children use MurfKiddo with adult supervision,
                especially during initial sessions.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-purple-700">
                <strong>Screen Time:</strong> Follow recommended screen time guidelines for your child's age group and
                take regular breaks.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-purple-700">
                <strong>Internet Safety:</strong> Teach your child about internet safety and the importance of not
                sharing personal information.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <p className="text-purple-700">
                <strong>Report Issues:</strong> If you notice any inappropriate content or behavior, please report it
                immediately to our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200 text-center">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Need Help or Have Concerns?</h2>
          <p className="text-purple-600 mb-6">
            We're here to help ensure your child has a safe and educational experience.
          </p>
          <div className="space-y-3">
            <p className="text-purple-700">
              <strong>Email:</strong> support@murfkiddo.com
            </p>
            <p className="text-purple-700">
              <strong>Phone:</strong> 1-800-MURF-KIDS
            </p>
            <p className="text-purple-700">
              <strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM EST
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
