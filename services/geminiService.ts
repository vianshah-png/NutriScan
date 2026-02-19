import { UserProfile, BillAnalysis, ScanMode } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key injected at build time by Vite
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const TEST_PERSONAS: Record<string, UserProfile> = {
  'TEST-USER-01': {
    clientId: 'TEST-USER-01',
    name: "Sarah Jenkins",
    age: "45",
    gender: "Female",
    location: "New York, USA",
    foodPreference: "Non-Vegetarian",
    dietPreference: "DASH Diet",
    conditions: ["Hypertension (High Blood Pressure)"],
    allergies: ["Shellfish"],
    selectedProgram: "Heart Health",
    goals: ["Reduce Sodium < 2000mg", "Increase Potassium", "Lower Blood Pressure"],
    keyInsights: "Sarah needs to strictly monitor salt intake. Processed foods and sauces are her main enemies."
  },
  'TEST-USER-02': {
    clientId: 'TEST-USER-02',
    name: "Mike Ross",
    age: "28",
    gender: "Male",
    location: "Los Angeles, USA",
    foodPreference: "Non-Vegetarian",
    dietPreference: "High Protein",
    conditions: ["None"],
    allergies: ["Peanuts"],
    selectedProgram: "Muscle Gain (Bulking)",
    goals: ["Protein > 180g/day", "Caloric Surplus", "Avoid Empty Sugars"],
    keyInsights: "Mike is active and needs high calorie/protein density. He can tolerate fats but avoids refined sugars."
  },
  'TEST-USER-03': {
    clientId: 'TEST-USER-03',
    name: "Linda Chen",
    age: "52",
    gender: "Female",
    location: "Toronto, Canada",
    foodPreference: "Vegetarian",
    dietPreference: "Low Glycemic Index",
    conditions: ["Type 2 Diabetes"],
    allergies: ["Dairy (Lactose Intolerant)"],
    selectedProgram: "Blood Sugar Control",
    goals: ["Manage Carbs", "Increase Fiber", "Stable Glucose Levels"],
    keyInsights: "Linda must watch carbohydrate spikes. Needs complex carbs and fiber-rich vegetables."
  },
  'TEST-USER-04': {
    clientId: 'TEST-USER-04',
    name: "David Miller",
    age: "35",
    gender: "Male",
    location: "Austin, USA",
    foodPreference: "Non-Vegetarian",
    dietPreference: "Keto",
    conditions: ["Obesity Class 1"],
    allergies: [],
    selectedProgram: "Weight Loss",
    goals: ["Carbs < 30g/day", "High Healthy Fats", "Lose 10kg"],
    keyInsights: "David is on strict Keto. Any hidden sugars or starches are a 'Bad' match. High fat is 'Good'."
  },
  'TEST-USER-05': {
    clientId: 'TEST-USER-05',
    name: "Emma Wilson",
    age: "24",
    gender: "Female",
    location: "Berlin, Germany",
    foodPreference: "Vegan",
    dietPreference: "Plant-Based",
    conditions: ["Iron Deficiency"],
    allergies: ["Gluten"],
    selectedProgram: "General Wellness",
    goals: ["Iron Rich Foods", "Complete Proteins", "Gluten Free"],
    keyInsights: "Emma is Vegan and Gluten-free. She needs to ensure she gets enough Iron and Protein from plant sources."
  }
};

export const fetchUserProfile = async (clientId: string): Promise<UserProfile> => {
  const upperId = clientId.toUpperCase();
  if (TEST_PERSONAS[upperId]) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return TEST_PERSONAS[upperId];
  }
  return TEST_PERSONAS['TEST-USER-01'];
};

/**
 * Converts a File to a base64 string (without the data URL prefix).
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes an image by calling Google Gemini API directly from the browser.
 * This bypasses Vercel's serverless function size limits entirely.
 * The image goes directly: Browser → Google Gemini API (no middleman).
 */
export const analyzeImage = async (
  file: File,
  userProfile: UserProfile,
  mode: ScanMode
): Promise<BillAnalysis> => {

  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Set VITE_GEMINI_API_KEY in environment variables.");
  }

  console.log(`[Frontend] Calling Gemini directly. File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  console.log(`[Frontend] Scan Mode: ${mode}, User: ${userProfile.name}`);

  const startTime = Date.now();

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert file to base64
    const base64Data = await fileToBase64(file);
    console.log(`[Frontend] Image converted to base64 (${(base64Data.length / 1024).toFixed(0)} KB)`);

    // Build the prompt
    const systemContext = `
      You are an expert nutritionist for Balance Nutrition.
      User Profile: ${userProfile.name}, Location: ${userProfile.location}, Goals: ${userProfile.goals?.join(', ')}, Conditions: ${userProfile.conditions?.join(', ')}, Diet: ${userProfile.dietPreference}.
    `;

    let taskPrompt = "";

    if (mode === 'RECEIPT') {
      taskPrompt = `
      **MODE: RECEIPT/BILL ANALYSIS (Past Tense)**
      1. **IDENTIFY**: Identify the restaurant (if visible) or store. List all food items purchased.
      2. **NUTRIENTS**: Extract Macros (Cal, Prot, Carb, Fat) based on standard nutritional data.
      3. **KEY NUTRIENTS**: IMPORTANT! Highlight specific nutrients relevant to the item and the user's condition.
          - Example: Diabetic User + Fruit Juice -> Show "Fructose/Added Sugar".
          - Example: Hypertensive User + Chips -> Show "Sodium".
      4. **SCORING**: Score the entire bill (0-100) based on how well it fits the user's specific health goals.
      `;
    } else {
      taskPrompt = `
      **MODE: MENU RECOMMENDATION (Future Tense)**
      1. **IDENTIFY**: Identify the restaurant from the menu.
      2. **RECOMMEND**: List the visible dishes in the image.
      3. **CATEGORIZE**:
          - 'Good': Best options for this user.
          - 'Fair': Okay options.
          - 'Bad': Dishes to avoid (e.g. allergens, breaking diet rules).
      4. **NUTRIENTS**: Estimate Macros per serving based on standard restaurant recipes.
      5. **KEY NUTRIENTS**: Highlight specific contents (e.g. "Contains Maida", "High Sodium", "Rich in Fiber").
      6. **SCORING**: Give a "Suitability Score" (0-100) for how friendly this restaurant is overall for the user.
      `;
    }

    const jsonSchema = `
    RESPOND ONLY WITH VALID JSON matching this exact schema (no markdown, no code blocks, just raw JSON):
    {
      "restaurantName": "string or null",
      "type": "${mode}",
      "items": [
        {
          "name": "string",
          "quantity": "string or null",
          "macros": { "calories": number, "protein": number, "carbs": number, "fat": number },
          "keyNutrients": [ { "label": "string", "value": "string", "isHigh": boolean } ],
          "category": "Good" | "Fair" | "Occasional" | "Bad",
          "reason": "string",
          "alternatives": ["string"]
        }
      ],
      "totalMacros": { "calories": number, "protein": number, "carbs": number, "fat": number },
      "healthScore": number (0-100),
      "summary": "string"
    }`;

    const fullPrompt = `${systemContext}\n${taskPrompt}\n${jsonSchema}`;

    // Call Gemini with the image
    console.log(`[Frontend] Sending to Gemini API...`);
    const result = await model.generateContent([
      fullPrompt,
      {
        inlineData: {
          mimeType: file.type || 'image/jpeg',
          data: base64Data,
        },
      },
    ]);

    const duration = Date.now() - startTime;
    console.log(`[Frontend] Gemini responded in ${duration}ms`);

    const responseText = result.response.text();
    console.log(`[Frontend] Raw response (first 500 chars):`, responseText.substring(0, 500));

    // Parse JSON from response (handle potential markdown wrapping)
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const analysisData = JSON.parse(cleanJson);
    console.log(`[Frontend] Parsed analysis data:`, analysisData);

    // Hydrate with client-side IDs
    return {
      ...analysisData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: mode,
    };

  } catch (error: any) {
    console.error("[Frontend] Gemini API Call Failed:", error);
    throw new Error(`Analysis failed: ${error.message || 'Unknown error'}`);
  }
};