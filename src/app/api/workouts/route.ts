/**
 * @swagger
 * tags:
 *   name: Workout sessions
 *   description: Workout sessions management
 */

/**
 * @swagger
 * /api/workouts:
 *   get:
 *     summary: Get user workout sessions
 *     description: Retrieve all workout sessions for a user, optionally filtered by month or specific date
 *     tags: [Workout sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user ID to query workouts for (if not provided, uses authenticated user)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM format)
 *         example: 2026-02
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Filter by specific date (YYYY-MM-DD format)
 *         example: 2026-02-01
 *     responses:
 *       200:
 *         description: List of workout session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       session_id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 14
 *                       scheduled_date:
 *                         type: string
 *                         format: date
 *                         example: 2026-02-01
 *                       status:
 *                         type: string
 *                         enum: [PENDING, IN_PROGRESS, COMPLETED, UNFINISHED, MISSED]
 *                         example: COMPLETED
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                       exercises:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User ID is required
 *       404:
 *         description: No workout session found in selected period
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No session found in selected period
 *                 data:
 *                   type: array
 *                   example: []
 *   post:
 *     summary: Create a workout session
 *     description: Create a new workout session with exercises. Only one workout session is allowed per day.
 *     tags: [Workout sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduled_date]
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Optional user ID to create workout for (if not provided, uses authenticated user)
 *                 example: 14
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-01
 *               type:
 *                 type: string
 *                 example: Strength Training
 *               notes:
 *                 type: string
 *                 example: Great workout today!
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, UNFINISHED, MISSED]
 *                 example: COMPLETED
 *               exercises:
 *                 type: array
 *                 description: Optional array of exercises (if not provided, only creates workout session)
 *                 items:
 *                   type: object
 *                   required: [exercise_id]
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                       example: 1
 *                     actual_sets:
 *                       type: integer
 *                       example: 4
 *                     actual_reps:
 *                       type: integer
 *                       example: 8
 *     responses:
 *       201:
 *         description: Workout logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Workout session logged successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error or invalid userID
 *       409:
 *         description: Only one workout session is allowed per day
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Only one workout session is allowed per day.
 *   put:
 *     summary: Update workout session
 *     description: Update an existing workout session status, notes, or other details using session_id
 *     tags: [Workout sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id]
 *             properties:
 *               session_id:
 *                 type: integer
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: Optional user ID to update workout for (if not provided, uses authenticated user)
 *                 example: 14
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, UNFINISHED, MISSED]
 *                 example: COMPLETED
 *               notes:
 *                 type: string
 *                 example: Updated workout notes
 *     responses:
 *       200:
 *         description: Workout updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Workout session updated
 *       400:
 *         description: Missing session_id or invalid JSON
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a session detail
 *     description: Delete a specific session detail (exercise) from a workout session using session_detail_id
 *     tags: [Sesssions details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_detail_id]
 *             properties:
 *               session_detail_id:
 *                 type: integer
 *                 description: The ID of the session detail to delete
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: Optional user ID (if not provided, uses authenticated user)
 *                 example: 14
 *     responses:
 *       200:
 *         description: Session detail deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Workout session deleted
 *       400:
 *         description: Missing session_detail_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
import { NextRequest } from "next/server";
import { WorkoutRepository } from "@/repositories/log.repository";
import { requestWorkoutSchema } from "@/validation/log.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { fromZodError } from "zod-validation-error";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    if (!userIdParam && !user) return errorResponse("User ID is required", 400);

    if (!user) return errorResponse("Unauthorized", 401);

    const userId = userIdParam ? parseInt(userIdParam) : user.userId;

    const month = searchParams.get("month") || undefined;
    const date = searchParams.get("date") || undefined;

    const workouts = await WorkoutRepository.findByUserId(userId, {
      month,
      date,
    });
    
    if (!workouts || workouts.length === 0) {
      return errorResponse("No session found in selected period", 404);
    }
    
    return successResponse(workouts);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validation = requestWorkoutSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const legacyUserId = validation.data.userID
      ? Number(validation.data.userID)
      : undefined;
    if (validation.data.userID && Number.isNaN(legacyUserId)) {
      return errorResponse("Invalid userID", 400);
    }

    const requestedUserId = validation.data.userId ?? legacyUserId;
    const targetUserId = requestedUserId ?? user.userId;

    const workout = await WorkoutRepository.create(
      targetUserId,
      validation.data,
    );
    return successResponse(workout, "Workout session logged successfully", 201);
  } catch (error: any) {
    if (error?.message === "WORKOUT_SESSION_ALREADY_EXISTS") {
      return errorResponse("Only one workout session is allowed per day.", 409);
    }
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse("Wrong format", 400);
    }

    const { session_id, userId, ...updateData } = body;

    if (!session_id) {
      return errorResponse("session_id is required", 400);
    }

    const targetUserId = userId || user.userId;

    const result = await WorkoutRepository.updateSession(
      session_id,
      targetUserId,
      updateData,
    );
    return successResponse(result, "Workout session updated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);
    const body = await req.json();
    const { session_detail_id, userId } = body;
    if (!session_detail_id) {
      return errorResponse("session_detail_id is required", 400);
    }
    const targetUserId = userId || user.userId;
    await WorkoutRepository.deleteSessionDetailById(session_detail_id, targetUserId);
    return successResponse({ message: "Workout session deleted" });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}