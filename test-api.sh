#!/bin/bash

# API Testing Script for Quiz Learning Platform
# Week 6 - Comprehensive Testing

echo "================================"
echo "Quiz Learning Platform API Tests"
echo "================================"
echo ""

API_URL="http://localhost:8000/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=$5
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json")
        fi
    else
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

echo "======================================="
echo "1. AUTHENTICATION TESTS"
echo "======================================="

# Register a test student
test_endpoint "POST" "/register" "Register new student" \
    '{"name":"Test Student","email":"test-student-'$(date +%s)'@example.com","password":"password123","password_confirmation":"password123","role":"student"}' \
    "201"

# Register a test instructor
test_endpoint "POST" "/register" "Register new instructor" \
    '{"name":"Test Instructor","email":"test-instructor-'$(date +%s)'@example.com","password":"password123","password_confirmation":"password123","role":"instructor"}' \
    "201"

# Login and get token
echo ""
echo "Logging in to get authentication token..."
response=$(curl -s -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-student-'$(date +%s)'@example.com","password":"password123"}')

# Note: In real testing, you'd need to store and use the actual token
# For now, this is a template that shows the structure

test_endpoint "POST" "/login" "Login with invalid credentials" \
    '{"email":"wrong@example.com","password":"wrong"}' \
    "422"

echo ""
echo "======================================="
echo "2. COURSE TESTS"
echo "======================================="

test_endpoint "GET" "/courses" "Get all published courses" "" "200"

echo ""
echo "======================================="
echo "3. PROTECTED ROUTE TESTS"
echo "======================================="

test_endpoint "GET" "/me" "Access protected route without token" "" "401"

echo ""
echo "======================================="
echo "TEST SUMMARY"
echo "======================================="
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
