'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { 
  ArrowRight, 
  Wallet, 
  Shield, 
  Zap, 
  FileText,
  Check,
  ChevronLeft,
  Star
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export default function OnboardingFlow() {
  const { login, logout, ready, authenticated, user } = usePrivy();
  const { hasUsername, isLoading: userDataLoading } = useUserData();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && authenticated && !userDataLoading) {
      // Check if user has completed username setup
      if (hasUsername) {
        router.push('/dashboard');
      } else {
        router.push('/setup-username');
      }
    }
  }, [ready, authenticated, userDataLoading, hasUsername, router]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await login();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AutoMint',
      description: 'Create professional Web3 invoices in seconds. Get paid faster with crypto payments.',
      icon: <Star className="w-8 h-8 text-blue-500" />
    },
    {
      id: 'features',
      title: 'Why Choose AutoMint?',
      description: 'Fast payments, low fees, and complete transparency on the blockchain.',
      icon: <Zap className="w-8 h-8 text-yellow-500" />
    },
    {
      id: 'security',
      title: 'Bank-Level Security',
      description: 'Your funds and data are protected by blockchain technology and enterprise security.',
      icon: <Shield className="w-8 h-8 text-green-500" />
    },
    {
      id: 'connect',
      title: 'Connect Your Wallet',
      description: 'Connect your wallet or create a new one to start invoicing.',
      icon: <Wallet className="w-8 h-8 text-purple-500" />,
      action: handleConnect
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStepData.id]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepAction = () => {
    if (currentStepData.action) {
      currentStepData.action();
    } else {
      nextStep();
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header with progress */}
      <div className="w-full p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="w-8 h-8"></div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-gray-50 rounded-full">
                {currentStepData.icon}
              </div>
            </div>

            {/* Content */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Features list for specific steps */}
            {currentStep === 1 && (
              <div className="mb-8 space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Instant crypto payments</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Multi-chain support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Automated invoice tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Tax-compliant reporting</span>
                </div>
              </div>
            )}

            {/* Security features */}
            {currentStep === 2 && (
              <div className="mb-8 space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">End-to-end encryption</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Non-custodial wallet support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Blockchain verification</span>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleStepAction}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>
                    {currentStep === steps.length - 1 ? 'Connect Wallet' : 'Continue'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Skip option for non-essential steps */}
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button
                onClick={nextStep}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
