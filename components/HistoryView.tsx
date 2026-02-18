import React, { useMemo, useState } from 'react';
import { BillAnalysis, UserProfile, AnalysisItem } from '../types';
import { Calendar, ChevronRight, ShoppingBag, TrendingUp, ArrowLeft, List, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface HistoryViewProps {
  history: BillAnalysis[];
  userProfile: UserProfile;
  onSelectAnalysis: (analysis: BillAnalysis) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, userProfile, onSelectAnalysis, onBack }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'TRENDS'>('LIST');

  // Logic to determine the primary metric to track based on user conditions/goals
  const primaryMetric = useMemo(() => {
    const conditions = userProfile.conditions.join(' ').toLowerCase();
    const goals = userProfile.goals.join(' ').toLowerCase();
    const program = userProfile.selectedProgram.toLowerCase();

    if (conditions.includes('hypertension') || conditions.includes('blood pressure') || goals.includes('sodium')) {
      return { label: 'Sodium', key: 'sodium', unit: 'mg', color: '#EF4444' }; // Red for danger
    }
    if (program.includes('muscle') || goals.includes('protein')) {
      return { label: 'Protein', key: 'protein', unit: 'g', color: '#10B981' }; // Green for good
    }
    if (conditions.includes('diabetes') || goals.includes('sugar') || goals.includes('carbs')) {
      return { label: 'Carbs', key: 'carbs', unit: 'g', color: '#F59E0B' }; // Orange for caution
    }
    if (userProfile.dietPreference === 'Keto') {
        return { label: 'Fat', key: 'fat', unit: 'g', color: '#F59E0B' };
    }
    // Default
    return { label: 'Calories', key: 'calories', unit: 'kcal', color: '#3B82F6' };
  }, [userProfile]);

  // Aggregate Stats
  const stats = useMemo(() => {
    return history.reduce((acc, curr) => ({
      totalItems: acc.totalItems + curr.items.length,
      avgScore: acc.avgScore + curr.healthScore,
      // For the summary card, we just grab macros if available
      totalMetric: acc.totalMetric + (curr.totalMacros ? (curr.totalMacros[primaryMetric.key as keyof typeof curr.totalMacros] || 0) : 0)
    }), { totalItems: 0, avgScore: 0, totalMetric: 0 });
  }, [history, primaryMetric]);

  const finalAvgScore = history.length > 0 ? Math.round(stats.avgScore / history.length) : 0;

  // Transform Data for Charts
  const chartData = useMemo(() => {
    // 1. Filter for Receipts only (Intake)
    // 2. Reverse so it reads Oldest -> Newest (Left to Right)
    return history
      .filter(h => h.type === 'RECEIPT')
      .slice()
      .reverse()
      .map(h => {
        // Calculate special metrics like Sodium that might be nested in items
        let customMetricValue = 0;
        
        if (primaryMetric.key === 'sodium' || primaryMetric.key === 'sugar') {
            // Aggregate from items
            h.items.forEach(item => {
                const found = item.keyNutrients.find(k => k.label.toLowerCase().includes(primaryMetric.key));
                if (found) {
                    // Extract number from string like "120mg" or "15g"
                    const val = parseFloat(found.value.replace(/[^0-9.]/g, ''));
                    if (!isNaN(val)) customMetricValue += val;
                }
            });
        } else if (h.totalMacros) {
            // Standard macros
             customMetricValue = h.totalMacros[primaryMetric.key as keyof typeof h.totalMacros] || 0;
        }

        return {
            id: h.id,
            date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullDate: new Date(h.date).toLocaleDateString(),
            healthScore: h.healthScore,
            calories: h.totalMacros?.calories || 0,
            protein: h.totalMacros?.protein || 0,
            carbs: h.totalMacros?.carbs || 0,
            fat: h.totalMacros?.fat || 0,
            customMetric: Math.round(customMetricValue)
        };
      });
  }, [history, primaryMetric]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(date);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-gray-800 mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
             <div key={idx} className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-gray-500 capitalize">{p.name}:</span>
                <span className="font-bold text-gray-900">{p.value}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-100">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2">
                <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-gray-800">Your Progress</h1>
        </div>
        
        {/* Toggle View */}
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button 
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <List size={18} strokeWidth={2.5} />
            </button>
            <button 
                onClick={() => setViewMode('TRENDS')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'TRENDS' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <LineChartIcon size={18} strokeWidth={2.5} />
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Summary Card (Always Visible) */}
        <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
          <div className="flex items-center justify-between mb-4 opacity-90">
             <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Lifetime Stats</h3>
             </div>
             <span className="text-[10px] bg-teal-700 px-2 py-1 rounded text-teal-100 border border-teal-500">
                {userProfile.selectedProgram}
             </span>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
               <div className="text-teal-100 text-xs font-medium mb-1">Total Bills Scanned</div>
               <div className="text-2xl font-bold">{history.length}</div>
            </div>
            <div>
               <div className="text-teal-100 text-xs font-medium mb-1">Avg Health Score</div>
               <div className="text-2xl font-bold">{finalAvgScore}</div>
            </div>
            {/* Conditional Metric */}
            <div className="col-span-2 pt-4 border-t border-teal-500/30 flex items-center justify-between">
               <div>
                    <div className="text-teal-100 text-xs font-medium mb-1">Focus: {primaryMetric.label}</div>
                    <div className="text-lg font-bold leading-none">
                        {/* Note: This total metric in summary is rough approximation based on list reducer */}
                        {stats.totalMetric > 0 ? stats.totalMetric.toLocaleString() : 'N/A'} 
                        <span className="text-xs font-normal opacity-80 ml-1">{primaryMetric.unit} (Total)</span>
                    </div>
               </div>
               <Activity className="text-teal-300 opacity-50" size={32} />
            </div>
          </div>
        </div>

        {/* --- VIEW MODE: LIST --- */}
        {viewMode === 'LIST' && (
            <div>
            <h3 className="font-bold text-gray-800 mb-4 px-1 flex items-center justify-between">
                <span>Recent Scans</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{history.length}</span>
            </h3>
            
            {history.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No scans yet.</p>
                <p className="text-xs text-gray-400 mt-1">Scan your first bill to see history.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {history.slice().reverse().map((analysis) => (
                    <button 
                    key={analysis.id}
                    onClick={() => onSelectAnalysis(analysis)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.99]"
                    >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                            analysis.healthScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                            analysis.healthScore >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {analysis.healthScore}
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-gray-900 mb-0.5">
                                {analysis.restaurantName || (analysis.type === 'RECEIPT' ? 'Grocery Run' : 'Dine In')}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <Calendar size={12} />
                                <span>{formatDate(analysis.date)}</span>
                                <span>•</span>
                                <span>{analysis.items.length} Items</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                    </button>
                ))}
                </div>
            )}
            </div>
        )}

        {/* --- VIEW MODE: TRENDS --- */}
        {viewMode === 'TRENDS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {chartData.length < 2 ? (
                     <div className="text-center py-12 opacity-50 border-2 border-dashed border-gray-200 rounded-xl">
                        <LineChartIcon size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">Not enough data.</p>
                        <p className="text-xs text-gray-400 mt-1">Scan at least 2 receipts to unlock trends.</p>
                    </div>
                ) : (
                    <>
                        {/* 1. Health Score Trend */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-teal-500 rounded-full"></div>
                                Shopping Health Score
                            </h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="healthScore" 
                                            name="Score"
                                            stroke="#14b8a6" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorScore)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Primary Goal Metric Trend */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 rounded-full" style={{backgroundColor: primaryMetric.color}}></div>
                                {primaryMetric.label} Trend ({primaryMetric.unit})
                            </h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={primaryMetric.color} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={primaryMetric.color} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="customMetric" 
                                            name={primaryMetric.label}
                                            stroke={primaryMetric.color} 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorMetric)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                Tracking total {primaryMetric.label.toLowerCase()} per shopping trip based on your {userProfile.selectedProgram} goal.
                            </p>
                        </div>

                        {/* 3. Calorie Fluctuations */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gray-800 rounded-full"></div>
                                Calorie Intake
                            </h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="calories" name="Calories" fill="#1f2937" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}

      </div>
    </div>
  );
};