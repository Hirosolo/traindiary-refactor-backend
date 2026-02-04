import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { authenticate, errorResponse, successResponse } from "../utils";

/**
 * @swagger
 * /api/ai/meals:
 *   get:
 *     summary: Get user meals
 *     description: Retrieve all user's meals, optionally filtered by date.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional date filter to get meals for a specific day
 *         example: "2023-10-27"
 *     responses:
 *       200:
 *         description: Meals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       meal_id:
 *                         type: integer
 *                         example: 300
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       meal_type:
 *                         type: string
 *                         example: "Lunch"
 *                       log_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-10-27"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 */
async function handleGET(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  try {
    let query = supabase
      .from("user_meals")
      .select("*")
      .eq("user_id", user!.userId);

    if (date) {
      query = query.eq("log_date", date);
    }

    const { data, error: dbError } = await query.order("log_date", {
      ascending: false,
    });

    if (dbError) {
      return errorResponse("DATABASE_ERROR", "Failed to fetch meals", 400);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("[GET /meals] Error:", error);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 400);
  }
}

/**
 * @swagger
 * /api/ai/meals:
 *   post:
 *     summary: Create meal entry
 *     description: Create a new meal entry for the user.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, date]
 *             properties:
 *               meal_type:
 *                 type: string
 *                 example: "Lunch"
 *               log_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-27"
 *     responses:
 *       201:
 *         description: Meal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     meal_id:
 *                       type: integer
 *                       example: 300
 *                     user_id:
 *                       type: integer          
 *                       example: 1
 *                    meal_type:
 *                      type: string
 *                      example: "Lunch"
 *                    log_date:
 *                      type: string
 *                      format: "2026-02-25"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: meal_type, log_date"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 */
function getToday(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}
function isValidDateFormat(date: string): boolean {
  // format check
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;

  // real date check (2026-02-31 should fail)
  const d = new Date(date);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(date);
}
async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    let { date, type } = body;

    if  (!type) {
      return Response.json(
        { success: false, message: "Missing type"},
        { status: 400 }
      );
    }
    let hasDate = 1;
    // default to today if missing
    if (!date) {
      date = getToday();
      hasDate = 0;
    }
    
    // validate if provided
    if (!isValidDateFormat(date)) {
      return Response.json(
        { success: false, message: "Invalid log_date. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase
      .from("user_meals")
      .insert({
        meal_type: type,
        user_id: user.userId,
        log_date: date,
      });

    if (insertError) {
      return errorResponse("DATABASE_ERROR", "Failed to create meal", 400);
    } 


    let query = supabase
      .from("user_meals")
      .select("*")
      .eq("user_id", user.userId);

    if (hasDate === 1) {
      query = query.eq("log_date", date);
    }

    const { data: meals, error: fetchError } = await query.order("log_date", {
      ascending: false,
    });

    if (fetchError) {
      return errorResponse("DATABASE_ERROR", "Failed to fetch meals", 400);
    }

    return successResponse(meals || []);

  } catch (error) {
    return errorResponse("INTERNAL_ERROR", "Internal server error", 400);
  }
}

/**
 * Main handlers for /api/ai/meals
 */
export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function POST(req: NextRequest) {
  return handlePOST(req);
}
