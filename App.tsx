import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, Wallet, Menu, Bell, BookOpen, ClipboardList } from 'lucide-react';
import { AppView, UserProfile, BillAnalysis, ScanMode, AnalysisItem } from './types';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { ResultsView } from './components/ResultsView';
import { ProfileForm } from './components/ProfileForm';
import { HistoryView } from './components/HistoryView';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('RECEIPT');

  // Load history
  const [history, setHistory] = useState<BillAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem('nutriscan_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<BillAnalysis | null>(null);

  // Manage LocalStorage Quota
  useEffect(() => {
    try {
      localStorage.setItem('nutriscan_history', JSON.stringify(history));
    } catch (e) {
      console.error("Storage quota exceeded", e);
      if (history.length > 1) {
        const trimmed = history.slice(1);
        setHistory(trimmed);
        localStorage.setItem('nutriscan_history', JSON.stringify(trimmed));
      }
    }
  }, [history]);

  if (!userProfile) {
    return <ProfileForm onSave={(profile) => setUserProfile(profile)} />;
  }

  const handleScanClick = (mode: ScanMode) => {
    setScanMode(mode);
    setCurrentView(AppView.CAMERA);
  };

  const handleImagesSelected = async (files: File[]) => {
    setIsAnalyzing(true);
    
    // Initial empty state
    const initialAnalysis: BillAnalysis = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: scanMode,
        items: [],
        healthScore: 0,
        summary: "Initiating parallel analysis...",
        totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        scanProgress: { current: 0, total: files.length }
    };

    setCurrentAnalysis(initialAnalysis);
    
    // Optimization: Parallel Processing
    // We fire all requests at once. As they come back, we update the state atomically.
    let completedCount = 0;
    
    const processFile = async (file: File) => {
        try {
            const result = await analyzeImage(file, userProfile, scanMode);
            
            completedCount++;
            
            // If this is the first one to finish, switch view immediately
            if (completedCount === 1) {
                setIsAnalyzing(false);
                setCurrentView(AppView.RESULTS);
            }

            setCurrentAnalysis(prev => {
                if (!prev) return null;
                
                // Merge Items
                const newItems = [...prev.items, ...result.items];
                
                // Merge Macros
                const newMacros = { ...prev.totalMacros! };
                if (result.totalMacros) {
                    newMacros.calories += result.totalMacros.calories;
                    newMacros.protein += result.totalMacros.protein;
                    newMacros.carbs += result.totalMacros.carbs;
                    newMacros.fat += result.totalMacros.fat;
                } else {
                    result.items.forEach(item => {
                        newMacros.calories += item.macros.calories;
                        newMacros.protein += item.macros.protein;
                        newMacros.carbs += item.macros.carbs;
                        newMacros.fat += item.macros.fat;
                    });
                }
                
                // Weighted Average Score approximation
                // (CurrentAvg * CurrentCount + NewScore) / NewCount
                // Note: We use the *previous* count of processed items to weight the average
                const prevCount = prev.scanProgress?.current || 0;
                const newScore = Math.round(((prev.healthScore * prevCount) + result.healthScore) / (prevCount + 1));
                
                const summary = prevCount === 0 ? result.summary : `Analyzed ${newItems.length} items from ${prevCount + 1} images...`;

                return {
                    ...prev,
                    items: newItems,
                    totalMacros: newMacros,
                    healthScore: newScore,
                    summary,
                    restaurantName: prev.restaurantName || result.restaurantName,
                    scanProgress: { current: prevCount + 1, total: files.length }
                };
            });

        } catch (err) {
            console.error("Error analyzing one of the images", err);
            // Still update progress so the user isn't stuck
            completedCount++;
            setCurrentAnalysis(prev => prev ? ({
                ...prev,
                scanProgress: { current: (prev.scanProgress?.current || 0) + 1, total: files.length }
            }) : null);
        }
    };

    try {
        await Promise.all(files.map(file => processFile(file)));

        // Finalize History Save
        setCurrentAnalysis(prev => {
            if (prev) {
                 const finalState = { ...prev, scanProgress: undefined };
                 setHistory(h => [...h, finalState]);
                 return finalState;
            }
            return prev;
        });
    } catch (error) {
        console.error("Fatal error in batch processing", error);
        alert("Something went wrong during analysis.");
        setIsAnalyzing(false);
        setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleHistorySelect = (analysis: BillAnalysis) => {
    setCurrentAnalysis(analysis);
    setCurrentView(AppView.RESULTS);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.CAMERA:
        return (
          <Scanner 
            mode={scanMode}
            onImagesSelected={handleImagesSelected}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
            isAnalyzing={isAnalyzing}
            onOpenHistory={() => setCurrentView(AppView.HISTORY)}
          />
        );
      case AppView.RESULTS:
        return currentAnalysis ? (
          <ResultsView 
            analysis={currentAnalysis} 
            onBack={() => setCurrentView(AppView.HISTORY)} 
            onScanAnother={() => setCurrentView(AppView.CAMERA)}
          />
        ) : null;
      case AppView.HISTORY:
        return (
            <HistoryView 
                history={history} 
                userProfile={userProfile}
                onSelectAnalysis={handleHistorySelect}
                onBack={() => setCurrentView(AppView.DASHBOARD)}
            />
        );
      case AppView.DASHBOARD:
      default:
        return (
          <Dashboard 
            userProfile={userProfile} 
            onScanClick={handleScanClick}
          />
        );
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative text-gray-900">
      {/* Top Bar */}
      {currentView === AppView.DASHBOARD && (
        <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-20">
          <button className="text-gray-900 p-1">
             <Menu size={28} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-medium text-gray-900 tracking-tight">Hi {userProfile.name.split(' ')[0]}</h1>
          <div className="relative p-1">
             <Bell size={24} className="text-gray-900" />
             <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center text-[10px] text-white font-bold">
               3
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {renderContent()}

      {/* Bottom Navigation */}
      {currentView !== AppView.CAMERA && currentView !== AppView.RESULTS && (
        <div className="bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-end text-gray-400 shrink-0 z-30">
          <button 
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.DASHBOARD ? 'text-[#00ACC1]' : 'hover:text-[#00ACC1]'}`}
            onClick={() => setCurrentView(AppView.DASHBOARD)}
          >
            <Home size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 hover:text-[#00ACC1] transition-colors relative">
            <div className="relative">
                <MessageCircle size={24} strokeWidth={2} />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white">3</div>
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          <button 
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.HISTORY ? 'text-[#00ACC1]' : 'hover:text-[#00ACC1]'}`}
            onClick={() => setCurrentView(AppView.HISTORY)}
          >
            <ClipboardList size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">Tracker</span>
          </button>

          <button className="flex flex-col items-center gap-1 hover:text-[#00ACC1] transition-colors">
            <BookOpen size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">Recipes</span>
          </button>

          <button className="flex flex-col items-center gap-1 hover:text-[#00ACC1] transition-colors">
            <Wallet size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;