import React from 'react';
import { BillAnalysis, HealthCategory } from '../types';
import { ChevronLeft, CheckCircle, AlertCircle, AlertTriangle, XCircle, Info, Camera, Loader2, Database } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResultsViewProps {
  analysis: BillAnalysis;
  onBack: () => void;
  onScanAnother?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ analysis, onBack, onScanAnother }) => {
  const isMenu = analysis.type === 'MENU';
  const isStreaming = analysis.scanProgress && analysis.scanProgress.current < analysis.scanProgress.total;

  const macroData = analysis.totalMacros ? [
    { name: 'Protein', value: analysis.totalMacros.protein, color: '#10B981' }, 
    { name: 'Carbs', value: analysis.totalMacros.carbs, color: '#F59E0B' },   
    { name: 'Fat', value: analysis.totalMacros.fat, color: '#EF4444' },       
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getCategoryStyles = (category: HealthCategory) => {
    switch (category) {
      case 'Good':
        return {
          bg: 'bg-green-50',
          border: 'border-green-100',
          text: 'text-green-700',
          badgeBg: 'bg-green-100',
          badgeText: 'text-green-700',
          icon: <CheckCircle size={16} />
        };
      case 'Fair':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          text: 'text-blue-700',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-700',
          icon: <AlertCircle size={16} />
        };
      case 'Occasional':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-100',
          text: 'text-orange-700',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          icon: <AlertTriangle size={16} />
        };
      case 'Bad':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          text: 'text-red-700',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          icon: <XCircle size={16} />
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-100',
          text: 'text-gray-700',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-700',
          icon: <Info size={16} />
        };
    }
  };

  const scoreStyle = getScoreColor(analysis.healthScore);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-100">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2">
            <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="font-bold text-lg text-gray-800 leading-none">
                    {isMenu ? 'Menu Guide' : 'Bill Analysis'}
                </h1>
                {analysis.restaurantName && (
                    <p className="text-xs text-gray-500 mt-1 font-medium">{analysis.restaurantName}</p>
                )}
            </div>
        </div>
        
        {onScanAnother && !isStreaming && (
            <button 
                onClick={onScanAnother}
                className="flex items-center gap-1 text-teal-600 text-xs font-bold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100 hover:bg-teal-100"
            >
                <Camera size={14} />
                <span>Scan</span>
            </button>
        )}
      </div>

      {/* Streaming Progress Banner */}
      {isStreaming && analysis.scanProgress && (
          <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                  <Loader2 size={16} className="text-teal-600 animate-spin" />
                  <span className="text-xs font-bold text-teal-800">
                      Analyzing image {analysis.scanProgress.current + 1} of {analysis.scanProgress.total}...
                  </span>
              </div>
              <span className="text-[10px] font-medium text-teal-600">
                  Streaming Results
              </span>
          </div>
      )}

      <div className="p-4 space-y-6">
        
        {/* Data Source Transparency Info */}
        <div className="flex items-center gap-2 px-1 text-gray-400">
             <Database size={12} />
             <span className="text-[10px]">Source: Gemini AI + Google Search Grounding</span>
        </div>

        {/* Score Card */}
        <div className={`rounded-2xl p-6 border flex items-center justify-between ${scoreStyle}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">
                {isMenu ? 'Restaurant Fit' : 'Health Score'}
            </p>
            <h2 className="text-4xl font-bold">{analysis.healthScore}</h2>
          </div>
          <div className="text-right max-w-[60%]">
             <p className="text-sm font-medium leading-relaxed">{analysis.summary}</p>
          </div>
        </div>

        {/* Macro Chart */}
        {!isMenu && analysis.totalMacros && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Nutrient Breakdown</h3>
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-xs text-gray-400 font-medium">Total</span>
                <span className="text-lg font-bold text-gray-800">{analysis.totalMacros.calories}</span>
                <span className="text-[10px] text-gray-400">kcal</span>
                </div>
            </div>
            </div>
        )}

        {/* Item List */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 px-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span>{isMenu ? 'Recommended Dishes' : 'Analyzed Products'}</span>
                 {isStreaming && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full animate-pulse">Updating...</span>}
              </div>
              {isMenu && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-bold">Dine In Mode</span>}
          </h3>
          <div className="space-y-4">
            {analysis.items.map((item, idx) => {
              const styles = getCategoryStyles(item.category);
              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${styles.border} ${item.category === 'Bad' ? 'ring-1 ring-red-100' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                      <div className="pr-2 flex-1">
                          <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantity ? `${item.quantity} • ` : ''} {item.macros.calories} kcal
                          </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${styles.badgeBg} ${styles.badgeText}`}>
                          {styles.icon}
                          <span className="text-[10px] font-bold uppercase">{item.category}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                     <div className="bg-gray-50 p-1.5 rounded text-center">
                         <div className="text-[9px] text-gray-400 uppercase font-bold">Protein</div>
                         <div className="text-xs font-semibold text-gray-700">{item.macros.protein}g</div>
                     </div>
                     <div className="bg-gray-50 p-1.5 rounded text-center">
                         <div className="text-[9px] text-gray-400 uppercase font-bold">Carbs</div>
                         <div className="text-xs font-semibold text-gray-700">{item.macros.carbs}g</div>
                     </div>
                     <div className="bg-gray-50 p-1.5 rounded text-center">
                         <div className="text-[9px] text-gray-400 uppercase font-bold">Fat</div>
                         <div className="text-xs font-semibold text-gray-700">{item.macros.fat}g</div>
                     </div>
                     {item.keyNutrients?.[0] ? (
                        <div className={`p-1.5 rounded text-center ${item.keyNutrients[0].isHigh ? 'bg-orange-50 ring-1 ring-orange-100' : 'bg-gray-50'}`}>
                             <div className={`text-[9px] uppercase font-bold truncate ${item.keyNutrients[0].isHigh ? 'text-orange-600' : 'text-gray-400'}`}>
                                 {item.keyNutrients[0].label}
                             </div>
                             <div className={`text-xs font-semibold ${item.keyNutrients[0].isHigh ? 'text-orange-700' : 'text-gray-700'}`}>
                                 {item.keyNutrients[0].value}
                             </div>
                        </div>
                     ) : (
                        <div className="bg-gray-50 p-1.5 rounded text-center">
                           <div className="text-[9px] text-gray-400 uppercase font-bold">Other</div>
                           <div className="text-xs font-semibold text-gray-400">-</div>
                        </div>
                     )}
                  </div>

                  {/* Additional Dynamic Nutrients Tags */}
                  {item.keyNutrients && item.keyNutrients.length > 1 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                          {item.keyNutrients.slice(1).map((kn, kIdx) => (
                              <span key={kIdx} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${kn.isHigh ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                  {kn.label}: {kn.value}
                              </span>
                          ))}
                      </div>
                  )}

                  <div className={`rounded-lg p-3 border ${styles.bg} ${styles.border}`}>
                      <div className="flex items-start gap-2">
                          <Info size={14} className={`${styles.text} mt-0.5 flex-shrink-0`} />
                          <p className={`text-xs ${styles.text} font-medium leading-snug`}>
                              {item.reason}
                          </p>
                      </div>
                      
                      {!isMenu && (item.category === 'Occasional' || item.category === 'Bad') && item.alternatives && item.alternatives.length > 0 && (
                          <div className={`mt-2 pt-2 border-t ${styles.border} border-dashed`}>
                              <p className={`text-[10px] ${styles.text} uppercase font-bold mb-1 opacity-80`}>Try Instead:</p>
                              <div className="flex flex-wrap gap-2">
                                {item.alternatives.map((alt, i) => (
                                   <span key={i} className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded text-gray-800 border border-gray-100 shadow-sm">
                                      {alt}
                                   </span>
                                ))}
                              </div>
                          </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};