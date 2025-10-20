#!/bin/bash

echo "🚀 Starting Outfit Virtual Fitting Room..."
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo "Please create backend/.env with your GEMINI_API_KEY"
    echo ""
    echo "Example:"
    echo "GEMINI_API_KEY=your_api_key_here"
    echo "PORT=3001"
    exit 1
fi

# Start backend
echo "📦 Starting backend server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "📦 Starting frontend server..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "🎉 Application is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
