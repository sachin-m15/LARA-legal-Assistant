import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Scale, Sparkles } from 'lucide-react';
import SignInPage from './components/SignInPage';
import SignUpPage from './components/SignUpPage';
import ChatInterface from './components/ChatInterface';
import FloatingParticles from './components/FloatingParticles';
import FloatingImages from './components/FloatingImages';

function App() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Landing page component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
      <FloatingParticles />
      <FloatingImages />
      
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent pointer-events-none z-1" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-2xl">
          <div className="px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Scale className="w-9 h-9 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 bg-clip-text text-transparent drop-shadow-lg">
                  L.A.R.A
                </h1>
                <p className="text-gray-700 text-base font-semibold tracking-wide">Legal Analysis & Research Assistant</p>
                <p className="text-gray-500 text-sm">Powered by Advanced AI Technology</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                to="/sign-in"
                className="px-6 py-3 bg-white text-gray-800 font-bold rounded-2xl transition-all duration-300 backdrop-blur-md border-2 border-gray-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-6 py-3 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-md border-2 border-gray-600 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-6">
            Your AI-Powered Legal Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mb-12">
            Get instant answers to your legal questions, analyze cases, and receive expert guidance powered by advanced AI technology.
          </p>
          <Link
            to="/sign-up"
            className="px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black text-white text-lg font-bold rounded-2xl transition-all duration-300 backdrop-blur-md border-2 border-gray-600 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5 flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6" />
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route 
        path="/"
        element={
          isSignedIn ? (
            <Navigate to="/chat" replace />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/sign-in/*"
        element={
          isSignedIn ? (
            <Navigate to="/chat" replace />
          ) : (
            <SignInPage />
          )
        }
      />
      <Route
        path="/sign-up/*"
        element={
          isSignedIn ? (
            <Navigate to="/chat" replace />
          ) : (
            <SignUpPage />
          )
        }
      />
      <Route
        path="/chat/*"
        element={
          isSignedIn ? (
            <ChatInterface />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;