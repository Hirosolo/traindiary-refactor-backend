/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     summary: Get a food by ID
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Food ID
 *     responses:
 *       200:
 *         description: Food details
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
 *                     food_id:
 *                       type: integer
 *                       example: 71
 *                     name:
 *                       type: string
 *                       example: Almonds
 *                     calories_per_serving:
 *                       type: number
 *                       example: 579
 *                     protein_per_serving:
 *                       type: number
 *                       example: 21
 *                     carbs_per_serving:
 *                       type: number
 *                       example: 22
 *                     fat_per_serving:
 *                       type: number
 *                       example: 50
 *                     serving_type:
 *                       type: string
 *                       example: 100 g
 *                     image:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     fibers_per_serving:
 *                       type: number
 *                       example: 10
 *                     sugars_per_serving:
 *                       type: number
 *                       example: 0
 *                     zincs_per_serving:
 *                       type: number
 *                       example: 0.003
 *                     magnesiums_per_serving:
 *                       type: number
 *                       example: 0.25
 *                     calciums_per_serving:
 *                       type: number
 *                       example: 0.1
 *                     irons_per_serving:
 *                       type: number
 *                       example: 0.003
 *                     vitamin_a_per_serving:
 *                       type: number
 *                       example: 0
 *                     vitamin_c_per_serving:
 *                       type: number
 *                       example: 0
 *                     vitamin_b12_per_serving:
 *                       type: number
 *                       example: 0
 *                     vitamin_d_per_serving:
 *                       type: number
 *                       example: 0
 *       404:
 *         description: Food not found
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
 *                   example: Food not found
 *   put:
 *     summary: Update a food by ID
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Food ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, serving_type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Almonds
 *               calories_per_serving:
 *                 type: number
 *                 example: 579
 *               protein_per_serving:
 *                 type: number
 *                 example: 21
 *               carbs_per_serving:
 *                 type: number
 *                 example: 22
 *               fat_per_serving:
 *                 type: number
 *                 example: 50
 *               serving_type:
 *                 type: string
 *                 example: 100 g
 *               image:
 *                 type: string
 *                 nullable: true
 *               fibers_per_serving:
 *                 type: number
 *                 example: 10
 *               sugars_per_serving:
 *                 type: number
 *                 example: 0
 *               zincs_per_serving:
 *                 type: number
 *                 example: 0.003
 *               magnesiums_per_serving:
 *                 type: number
 *                 example: 0.25
 *               calciums_per_serving:
 *                 type: number
 *                 example: 0.1
 *               irons_per_serving:
 *                 type: number
 *                 example: 0.003
 *               vitamin_a_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_c_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_b12_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_d_per_serving:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: Food updated successfully
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
 *                   example: Food updated successfully
 *       404:
 *         description: Food not found
 *       401:
 *         description: Unauthorized
 *       417:
 *         description: Faild to delete food
 *       400:
 *         description: Wrong format
 *   delete:
 *     summary: Delete a food by ID
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Food ID
 *     responses:
 *       200:
 *         description: Food deleted successfully
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
 *                   example: Food deleted successfully
 *                 data:
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Food not found
 *       401:
 *         description: Unauthorized
 *       417:
 *         description: Faild to delete food
 */
import { NextRequest } from "next/server";
import { FoodRepository } from "@/repositories/master.repository";
import { foodSchema } from "@/validation/master.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { fromZodError } from "zod-validation-error";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const foodId = parseInt(id);
    const food = await FoodRepository.findById(foodId);
    if (!food) return errorResponse("Food not found", 404);
    return successResponse(food);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const foodId = parseInt(id);

    if ((await FoodRepository.findById(foodId)) === null) {
      return errorResponse("Not exist food with that id", 404);
    }

    const body = await req.json();
    const validation = foodSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Wrong format",400);
    }

    const food = await FoodRepository.update(foodId,  validation.data);
    if (!food) return errorResponse("Faild to update food", 417);
    return successResponse(food, "Food updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const foodId = parseInt(id);

    if ((await FoodRepository.findById(foodId)) === null) {
      return errorResponse("Not exist food with that id", 404);
    }

    const deleted = await FoodRepository.delete(foodId);
    if (!deleted) return errorResponse("Faild to delete food", 417);
    return successResponse(null, "Food deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
