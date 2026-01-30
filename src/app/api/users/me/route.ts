/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user data
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
 *                   description: User profile data
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
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
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
 *                   example: User not found
 *       500:
 *         description: Internal server error
 */


import { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";
import { NextRequest } from "next/server"
import { successResponse, errorResponse } from '@/lib/response';
import { UserRepository } from "@/repositories/user.repository";
import { get } from "http";

export async function GET(req: NextRequest)
{
    try{
        const user = getAuthUser(req);
        if(!user) return errorResponse('Unauthorized', 401);

        const userData = await UserRepository.findById(user.userId);
        
        if (!userData) return errorResponse('User not found', 404);

        return successResponse(userData);
    }
    catch (error: any){
        return errorResponse(error.message, 500);
    }

}