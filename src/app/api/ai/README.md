# AI API System Documentation

## Overview
This API system is designed for AI agents to safely track fitness and nutrition data. It implements strict security measures and follows the "Zero Trust" principle where user identity is verified solely from JWT tokens.

---

## Security Architecture

### Zero Trust Rule
- **Source of Truth:** User ID is extracted ONLY from the JWT Authorization header
- **Request Body Validation:** Never trust `user_id` sent in request bodies
- **Hallucination Prevention:** AI agents may send invalid IDs; the API returns `404` or `0 rows affected` instead of modifying unowned data
- **Ownership Verification:** All operations verify that requested resources belong to the authenticated user

### Authentication
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Token Format:** JWT containing `userId` and `email`
- **Missing/Invalid Token:** Returns `401 Unauthorized`

---

## Response Format

### Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": { ... }  // Object or Array
}
```

### Error Response
```json
{
  "success": false,
  "error_code": "ERROR_CODE",  // e.g., "ENTITY_NOT_FOUND", "VALIDATION_ERROR", "ACCESS_DENIED"
  "message": "Human-readable error message"
}
```

---

## Module 1: Workout Tracking

### 1.1 Workout Sessions

#### GET /api/ai/sessions
Retrieve user's workout sessions or a specific session.

**Query Parameters:**
- `?id=<session_id>` (Optional) - Get specific session
- Without ID - Returns all sessions ordered by date (DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "session_id": 101,
      "user_id": 1,
      "scheduled_date": "2023-10-27",
      "type": "Strength",
      "status": "completed",
      "notes": "Leg day",
      "gr_score": 85
    }
  ]
}
```

#### POST /api/ai/sessions
Create a new workout session.

**Constraint:** Maximum 1 session per day per user (returns 409 if duplicate)

**Request Body:**
```json
{
  "scheduled_date": "2023-10-27",  // YYYY-MM-DD
  "type": "Hypertrophy",           // String
  "notes": "Focus on form",        // String (Optional)
  "status": "planned"              // String
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "session_id": 101
  }
}
```

#### PUT /api/ai/sessions
Update session details or batch update status.

**Scenario A - Full Update:**
```json
{
  "session_id": 101,
  "scheduled_date": "2023-10-28",
  "type": "Cardio",
  "notes": "Updated note",
  "status": "completed",
  "gr_score": 90
}
```

**Scenario B - Batch Status Update:**
```json
{
  "ids": [101, 102],
  "status": "completed"
}
```

#### DELETE /api/ai/sessions
Delete sessions by IDs.

**Request Body:**
```json
{
  "ids": [101, 105]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 2
  }
}
```

---

### 1.2 Session Exercises (Session Details)

#### GET /api/ai/session-details
Get all exercises for a specific session.

**Query Parameters:**
- `?session_id=101` (Required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "session_detail_id": 201,
      "session_id": 101,
      "exercise_id": 50,
      "status": "pending",
      "exercises": {
        "exercise_id": 50,
        "name": "Squat"
      }
    }
  ]
}
```

#### POST /api/ai/session-details
Add an exercise to a session.

**Request Body:**
```json
{
  "session_id": 101,
  "exercise_id": 50,
  "status": "pending"  // Optional
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "session_detail_id": 201
  }
}
```

#### PUT /api/ai/session-details
Batch update status for multiple session exercises.

**Request Body:**
```json
{
  "ids": [201, 202],
  "status": "skipped"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 2
  }
}
```

---

### 1.3 Sets & Exercise Logs

#### POST /api/ai/sets
Log a set for an exercise.

**Request Body:**
```json
{
  "session_detail_id": 201,
  "reps": 10,
  "weight_kg": 20.5,        // Real (Optional)
  "duration": 0,            // Seconds/Minutes (Optional)
  "notes": "Easy RPE",      // Optional
  "status": "completed"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "set_id": 505
  }
}
```

#### PUT /api/ai/sets
Update a set.

**Request Body:**
```json
{
  "set_id": 505,
  "reps": 12,
  "weight_kg": 22.5,
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "set_id": 505,
    "reps": 12,
    "weight_kg": 22.5,
    "status": "completed"
  }
}
```

---

## Module 2: Nutrition Tracking

### 2.1 Meals

#### GET /api/ai/meals
Retrieve user's meals.

**Query Parameters:**
- `?date=2023-10-27` (Optional) - Filter by date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "meal_id": 300,
      "user_id": 1,
      "meal_type": "Lunch",
      "log_date": "2023-10-27"
    }
  ]
}
```

#### POST /api/ai/meals
Create a new meal entry.

**Request Body:**
```json
{
  "meal_type": "Lunch",         // String
  "log_date": "2023-10-27"      // YYYY-MM-DD
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "meal_id": 300
  }
}
```

---

### 2.2 Meal Foods

#### POST /api/ai/meal-foods
Add a food to a meal.

**Request Body:**
```json
{
  "meal_id": 300,
  "food_id": 55,
  "numbers_of_serving": 1.5
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "meal_detail_id": 901
  }
}
```

#### PUT /api/ai/meal-foods
Update servings for a meal food.

**Request Body:**
```json
{
  "meal_detail_id": 901,
  "numbers_of_serving": 2.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_detail_id": 901,
    "numbers_of_serving": 2.0
  }
}
```

#### DELETE /api/ai/meal-foods
Remove foods from a meal.

**Request Body:**
```json
{
  "ids": [901, 902]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 2
  }
}
```

---

## Error Codes Reference

| Error Code | HTTP Status | Description |
|-----------|-----------|------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `ACCESS_DENIED` | 403 | Resource does not belong to authenticated user |
| `ENTITY_NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Invalid or missing required fields |
| `CONFLICT` | 409 | Constraint violation (e.g., duplicate session on same day) |
| `DATABASE_ERROR` | 400 | Database operation failed |
| `INTERNAL_ERROR` | 400 | Unexpected server error |

---

## Implementation Details

### Ownership Verification Chain
Each API implements a chain of ownership verification:

```
Request with JWT → Extract user_id from token
                → Verify resource exists
                → Verify resource.user_id === authenticated user_id
                → Perform operation
```

### Database Tables
- `workout_sessions` - User workout sessions
- `session_details` - Exercises in each session
- `sessions_exercise_details` - Sets logged for each exercise
- `user_meals` - User meal entries
- `user_meal_details` - Foods in each meal
- `exercises` - Available exercises (master data)
- `foods` - Available foods (master data)

---

## Usage Example

```bash
# Get JWT token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Create a workout session
curl -X POST http://localhost:3000/api/ai/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_date": "2023-10-27",
    "type": "Strength",
    "status": "planned"
  }'

# Get all sessions
curl http://localhost:3000/api/ai/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Notes

1. **Never log user credentials** in error messages
2. **Always verify ownership** before returning data or performing operations
3. **Validate all input** from request bodies
4. **Use 404 for access denied** on sensitive resources when ownership check fails
5. **Rate limiting** (to be implemented) should be added for production
6. **CORS** should be properly configured for production

