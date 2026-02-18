import React, { useState } from 'react';
import { UserProfile } from '../types';
import { fetchUserProfile } from '../services/geminiService';
import { User, Loader2, ArrowRight } from 'lucide-react';

interface ProfileFormProps {
  onSave: (profile: UserProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSave }) => {
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (id: string) => {
    if (!id.trim()) {
      setError("Please enter a Client ID");
      return;
    }
    
    setClientId(id);
    setLoading(true);
    setError('');

    try {
      const profile = await fetchUserProfile(id);
      onSave(profile);
    } catch (err) {
      console.error(err);
      setError("Could not find client details. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(clientId);
  };

  const personas = [
      { id: 'TEST-USER-01', label: 'Hypertension', icon: '🩺' },
      { id: 'TEST-USER-02', label: 'Muscle Gain', icon: '💪' },
      { id: 'TEST-USER-03', label: 'Diabetes', icon: '🩸' },
      { id: 'TEST-USER-04', label: 'Keto/Weight', icon: '🥑' },
      { id: 'TEST-USER-05', label: 'Vegan', icon: '🌱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm border border-gray-100">
        
        <div className="text-center mb-6">
          <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <User size={32} className="text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-500">Enter your Client ID to sync your Balance Nutrition profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              placeholder="e.g. BN-2024-882"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-start gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-teal-200 hover:bg-teal-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Syncing Profile...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">Or try a demo persona</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
                {personas.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => executeLogin(p.id)}
                        className="flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-teal-50 hover:border-teal-200 transition-colors text-xs font-medium text-gray-600"
                    >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};