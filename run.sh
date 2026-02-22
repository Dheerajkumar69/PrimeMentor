#!/bin/bash

# PrimeMentor - Run Frontend & Backend simultaneously

echo "🚀 Starting PrimeMentor..."
echo ""

# Start backend
echo "📦 Starting Backend (Express + Nodemon)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
echo "⚡ Starting Frontend (Vite)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both processes
trap "echo ''; echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for both processes
wait
