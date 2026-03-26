#!/bin/bash
echo "🚀 Starting DB Weave Development Environment"
echo ""

# Start API server in background
echo "📡 Starting API Server..."
cd api-server && pnpm dev &
API_PID=$!

# Wait a moment for API server to start
sleep 2

# Start frontend
echo "🖥️  Starting Frontend..."
ls
cd db-weave-app && pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🤖 API Server: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle cleanup
trap "echo '🛑 Stopping servers...'; kill $API_PID $FRONTEND_PID; exit" SIGINT

# Wait for processes
wait