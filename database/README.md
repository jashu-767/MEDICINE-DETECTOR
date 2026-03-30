# 💊 Medicine Detection App

Full-stack medicine information app using Node.js + Express + MongoDB + Claude AI + FDA API.

## Project Structure

```
medicine-detection-app/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   └── medicineController.js  # Business logic
│   ├── middleware/
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   └── Medicine.js         # Mongoose schema
│   ├── routes/
│   │   └── medicineRoutes.js   # API routes
│   ├── .env                    # Environment variables (create this)
│   ├── package.json
│   └── server.js               # Entry point
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── app.js
│   └── pages/
│       └── index.html          # Main UI
└── README.md
```

## Setup Instructions

### Step 1 — Install Prerequisites
- Node.js (v18+): https://nodejs.org
- MongoDB Community: https://www.mongodb.com/try/download/community
- VS Code: https://code.visualstudio.com

### Step 2 — Clone / Open Project in VS Code
Open the `medicine-detection-app` folder in VS Code.

### Step 3 — Backend Setup
```bash
cd backend
npm install
```

### Step 4 — Create .env File
Inside `backend/`, create a file named `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/medicinedb
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
Get your Anthropic API key at: https://console.anthropic.com

### Step 5 — Start MongoDB
Make sure MongoDB is running locally:
```bash
# macOS/Linux
mongod

# Windows (run as admin)
net start MongoDB
```

### Step 6 — Start the Backend Server
```bash
cd backend
npm run dev
```
Server runs at: http://localhost:5000

### Step 7 — Open the Frontend
Open `frontend/pages/index.html` directly in your browser,
OR use VS Code Live Server extension for a better experience.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/medicine/search | Search by medicine name |
| POST | /api/medicine/image | Search by medicine image (base64) |
| GET | /api/medicine/history | Get search history |
| DELETE | /api/medicine/history/:id | Delete a history entry |
