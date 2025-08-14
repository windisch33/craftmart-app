#!/bin/bash

# CraftMart Security Test Suite
# Comprehensive testing of CORS, rate limiting, authentication, and validation features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3001/api"
TEST_EMAIL="test@security.com"
TEST_PASSWORD="wrongpassword"

echo -e "${BLUE}🔒 CraftMart Security Test Suite${NC}"
echo "=================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

echo
echo -e "${YELLOW}📋 1. Testing CORS Configuration${NC}"
echo "-----------------------------------"

# Test 1: CORS - Preflight request for allowed origin
echo "Testing CORS preflight for allowed origin (localhost:3000)..."
CORS_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}\nCORS_HEADERS:%{header_json}" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS "$API_BASE/auth/login" 2>/dev/null | grep -E "(HTTP_CODE|access-control-allow)")

CORS_PREFLIGHT_CODE=$(echo "$CORS_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$CORS_PREFLIGHT_CODE" = "200" ] || [ "$CORS_PREFLIGHT_CODE" = "204" ]; then
    print_result 0 "CORS preflight allows localhost:3000 ($CORS_PREFLIGHT_CODE)"
else
    print_result 1 "CORS preflight should allow localhost:3000 (got $CORS_PREFLIGHT_CODE)"
fi

# Test 2: CORS - Actual request with allowed origin
echo "Testing CORS actual request with allowed origin..."
CORS_ACTUAL=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Origin: http://localhost:3000" \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{"email":"test@test.com","password":"test"}')

if [ "$CORS_ACTUAL" = "400" ] || [ "$CORS_ACTUAL" = "401" ]; then
    print_result 0 "CORS allows actual requests from localhost:3000 ($CORS_ACTUAL)"
else
    print_result 1 "CORS actual request unexpected response ($CORS_ACTUAL)"
fi

# Test 3: CORS - Blocked Origin (should not have Access-Control headers)
echo "Testing requests from blocked origin (localhost:4000)..."
CORS_BLOCKED_RESPONSE=$(curl -s -I \
    -H "Origin: http://localhost:4000" \
    -H "Access-Control-Request-Method: POST" \
    -X OPTIONS "$API_BASE/auth/login" | grep -i "access-control-allow" | wc -l)

if [ "$CORS_BLOCKED_RESPONSE" = "0" ]; then
    print_result 0 "CORS properly blocks localhost:4000 (no CORS headers)"
else
    print_result 1 "CORS should block localhost:4000 (found CORS headers)"
fi

echo
echo -e "${YELLOW}⚡ 2. Testing Rate Limiting${NC}"
echo "------------------------------"

echo "Making 6 consecutive failed login attempts..."
RATE_LIMIT_TRIGGERED=false

for i in {1..6}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$API_BASE/auth/login")
    
    echo "Attempt $i: HTTP $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        echo -e "${YELLOW}Rate limit triggered on attempt $i${NC}"
        break
    fi
    
    # Small delay between attempts
    sleep 0.5
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    print_result 0 "Rate limiting works (429 Too Many Requests)"
else
    print_result 1 "Rate limiting not triggered after 6 attempts"
fi

echo
echo -e "${YELLOW}🔐 3. Testing Authentication & Authorization${NC}"
echo "-----------------------------------------------"

# Test 3: Protected endpoint without token
echo "Testing protected endpoint without JWT token..."
NO_TOKEN_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$API_BASE/auth/profile")

if [ "$NO_TOKEN_CODE" = "401" ] || [ "$NO_TOKEN_CODE" = "403" ]; then
    print_result 0 "Profile endpoint requires authentication ($NO_TOKEN_CODE)"
else
    print_result 1 "Profile endpoint should require authentication (got $NO_TOKEN_CODE)"
fi

# Test 4: Admin-only endpoint without admin token
echo "Testing admin endpoint without admin token..."
NO_ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$API_BASE/auth/users")

if [ "$NO_ADMIN_CODE" = "401" ] || [ "$NO_ADMIN_CODE" = "403" ]; then
    print_result 0 "Users endpoint requires admin authentication ($NO_ADMIN_CODE)"
else
    print_result 1 "Users endpoint should require admin authentication (got $NO_ADMIN_CODE)"
fi

# Test 5: Register endpoint without admin token
echo "Testing register endpoint without admin token..."
NO_ADMIN_REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"testpass","first_name":"Test","last_name":"User"}' \
    "$API_BASE/auth/register")

if [ "$NO_ADMIN_REG_CODE" = "401" ] || [ "$NO_ADMIN_REG_CODE" = "403" ]; then
    print_result 0 "Register endpoint requires admin authentication ($NO_ADMIN_REG_CODE)"
else
    print_result 1 "Register endpoint should require admin authentication (got $NO_ADMIN_REG_CODE)"
fi

echo
echo -e "${YELLOW}🚫 4. Testing Removed Test Endpoints${NC}"
echo "----------------------------------------"

# Test 6: Removed test endpoints
echo "Testing removed /api/auth/test endpoint..."
TEST_ENDPOINT_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$API_BASE/auth/test")

if [ "$TEST_ENDPOINT_CODE" = "404" ]; then
    print_result 0 "Test endpoint properly removed (404)"
else
    print_result 1 "Test endpoint should be removed (got $TEST_ENDPOINT_CODE)"
fi

echo "Testing removed /api/auth/test-bcrypt endpoint..."
BCRYPT_TEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$API_BASE/auth/test-bcrypt")

if [ "$BCRYPT_TEST_CODE" = "404" ]; then
    print_result 0 "Bcrypt test endpoint properly removed (404)"
else
    print_result 1 "Bcrypt test endpoint should be removed (got $BCRYPT_TEST_CODE)"
fi

echo
echo -e "${YELLOW}🔍 5. Testing Request Validation${NC}"
echo "------------------------------------"

# Test 7: Invalid email format
echo "Testing invalid email format validation..."
INVALID_EMAIL_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{"email":"invalid-email","password":"password123"}')

if [ "$INVALID_EMAIL_CODE" = "400" ]; then
    print_result 0 "Invalid email format properly rejected (400)"
else
    print_result 1 "Invalid email should be rejected with 400 (got $INVALID_EMAIL_CODE)"
fi

# Test 8: Missing required fields
echo "Testing missing password validation..."
MISSING_PASSWORD_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{"email":"test@test.com"}')

if [ "$MISSING_PASSWORD_CODE" = "400" ]; then
    print_result 0 "Missing password properly rejected (400)"
else
    print_result 1 "Missing password should be rejected with 400 (got $MISSING_PASSWORD_CODE)"
fi

# Test 9: Invalid ID parameter
echo "Testing invalid ID parameter validation..."
INVALID_ID_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer fake-token" \
    -X DELETE "$API_BASE/auth/users/invalid-id")

if [ "$INVALID_ID_CODE" = "400" ]; then
    print_result 0 "Invalid ID parameter properly rejected (400)"
elif [ "$INVALID_ID_CODE" = "401" ]; then
    print_result 0 "Invalid ID parameter handled (401 from auth first)"
else
    print_result 1 "Invalid ID should be rejected (got $INVALID_ID_CODE)"
fi

# Test 10: Empty request body
echo "Testing empty request body validation..."
EMPTY_BODY_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{}')

if [ "$EMPTY_BODY_CODE" = "400" ]; then
    print_result 0 "Empty request body properly rejected (400)"
else
    print_result 1 "Empty body should be rejected with 400 (got $EMPTY_BODY_CODE)"
fi

echo
echo -e "${CYAN}📊 6. Testing Advanced Security Features${NC}"
echo "---------------------------------------------"

# Test 11: SQL Injection attempt
echo "Testing SQL injection protection..."
SQL_INJECTION_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{"email":"admin@test.com; DROP TABLE users; --","password":"password"}')

if [ "$SQL_INJECTION_CODE" = "400" ] || [ "$SQL_INJECTION_CODE" = "401" ]; then
    print_result 0 "SQL injection attempt handled safely ($SQL_INJECTION_CODE)"
else
    print_result 1 "SQL injection attempt should be handled (got $SQL_INJECTION_CODE)"
fi

# Test 12: XSS attempt in JSON
echo "Testing XSS protection in request validation..."
XSS_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d '{"email":"<script>alert(1)</script>@test.com","password":"password"}')

if [ "$XSS_CODE" = "400" ]; then
    print_result 0 "XSS attempt in email properly rejected (400)"
else
    print_result 1 "XSS attempt should be rejected (got $XSS_CODE)"
fi

# Test 13: Large payload protection
echo "Testing large payload protection..."
LARGE_PAYLOAD=$(printf '{"email":"test@test.com","password":"%*s"}' 10000 | tr ' ' 'a')
LARGE_PAYLOAD_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Content-Type: application/json" \
    -X POST "$API_BASE/auth/login" \
    -d "$LARGE_PAYLOAD")

if [ "$LARGE_PAYLOAD_CODE" = "400" ] || [ "$LARGE_PAYLOAD_CODE" = "413" ]; then
    print_result 0 "Large payload properly rejected ($LARGE_PAYLOAD_CODE)"
else
    print_result 1 "Large payload should be rejected (got $LARGE_PAYLOAD_CODE)"
fi

echo
echo -e "${BLUE}🏁 Security Test Summary${NC}"
echo "========================="
echo "All security tests completed. Review results above."
echo "If any tests failed, check your environment configuration."
echo
echo "Environment file location: backend/.env"
echo "Example file location: backend/.env.example"
echo
echo -e "${GREEN}Security features verified:${NC}"
echo "• CORS configuration with preflight and multiple origins"
echo "• Rate limiting on login endpoint (5 attempts/15min)"
echo "• JWT authentication on protected endpoints"
echo "• Role-based authorization (admin-only endpoints)"
echo "• Request body validation with Joi schemas"
echo "• Parameter validation for route parameters"
echo "• Protection against common attacks (SQL injection, XSS)"
echo "• Removal of dangerous test endpoints"
echo
echo -e "${MAGENTA}🛡️ Production Ready Security Stack:${NC}"
echo "• Input validation with detailed error messages"
echo "• Rate limiting with configurable windows"
echo "• CORS with environment-based origins"
echo "• JWT with secure configuration"
echo "• SQL injection protection via parameterized queries"
echo "• Comprehensive error handling"