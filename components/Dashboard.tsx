import React from 'react';
import { ChevronRight, Smartphone, ScanLine, Camera, UtensilsCrossed } from 'lucide-react';
import { UserProfile, ScanMode } from '../types';

interface DashboardProps {
  userProfile: UserProfile;
  onScanClick: (mode: ScanMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, onScanClick }) => {
  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-white">
      {/* Yellow Permission Banner */}
      <div className="bg-[#FFD54F] px-4 py-3 flex items-start relative m-4 rounded-xl shadow-sm">
        <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0 border border-yellow-200 mt-1">
           <Smartphone size={20} className="text-gray-800" strokeWidth={1.5} />
        </div>
        <div className="flex-1 pr-8">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">Turn On Health Access Permission</h3>
          <p className="text-xs text-gray-800 leading-snug">
            Need access to your physical activity to track your steps and sleep data.
          </p>
        </div>
        <button className="absolute top-2 right-3 text-[10px] font-medium text-gray-800 hover:underline">
            Close
        </button>
      </div>

      <div className="px-5">
        {/* Welcome / Health Score Card */}
        <div className="bg-gradient-to-b from-[#E0F7FA] to-[#E1F5FE] rounded-2xl p-6 mb-6 text-center shadow-sm relative overflow-hidden border border-cyan-100">
            <div className="flex justify-center mb-4">
                {/* Gauge Icon CSS Representation */}
                 <div className="relative w-32 h-16">
                    <svg viewBox="0 0 100 55" className="w-full h-full">
                        <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                        <path d="M10 50 A 40 40 0 0 1 35 20" fill="none" stroke="#84cc16" strokeWidth="10" strokeLinecap="round" />
                        <path d="M35 20 A 40 40 0 0 1 65 20" fill="none" stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" />
                        <path d="M65 20 A 40 40 0 0 1 90 50" fill="none" stroke="#f87171" strokeWidth="10" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="4" fill="#64748b" />
                        <line x1="50" y1="50" x2="30" y2="35" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                 </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">Welcome to Your<br/>Health Journey!</h2>
            <button 
                className="w-full bg-gradient-to-r from-[#00ACC1] to-[#00838F] text-white py-3.5 rounded-lg font-bold text-sm shadow-lg shadow-cyan-200/50 hover:shadow-xl transition-all"
            >
                Take Health Score
            </button>
        </div>

        {/* ACTION BUTTONS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Scan Receipt */}
            <button 
                onClick={() => onScanClick('RECEIPT')}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all active:scale-95 active:bg-gray-50 group"
            >
                <div className="bg-[#E0F2F1] text-[#00695C] p-3 rounded-xl mb-3 group-hover:bg-[#B2DFDB] transition-colors">
                    <ScanLine size={28} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Scan Bill</h3>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Log & Score purchases</p>
            </button>

            {/* Scan Menu */}
            <button 
                onClick={() => onScanClick('MENU')}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all active:scale-95 active:bg-gray-50 group"
            >
                <div className="bg-[#FFF3E0] text-[#E65100] p-3 rounded-xl mb-3 group-hover:bg-[#FFE0B2] transition-colors">
                    <UtensilsCrossed size={28} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Dine In</h3>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Menu Recommendations</p>
            </button>
        </div>

        {/* Clara Card */}
        <div className="bg-[#B2EBF2] rounded-2xl p-6 relative overflow-hidden h-48 flex flex-col justify-center shadow-sm border border-cyan-200 mb-8">
            <div className="relative z-10 max-w-[55%]">
                <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">Ask Me Anything!</h2>
                <button className="bg-[#1F2937] text-white px-8 py-2.5 rounded-full text-xs font-bold hover:bg-black transition-colors shadow-md">
                    Ask me
                </button>
            </div>
            
            <div className="absolute -right-2 top-2 h-full w-1/2 pointer-events-none flex items-end justify-center">
                 <div className="absolute top-8 right-12 bg-white px-2 py-1.5 rounded-xl rounded-bl-none shadow-sm z-20 border border-gray-100">
                     <p className="text-[8px] font-bold text-gray-800">Hi, I'm Clara</p>
                 </div>
                 <img 
                    src="https://img.freepik.com/premium-photo/cute-cartoon-carrot-character-white-background-3d-illustration_76964-5003.jpg?w=360" 
                    alt="Clara the Carrot" 
                    className="h-[90%] object-contain drop-shadow-lg mix-blend-multiply opacity-95"
                    style={{ mixBlendMode: 'normal' }}
                 />
            </div>
        </div>
      </div>
    </div>
  );
};