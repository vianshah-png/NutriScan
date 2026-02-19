import express from 'express';
import cors from 'cors';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const app = express();

// Middleware - increase JSON body limit to 4.5MB (Vercel's max)
app.use(cors());
app.use(express.json({ limit: '4.5mb' }));

// Initialize AI Providers
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY,
});

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/analyze
 * Accepts JSON body with base64-encoded image.
 * Body: { image: "data:image/jpeg;base64,...", userProfile: {...}, mode: "RECEIPT"|"MENU" }
 */
app.post('/api/analyze', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Received analysis request`);

    try {
        const { image, userProfile, mode } = req.body;

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        const profile = typeof userProfile === 'string' ? JSON.parse(userProfile) : (userProfile || {});
        const scanMode = mode || 'RECEIPT';

        console.log(`Processing ${scanMode} for user: ${profile.name || 'Anonymous'}`);

        // Get AI Provider from Env or Request
        const providerName = process.env.AI_PROVIDER || 'google';
        const modelName = providerName === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash';

        console.log(`Using Provider: ${providerName}, Model: ${modelName}`);

        const model = providerName === 'openai'
            ? openai(modelName)
            : google(modelName);

        // --- PROMPT ENGINEERING ---
        const systemContext = `
            You are an expert nutritionist for Balance Nutrition.
            User Profile: ${profile.name}, Location: ${profile.location}, Goals: ${profile.goals?.join(', ')}, Conditions: ${profile.conditions?.join(', ')}, Diet: ${profile.dietPreference}.
        `;

        let taskPrompt = "";

        if (scanMode === 'RECEIPT') {
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

        const prompt = `${systemContext}\n${taskPrompt}`;

        // Define Schema using Zod
        const schema = z.object({
            restaurantName: z.string().optional(),
            type: z.enum(['RECEIPT', 'MENU']),
            items: z.array(z.object({
                name: z.string(),
                quantity: z.string().optional(),
                macros: z.object({
                    calories: z.number(),
                    protein: z.number(),
                    carbs: z.number(),
                    fat: z.number()
                }),
                keyNutrients: z.array(z.object({
                    label: z.string().describe("e.g. Sugar, Caffeine, Sodium, Vitamin A"),
                    value: z.string().describe("e.g. 15g, 120mg"),
                    isHigh: z.boolean().optional()
                })).optional(),
                category: z.enum(['Good', 'Fair', 'Occasional', 'Bad']),
                reason: z.string(),
                alternatives: z.array(z.string()).optional()
            })),
            totalMacros: z.object({
                calories: z.number(),
                protein: z.number(),
                carbs: z.number(),
                fat: z.number()
            }).optional(),
            healthScore: z.number(),
            summary: z.string()
        });

        console.log(`[${new Date().toISOString()}] Sending request to AI Provider (${providerName})...`);
        const startTime = Date.now();

        // Convert base64 data URL to buffer for the AI SDK
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Call Vercel AI SDK
        const result = await generateObject({
            model: model,
            schema: schema,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image', image: imageBuffer }
                    ]
                }
            ]
        });

        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] AI Processing Complete in ${duration}ms`);

        const finalResult = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user: profile.name || 'Anonymous',
            mode: scanMode,
            ...result.object
        };

        res.json(finalResult);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to process image", details: error.message });
    }
});

export default app;
