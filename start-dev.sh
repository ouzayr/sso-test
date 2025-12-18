#!/bin/bash

echo "Starting SSO Application in Development Mode"
echo "============================================="

# Start backend in background
echo "Starting .NET API backend on https://localhost:7001..."
cd backend
dotnet run &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting Angular frontend on http://localhost:4200..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "Application started!"
echo "Frontend: http://localhost:4200"
echo "Backend: https://localhost:7001"
echo "API Docs: https://localhost:7001/swagger"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
