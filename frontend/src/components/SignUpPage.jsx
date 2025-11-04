import { SignUp } from "@clerk/clerk-react";
import { Scale, Sparkles } from 'lucide-react';

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      {/* Logo and Title Section */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Scale className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 bg-clip-text text-transparent drop-shadow-lg mb-2">
          L.A.R.A
        </h1>
        <p className="text-gray-600 text-lg font-medium">Legal Analysis & Research Assistant</p>
      </div>

      {/* Sign Up Container */}
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border-2 border-gray-200">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black text-white rounded-2xl px-6 py-3 font-bold transition-all duration-300 transform hover:scale-105",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "text-2xl font-bold text-gray-800",
                headerSubtitle: "text-gray-600",
                formFieldLabel: "text-gray-700 font-medium",
                formFieldInput: "rounded-xl border-2 border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-400/50 transition-all duration-300",
                footerActionLink: "text-gray-600 hover:text-gray-800 font-semibold",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500 bg-transparent",
                socialButtonsBlockButton:
                  "border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-300",
                socialButtonsBlockButtonText: "font-medium text-gray-700",
                formFieldWarning: "text-amber-600",
                formFieldError: "text-red-600",
                alert: "rounded-xl border-2",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                showOptionalFields: false,
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>
      </div>
      {/* Footer */}
      <div className="mt-8 text-center text-gray-500">
        <p className="text-sm">Secure Authentication </p>
      </div>
    </div>
  );
};

export default SignUpPage;