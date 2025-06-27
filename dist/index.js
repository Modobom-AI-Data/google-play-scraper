import { serve } from "@hono/node-server";
import { Hono } from "hono";
import * as gplay from "google-play-scraper";
import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
const app = new Hono();
// Serve static HTML page
app.get("/", (c) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Play Game Scraper</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .form-section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 15px;
            border-left: 5px solid #4facfe;
        }
        
        .form-section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #4facfe;
            box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
        }
        
        .checkbox-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            border: 2px solid #e1e5e9;
            transition: all 0.3s ease;
        }
        
        .checkbox-item:hover {
            border-color: #4facfe;
            background: #f0f8ff;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
            transform: scale(1.2);
        }
        
        .scrape-btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
        }
        
        .scrape-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
        }
        
        .scrape-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .progress {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            display: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: #e1e5e9;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4facfe, #00f2fe);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .results {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            display: none;
        }
        
        .alert {
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f1aeb5;
        }
        
        .download-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4facfe;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .method-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border-left: 4px solid #2196f3;
        }
        
        .method-info small {
            color: #1976d2;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Google Play Game Scraper</h1>
            <p>Extract and export Google Play Store game data to CSV</p>
        </div>
        
        <div class="content">
            <form id="scraperForm">
                <!-- Scraping Method Section -->
                <div class="form-section">
                    <h3>📊 Scraping Method</h3>
                    <div class="form-group">
                        <label for="method">Choose scraping method:</label>
                        <select id="method" name="method" required>
                            <option value="">Select a method...</option>
                            <option value="list">List Games (from collections like Top Free, Top Paid)</option>
                            <option value="search">Search Games (by keyword)</option>
                            <option value="developer">Developer Games (all games by a developer)</option>
                            <option value="category">Category Games (games from specific category)</option>
                        </select>
                    </div>
                    
                    <!-- Dynamic method-specific options -->
                    <div id="methodOptions"></div>
                </div>
                
                <!-- Data Fields Section -->
                <div class="form-section">
                    <h3>📋 Data Fields to Export</h3>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-title" name="fields" value="title" checked>
                            <label for="field-title">Title</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-appId" name="fields" value="appId" checked>
                            <label for="field-appId">App ID</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-developer" name="fields" value="developer" checked>
                            <label for="field-developer">Developer</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-genre" name="fields" value="genre">
                            <label for="field-genre">Genre</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-score" name="fields" value="score">
                            <label for="field-score">Rating Score</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-ratings" name="fields" value="ratings">
                            <label for="field-ratings">Rating Count</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-installs" name="fields" value="installs">
                            <label for="field-installs">Install Count</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-price" name="fields" value="price">
                            <label for="field-price">Price</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-free" name="fields" value="free">
                            <label for="field-free">Free Status</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-summary" name="fields" value="summary">
                            <label for="field-summary">Summary</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-url" name="fields" value="url">
                            <label for="field-url">Play Store URL</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="field-icon" name="fields" value="icon">
                            <label for="field-icon">Icon URL</label>
                        </div>
                    </div>
                </div>
                
                <!-- Advanced Options -->
                <div class="form-section">
                    <h3>⚙️ Advanced Options</h3>
                    <div class="form-group">
                        <label for="fullDetail">
                            <input type="checkbox" id="fullDetail" name="fullDetail" style="width: auto; margin-right: 10px;">
                            Get full details for each app (slower but more complete data)
                        </label>
                    </div>
                    <div class="form-group">
                        <label for="throttle">Request throttle (requests per second, 0 = no limit):</label>
                        <input type="number" id="throttle" name="throttle" min="0" max="50" value="5" placeholder="5">
                        <small style="color: #666;">Recommended: 5-10 to avoid getting blocked</small>
                    </div>
                </div>
                
                <button type="submit" class="scrape-btn" id="scrapeBtn">
                    🚀 Start Scraping
                </button>
            </form>
            
            <div class="progress" id="progress">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Progress</span>
                    <span id="progressText">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div id="statusText" style="margin-top: 10px; color: #666;"></div>
            </div>
            
            <div class="results" id="results"></div>
        </div>
    </div>
    
    <script>
        const methodSelect = document.getElementById('method');
        const methodOptions = document.getElementById('methodOptions');
        const form = document.getElementById('scraperForm');
        const scrapeBtn = document.getElementById('scrapeBtn');
        const progress = document.getElementById('progress');
        const results = document.getElementById('results');
        
        // Method-specific options
        const methodConfigs = {
            list: {
                html: \`
                    <div class="form-group">
                        <label for="collection">Collection:</label>
                        <select id="collection" name="collection" required>
                            <option value="TOP_FREE">Top Free</option>
                            <option value="TOP_PAID">Top Paid</option>
                            <option value="TOP_GROSSING">Top Grossing</option>
                            <option value="NEW_FREE">New Free</option>
                            <option value="NEW_PAID">New Paid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="category">Category (optional):</label>
                        <select id="category" name="category">
                            <option value="">All Categories</option>
                            <option value="GAME">Games</option>
                            <option value="GAME_ACTION">Action Games</option>
                            <option value="GAME_ADVENTURE">Adventure Games</option>
                            <option value="GAME_ARCADE">Arcade Games</option>
                            <option value="GAME_BOARD">Board Games</option>
                            <option value="GAME_CARD">Card Games</option>
                            <option value="GAME_CASINO">Casino Games</option>
                            <option value="GAME_CASUAL">Casual Games</option>
                            <option value="GAME_EDUCATIONAL">Educational Games</option>
                            <option value="GAME_MUSIC">Music Games</option>
                            <option value="GAME_PUZZLE">Puzzle Games</option>
                            <option value="GAME_RACING">Racing Games</option>
                            <option value="GAME_ROLE_PLAYING">RPG Games</option>
                            <option value="GAME_SIMULATION">Simulation Games</option>
                            <option value="GAME_SPORTS">Sports Games</option>
                            <option value="GAME_STRATEGY">Strategy Games</option>
                            <option value="GAME_TRIVIA">Trivia Games</option>
                            <option value="GAME_WORD">Word Games</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="num">Number of games to scrape:</label>
                        <input type="number" id="num" name="num" min="1" max="500" value="50" required>
                    </div>
                    <div class="method-info">
                        <small>This will get games from Google Play collections like "Top Free Games" or "New Games"</small>
                    </div>
                \`,
            },
            search: {
                html: \`
                    <div class="form-group">
                        <label for="term">Search term:</label>
                        <input type="text" id="term" name="term" placeholder="e.g., minecraft, action games, puzzle" required>
                    </div>
                    <div class="form-group">
                        <label for="num">Number of results:</label>
                        <input type="number" id="num" name="num" min="1" max="250" value="20" required>
                    </div>
                    <div class="form-group">
                        <label for="price">Price filter:</label>
                        <select id="price" name="price">
                            <option value="all">All (Free + Paid)</option>
                            <option value="free">Free only</option>
                            <option value="paid">Paid only</option>
                        </select>
                    </div>
                    <div class="method-info">
                        <small>Search for games using keywords. Results are ranked by relevance.</small>
                    </div>
                \`,
            },
            developer: {
                html: \`
                    <div class="form-group">
                        <label for="devId">Developer name:</label>
                        <input type="text" id="devId" name="devId" placeholder="e.g., Supercell, King, Rovio Entertainment" required>
                    </div>
                    <div class="form-group">
                        <label for="num">Number of games:</label>
                        <input type="number" id="num" name="num" min="1" max="60" value="20" required>
                    </div>
                    <div class="method-info">
                        <small>Get all games published by a specific developer</small>
                    </div>
                \`,
            },
            category: {
                html: \`
                    <div class="form-group">
                        <label for="category">Game Category:</label>
                        <select id="category" name="category" required>
                            <option value="GAME_ACTION">Action Games</option>
                            <option value="GAME_ADVENTURE">Adventure Games</option>
                            <option value="GAME_ARCADE">Arcade Games</option>
                            <option value="GAME_BOARD">Board Games</option>
                            <option value="GAME_CARD">Card Games</option>
                            <option value="GAME_CASINO">Casino Games</option>
                            <option value="GAME_CASUAL">Casual Games</option>
                            <option value="GAME_EDUCATIONAL">Educational Games</option>
                            <option value="GAME_MUSIC">Music Games</option>
                            <option value="GAME_PUZZLE">Puzzle Games</option>
                            <option value="GAME_RACING">Racing Games</option>
                            <option value="GAME_ROLE_PLAYING">RPG Games</option>
                            <option value="GAME_SIMULATION">Simulation Games</option>
                            <option value="GAME_SPORTS">Sports Games</option>
                            <option value="GAME_STRATEGY">Strategy Games</option>
                            <option value="GAME_TRIVIA">Trivia Games</option>
                            <option value="GAME_WORD">Word Games</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="collection">Collection within category:</label>
                        <select id="collection" name="collection" required>
                            <option value="TOP_FREE">Top Free</option>
                            <option value="TOP_PAID">Top Paid</option>
                            <option value="TOP_GROSSING">Top Grossing</option>
                            <option value="NEW_FREE">New Free</option>
                            <option value="NEW_PAID">New Paid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="num">Number of games:</label>
                        <input type="number" id="num" name="num" min="1" max="500" value="50" required>
                    </div>
                    <div class="method-info">
                        <small>Get games from a specific category with chosen collection type</small>
                    </div>
                \`,
            },
        };
        
        methodSelect.addEventListener('change', function() {
            const method = this.value;
            if (method && methodConfigs[method]) {
                methodOptions.innerHTML = methodConfigs[method].html;
            } else {
                methodOptions.innerHTML = '';
            }
        });
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const selectedFields = Array.from(formData.getAll('fields'));
            
            if (selectedFields.length === 0) {
                alert('Please select at least one data field to export');
                return;
            }
            
            // Build request data
            const requestData = {
                method: formData.get('method'),
                fields: selectedFields,
                fullDetail: formData.has('fullDetail'),
                throttle: parseInt(formData.get('throttle')) || 0,
            };
            
            // Add method-specific parameters
            const method = formData.get('method');
            if (method === 'list' || method === 'category') {
                requestData.collection = formData.get('collection');
                requestData.category = formData.get('category');
                requestData.num = parseInt(formData.get('num'));
            } else if (method === 'search') {
                requestData.term = formData.get('term');
                requestData.num = parseInt(formData.get('num'));
                requestData.price = formData.get('price');
            } else if (method === 'developer') {
                requestData.devId = formData.get('devId');
                requestData.num = parseInt(formData.get('num'));
            }
            
            // Start scraping
            scrapeBtn.disabled = true;
            scrapeBtn.innerHTML = '<div class="loading"></div>Scraping...';
            progress.style.display = 'block';
            results.style.display = 'none';
            
            try {
                const response = await fetch('/api/scrape', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });
                
                if (!response.ok) {
                    throw new Error('Scraping failed');
                }
                
                // Handle streaming response for progress updates
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (line.trim() && line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                updateProgress(data);
                            } catch (e) {
                                console.log('Progress update:', line);
                            }
                        }
                    }
                }
                
            } catch (error) {
                showError('Scraping failed: ' + error.message);
            } finally {
                scrapeBtn.disabled = false;
                scrapeBtn.innerHTML = '🚀 Start Scraping';
            }
        });
        
        function updateProgress(data) {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const statusText = document.getElementById('statusText');
            
            if (data.progress !== undefined) {
                progressFill.style.width = data.progress + '%';
                progressText.textContent = Math.round(data.progress) + '%';
            }
            
            if (data.status) {
                statusText.textContent = data.status;
            }
            
            if (data.completed && data.filename) {
                showSuccess('Scraping completed successfully!', data.filename, data.count);
            }
            
            if (data.error) {
                showError(data.error);
            }
        }
        
        function showSuccess(message, filename, count) {
            progress.style.display = 'none';
            results.style.display = 'block';
            results.innerHTML = \`
                <div class="alert alert-success">
                    <strong>✅ Success!</strong> \${message}<br>
                    <strong>Games scraped:</strong> \${count}<br>
                    <strong>File:</strong> \${filename}
                    <br><br>
                    <a href="/download/\${filename}" class="download-btn">📥 Download CSV</a>
                </div>
            \`;
        }
        
        function showError(message) {
            progress.style.display = 'none';
            results.style.display = 'block';
            results.innerHTML = \`
                <div class="alert alert-error">
                    <strong>❌ Error!</strong> \${message}
                </div>
            \`;
        }
    </script>
</body>
</html>
  `;
    return c.html(html);
});
// API endpoint for scraping
app.post("/api/scrape", async (c) => {
    const body = await c.req.json();
    const { method, fields, fullDetail, throttle, ...params } = body;
    // Set up Server-Sent Events for progress updates
    const stream = new ReadableStream({
        start(controller) {
            const sendUpdate = (data) => {
                controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
            };
            // Start scraping process
            scrapeGames(method, params, fields, fullDetail, throttle, sendUpdate)
                .then(() => {
                controller.close();
            })
                .catch((error) => {
                sendUpdate({ error: error.message });
                controller.close();
            });
        },
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
});
// Download endpoint for CSV files
app.get("/download/:filename", async (c) => {
    const filename = c.req.param("filename");
    try {
        const filePath = path.join(process.cwd(), "downloads", filename);
        const fileContent = await readFile(filePath, "utf-8");
        return new Response(fileContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    }
    catch (error) {
        return c.text("File not found", 404);
    }
});
// Main scraping function
async function scrapeGames(method, params, fields, fullDetail, throttle, sendUpdate) {
    try {
        sendUpdate({ status: "Starting scrape...", progress: 0 });
        let games = [];
        let scrapeOptions = {
            lang: "en",
            country: "us",
            fullDetail,
        };
        if (throttle > 0) {
            scrapeOptions.throttle = throttle;
        }
        // Execute the appropriate scraping method
        switch (method) {
            case "list":
                scrapeOptions = {
                    ...scrapeOptions,
                    collection: gplay.collection[params.collection] || gplay.collection.TOP_FREE,
                    num: params.num || 50,
                };
                if (params.category) {
                    scrapeOptions.category =
                        gplay.category[params.category];
                }
                sendUpdate({ status: "Fetching game list...", progress: 20 });
                games = await gplay.list(scrapeOptions);
                break;
            case "search":
                scrapeOptions = {
                    ...scrapeOptions,
                    term: params.term,
                    num: params.num || 20,
                    price: params.price || "all",
                };
                sendUpdate({
                    status: `Searching for "${params.term}"...`,
                    progress: 20,
                });
                games = await gplay.search(scrapeOptions);
                break;
            case "developer":
                scrapeOptions = {
                    ...scrapeOptions,
                    devId: params.devId,
                    num: params.num || 20,
                };
                sendUpdate({
                    status: `Fetching games by ${params.devId}...`,
                    progress: 20,
                });
                games = await gplay.developer(scrapeOptions);
                break;
            case "category":
                scrapeOptions = {
                    ...scrapeOptions,
                    collection: gplay.collection[params.collection] || gplay.collection.TOP_FREE,
                    category: gplay.category[params.category],
                    num: params.num || 50,
                };
                sendUpdate({ status: "Fetching games from category...", progress: 20 });
                games = await gplay.list(scrapeOptions);
                break;
            default:
                throw new Error("Invalid scraping method");
        }
        sendUpdate({ status: `Processing ${games.length} games...`, progress: 60 });
        // Filter and process game data based on selected fields
        const processedGames = games.map((game) => {
            const filtered = {};
            fields.forEach((field) => {
                if (game[field] !== undefined) {
                    filtered[field] = game[field];
                }
            });
            return filtered;
        });
        sendUpdate({ status: "Generating CSV...", progress: 80 });
        // Generate CSV
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .replace("T", "_");
        const filename = `google-play-games-${method}-${timestamp}.csv`;
        const filePath = path.join(process.cwd(), "downloads", filename);
        // Ensure downloads directory exists
        await createDirectoryIfNotExists(path.dirname(filePath));
        // Generate CSV content
        const csvContent = generateCSV(processedGames, fields);
        await writeFile(filePath, csvContent, "utf-8");
        sendUpdate({
            status: "Complete!",
            progress: 100,
            completed: true,
            filename,
            count: games.length,
        });
    }
    catch (error) {
        console.error("Scraping error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        sendUpdate({ error: `Scraping failed: ${errorMessage}` });
    }
}
// Helper function to generate CSV content
function generateCSV(data, fields) {
    // Create header row
    const headers = fields.map((field) => field.toUpperCase());
    const csvRows = [headers.join(",")];
    // Add data rows
    data.forEach((item) => {
        const row = fields.map((field) => {
            let value = item[field] || "";
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (typeof value === "string") {
                value = value.replace(/"/g, '""'); // Escape quotes
                if (value.includes(",") ||
                    value.includes('"') ||
                    value.includes("\n")) {
                    value = `"${value}"`;
                }
            }
            return value;
        });
        csvRows.push(row.join(","));
    });
    return csvRows.join("\n");
}
// Helper function to create directory if it doesn't exist
async function createDirectoryIfNotExists(dirPath) {
    try {
        await readFile(dirPath);
    }
    catch (error) {
        // Directory doesn't exist, create it
        const fs = await import("fs");
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
serve({
    fetch: app.fetch,
    port: 5678,
}, (info) => {
    console.log(`🚀 Google Play Scraper running on http://localhost:${info.port}`);
    console.log(`📊 Open your browser to start scraping game data`);
});
