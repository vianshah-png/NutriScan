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
 * Compresses an image and returns it as a base64 data URL.
 * Aggressively sized to stay well under Vercel's 4.5MB payload limit.
 */
const compressImageToBase64 = async (file: File, maxSize = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down proportionally
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Get base64 data URL
      const base64 = canvas.toDataURL('image/jpeg', quality);
      const sizeKB = Math.round((base64.length * 3) / 4 / 1024); // approx decoded size
      console.log(`[Frontend] Compressed: ${(file.size / 1024).toFixed(0)}KB → ~${sizeKB}KB base64 (${width}x${height})`);
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
};

/**
 * Analyzes an image by sending it to the backend endpoint.
 * Uses JSON with base64 image to avoid multipart/form-data overhead.
 */
export const analyzeImage = async (
  file: File,
  userProfile: UserProfile,
  mode: ScanMode
): Promise<BillAnalysis> => {

  // Compress image to base64 to stay under Vercel's 4.5MB limit
  const imageBase64 = await compressImageToBase64(file);
  console.log(`[Frontend] Original: ${(file.size / 1024).toFixed(2)} KB, Base64 length: ${(imageBase64.length / 1024).toFixed(2)} KB`);

  // Send as JSON instead of FormData (much less overhead)
  const payload = {
    image: imageBase64,
    userProfile: userProfile,
    mode: mode,
  };

  const API_URL = '/api/analyze';

  console.log(`[Frontend] Preparing to send JSON request to ${API_URL}`);
  console.log(`[Frontend] Scan Mode: ${mode}, Payload size: ${(JSON.stringify(payload).length / 1024).toFixed(2)} KB`);

  const startTime = Date.now();

  try {
    console.log(`[Frontend] Sending fetch request...`);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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