import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI Providers
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
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
 * Serverless endpoint for analyzing food/receipt images.
 */
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    console.log(`[${new Date().toISOString()}] Received analysis request`);

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        // Parse Metadata
        const userProfile = JSON.parse(req.body.userProfile || '{}');
        const mode = req.body.mode || 'RECEIPT';

        console.log(`Processing ${mode} for user: ${userProfile.name || 'Anonymous'}`);

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

        // Call Vercel AI SDK
        const result = await generateObject({
            model: model,
            schema: schema,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image', image: req.file.buffer }
                    ]
                }
            ]
        });

        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] AI Processing Complete in ${duration}ms`);

        const finalResult = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user: userProfile.name || 'Anonymous',
            mode: mode,
            ...result.object
        };

        res.json(finalResult);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to process image", details: error.message });
    }
});

export default app;
