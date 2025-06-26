'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { 
  User, 
  Check, 
  X, 
  ArrowRight, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function SetupUsernamePage() {
  const { ready, authenticated, user } = usePrivy();
  const { hasUsername, updateUserData, isLoading: userDataLoading } = useUserData();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Check if user already has a username
  useEffect(() => {
    if (ready && authenticated && !userDataLoading) {
      if (hasUsername) {
        router.push('/dashboard');
      }
    }
  }, [ready, authenticated, userDataLoading, hasUsername, router]);

  // Mock list of taken usernames for validation
  const takenUsernames = ['admin', 'support', 'automint', 'payment', 'invoice', 'crypto', 'web3', 'blockchain'];

  const validateUsername = async (value: string) => {
    setIsValidating(true);
    setValidationError('');
    setIsValid(false);

    // Clear validation if empty
    if (!value) {
      setIsValidating(false);
      return;
    }

    // Check length
    if (value.length < 3) {
      setValidationError('Username must be at least 3 characters');
      setIsValidating(false);
      return;
    }

    if (value.length > 15) {
      setValidationError('Username must be 15 characters or less');
      setIsValidating(false);
      return;
    }

    // Check alphanumeric only
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      setValidationError('Username can only contain letters and numbers');
      setIsValidating(false);
      return;
    }

    // Check if starts with number
    if (/^[0-9]/.test(value)) {
      setValidationError('Username cannot start with a number');
      setIsValidating(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if taken (mock check)
    if (takenUsernames.includes(value.toLowerCase())) {
      setValidationError('This username is already taken');
      setIsValidating(false);
      return;
    }

    // If we get here, username is valid
    setIsValid(true);
    setIsValidating(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setUsername(value);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateUsername(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || isSaving) return;

    setIsSaving(true);

    try {
      // Save username using the custom hook
      const userData = {
        username: username,
        usernamePayUrl: `${username}.pay`,
        setupCompleted: true,
        setupDate: new Date().toISOString()
      };
      
      updateUserData(userData);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving username:', error);
      setValidationError('Failed to save username. Please try again.');
      setIsSaving(false);
    }
  };

  const getInputBorderColor = () => {
    if (!username) return 'border-gray-300 focus:border-blue-500';
    if (isValidating) return 'border-yellow-400 focus:border-yellow-500';
    if (validationError) return 'border-red-400 focus:border-red-500';
    if (isValid) return 'border-green-400 focus:border-green-500';
    return 'border-gray-300 focus:border-blue-500';
  };

  const getValidationIcon = () => {
    if (isValidating) return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
    if (validationError) return <X className="w-5 h-5 text-red-500" />;
    if (isValid) return <Check className="w-5 h-5 text-green-500" />;
    return null;
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="w-full p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Setup Your Username</h1>
            <p className="text-sm text-gray-600 mt-1">Create your unique payment URL</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-blue-50 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Username
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Your username will be used to create a personalized payment URL that clients can use to pay you.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="yourname"
                    className={`w-full px-4 py-3 border rounded-xl transition-colors duration-200 ${getInputBorderColor()} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    maxLength={15}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon()}
                  </div>
                </div>
                
                {/* Real-time preview */}
                {username && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Your payment URL will be:</p>
                    <p className="font-mono text-lg font-semibold text-blue-600 break-all">
                      {username}.pay
                    </p>
                  </div>
                )}

                {/* Validation feedback */}
                {validationError && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {isValid && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>Username is available!</span>
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Username requirements:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${username.length >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>3-15 characters long</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/^[a-zA-Z0-9]*$/.test(username) && username ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Letters and numbers only</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${username && !/^[0-9]/.test(username) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Cannot start with a number</span>
                  </li>
                </ul>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isValid || isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              You can change your username later in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
