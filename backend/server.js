import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Single route for AI recommendations
app.post('/api/recommendations', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "A search query is required." });
  }

  try {
    console.log(`\n--- New Search Request: "${query}" ---`);

    // =========================================================
    // STEP 1: Fetch live Google Shopping data via SerpApi
    // =========================================================
    const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`;
    
    console.log("1. Fetching live data from SerpApi...");
    const searchResponse = await fetch(serpUrl);
    const searchData = await searchResponse.json();
    
    const rawProducts = searchData.shopping_results || [];

    // --- SAFETY CHECK 1: Did SerpApi actually find anything? ---
    if (rawProducts.length === 0) {
      console.log(`-> SerpApi found 0 shopping results for: "${query}". Try a more specific shopping term.`);
      return res.json([]); // Send an empty array back to React safely
    }

    console.log(`-> Found ${rawProducts.length} products on Google Shopping.`);

    // Simplify the data so we don't hit Gemini's token limits
    // We slice the top 15 results to save processing time and tokens
    const simplifiedCatalog = rawProducts.slice(0, 15).map((p, index) => ({
      // Fallback to index/position if a distinct product_id is missing
      id: p.product_id || p.position || String(index), 
      title: p.title,
      price: p.price,
      source: p.source
    }));

    // =========================================================
    // STEP 2: Ask Gemini to filter and rank the live results
    // =========================================================
    console.log("2. Sending data to Gemini for AI selection...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const aiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are a strict shopping assistant. Review the provided JSON list of real products from Google Shopping. Identify up to 5 products that best match the user's specific request. Return ONLY a valid JSON array of the IDs like ["1", "2"]. Do not include any other text, markdown, or explanations.`
          }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: `User Query: "${query}"\n\nLive Results: ${JSON.stringify(simplifiedCatalog)}` }]
        }],
        generationConfig: { 
          temperature: 0, 
          responseMimeType: "application/json" // Force Gemini to return valid JSON
        }
      })
    });

    const aiData = await aiResponse.json();

    // --- SAFETY CHECK 2: Catch Gemini server errors ---
    if (aiData.error) {
      console.log("-> GEMINI API ERROR:", aiData.error.message);
      throw new Error(`Gemini Error: ${aiData.error.message}`);
    }

    // Extract and parse the array of IDs that Gemini chose
    const textResponse = aiData.candidates[0].content.parts[0].text;
    const recommendedIds = JSON.parse(textResponse);
    console.log("-> Gemini selected these IDs:", recommendedIds);

    // =========================================================
    // STEP 3: Map IDs back to the rich data and return to React
    // =========================================================
    const finalSelection = rawProducts.filter((p, index) => {
      const currentId = p.product_id || p.position || String(index);
      // Check for both string and number formats just in case
      return recommendedIds.includes(String(currentId)) || recommendedIds.includes(Number(currentId));
    });

    console.log(`3. Sending ${finalSelection.length} final products back to the frontend.\n`);
    res.json(finalSelection);

  } catch (error) {
    console.error("Backend Error Caught:", error.message);
    res.status(500).json({ error: "Failed to fetch live recommendations." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});