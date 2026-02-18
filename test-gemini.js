import 'dotenv/config';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
    console.log("Testing Gemini API connection...");
    console.log("Using Key starting with:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: 'Hello, are you working? Respond with "Working!"',
        });

        console.log("Response:", text);
        if (text.includes("Working")) {
            console.log("✅ Gemini API is working correctly!");
        } else {
            console.log("❓ Unexpected response, but communication worked.");
        }
    } catch (error) {
        console.error("❌ Gemini API Test Failed!");
        console.error("Error Code:", error.code || 'N/A');
        console.error("Error Message:", error.message);

        if (error.message.includes("API key not valid")) {
            console.error("\nTIP: Your API key is still invalid. Please check Google AI Studio for a fresh key.");
        }
    }
}

test();
