import { UserProfile, BillAnalysis, ScanMode } from "../types";

// Removed GoogleGenAI import - Frontend is now thin client

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
 * Analyzes an image by sending it to the Node.js backend endpoint.
 * This makes the frontend lightweight and mobile-app ready.
 */
export const analyzeImage = async (
  file: File,
  userProfile: UserProfile,
  mode: ScanMode
): Promise<BillAnalysis> => {

  // Prepare FormData for the API Endpoint
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userProfile', JSON.stringify(userProfile));
  formData.append('mode', mode);

  // Call the Node.js Microservice
  const API_URL = '/api/analyze';

  console.log(`[Frontend] Preparing to send request to ${API_URL}`);
  console.log(`[Frontend] Scan Mode: ${mode}, File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

  const startTime = Date.now();

  try {
    console.log(`[Frontend] Sending fetch request...`);
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[Frontend] Received response status ${response.status} in ${duration}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Frontend] Error Response:`, errorData);
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const analysisData = await response.json();
    console.log(`[Frontend] Analysis Data Parsed Successfully:`, analysisData);

    // Hydrate with client-side IDs
    return {
      ...analysisData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: mode
    };

  } catch (error) {
    console.error("[Frontend] API Call Failed", error);
    throw new Error("Failed to connect to analysis server. Ensure Node.js backend is running.");
  }
};