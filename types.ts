export interface KeyNutrient {
  label: string;
  value: string;
  unit?: string;
  isHigh?: boolean; // Highlight if this is a significant amount (e.g. High Sugar)
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Sodium is now moved to keyNutrients if relevant, but we keep it optional here for backward compat or totals
  sodium?: number; 
}

export type HealthCategory = 'Good' | 'Fair' | 'Occasional' | 'Bad';

export interface AnalysisItem {
  name: string;
  quantity?: string; // Optional for menus
  macros: MacroNutrients;
  keyNutrients: KeyNutrient[]; // Dynamic list: Sugar, Caffeine, Vitamin C, etc.
  category: HealthCategory;
  reason: string;
  alternatives?: string[];
}

export type ScanMode = 'RECEIPT' | 'MENU';

export interface BillAnalysis {
  id: string;
  date: string;
  type: ScanMode;
  restaurantName?: string; // Identified restaurant name
  items: AnalysisItem[];
  totalMacros?: MacroNutrients; // Only relevant for Receipts
  healthScore: number; // For Receipts: Health Score. For Menus: Suitability Score.
  summary: string;
  // Metadata for multi-page scans
  scanProgress?: {
    current: number;
    total: number;
  };
}

export interface UserProfile {
  clientId: string;
  name: string;
  age: string;
  gender: string;
  location: string;
  foodPreference: string; 
  dietPreference: string; 
  conditions: string[]; 
  allergies: string[];
  selectedProgram: string; 
  goals: string[];
  keyInsights: string; 
}

export enum AppView {
  PROFILE_SETUP = 'PROFILE_SETUP',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  RESULTS = 'RESULTS',
  HISTORY = 'HISTORY'
}