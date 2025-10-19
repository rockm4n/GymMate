#!/bin/bash

# Test script for POST /api/bookings endpoint
# This script tests the booking endpoint with various scenarios

API_URL="http://127.0.0.1:4321/api/bookings"
SCHEDULED_CLASS_ID="99999999-9999-9999-9999-999999999991"

echo "========================================="
echo "Testing POST /api/bookings endpoint"
echo "========================================="
echo ""

# Note: To run this test, you need to:
# 1. Start the dev server: npm run dev
# 2. Create a test user in Supabase Auth
# 3. Get a valid JWT token
# 4. Replace TOKEN below with your actual token

# Example token (replace with actual token from Supabase Auth)
TOKEN="YOUR_JWT_TOKEN_HERE"

echo "Test 1: Create booking without authentication (should return 401)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"scheduled_class_id\": \"$SCHEDULED_CLASS_ID\"}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 2: Create booking with invalid JSON (should return 400)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{invalid json}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 3: Create booking with invalid UUID (should return 400)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scheduled_class_id": "not-a-uuid"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 4: Create booking with non-existent class (should return 404)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scheduled_class_id": "00000000-0000-0000-0000-000000000000"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 5: Create valid booking (should return 201)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"scheduled_class_id\": \"$SCHEDULED_CLASS_ID\"}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 6: Try to book the same class again (should return 400 - already booked)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"scheduled_class_id\": \"$SCHEDULED_CLASS_ID\"}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "Test 7: Try to book cancelled class (should return 400 - not available)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scheduled_class_id": "99999999-9999-9999-9999-999999999994"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "========================================="
echo "Tests completed!"
echo "========================================="
echo ""
echo "Note: Tests 4-7 require a valid JWT token."
echo "To get a token:"
echo "1. Open Supabase Studio: http://127.0.0.1:54323"
echo "2. Go to Authentication > Users"
echo "3. Create a test user or use existing one"
echo "4. Copy the JWT token from the user details"
echo "5. Replace TOKEN variable in this script"
echo ""

