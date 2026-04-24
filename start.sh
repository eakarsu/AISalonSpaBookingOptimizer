#!/bin/bash

# AI Salon & Spa Booking Optimizer - Startup Script
echo "============================================="
echo "  AI Salon & Spa Booking Optimizer"
echo "  Starting application..."
echo "============================================="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "ERROR: .env file not found! Create one based on .env example."
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Kill any processes using our ports
echo ""
echo ">> Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
sleep 1
echo "   Ports cleared."

# Check PostgreSQL
echo ""
echo ">> Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
  echo "   Starting PostgreSQL..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 2
fi

if pg_isready -q 2>/dev/null; then
  echo "   PostgreSQL is running."
else
  echo "   WARNING: PostgreSQL may not be running. Please start it manually."
fi

# Create database if not exists
echo ""
echo ">> Setting up database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'salon_spa_optimizer'" 2>/dev/null | grep -q 1 || \
  createdb -U postgres salon_spa_optimizer 2>/dev/null || \
  psql -tc "SELECT 1 FROM pg_database WHERE datname = 'salon_spa_optimizer'" 2>/dev/null | grep -q 1 || \
  createdb salon_spa_optimizer 2>/dev/null
echo "   Database ready."

# Install dependencies
echo ""
echo ">> Installing backend dependencies..."
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1

echo ""
echo ">> Installing frontend dependencies..."
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1

# Seed database
echo ""
echo ">> Seeding database with sample data..."
cd "$PROJECT_DIR/server"
node seed.js

# Start backend with nodemon for hot reload
echo ""
echo ">> Starting backend server on port $BACKEND_PORT (with hot reload)..."
cd "$PROJECT_DIR/server"
npx nodemon index.js &
BACKEND_PID=$!
sleep 2

# Start frontend with hot reload (React default)
echo ""
echo ">> Starting frontend on port $FRONTEND_PORT (with hot reload)..."
cd "$PROJECT_DIR/client"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

echo ""
echo "============================================="
echo "  Application is starting!"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Login:    admin@salon.com / password123"
echo ""
echo "  Both servers will auto-reload on changes."
echo "  Press Ctrl+C to stop all services."
echo "============================================="

# Handle shutdown
cleanup() {
  echo ""
  echo ">> Shutting down..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
  lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
  echo "   All services stopped. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
