const BACKEND_URL = process.env.SERVER_URL || 'http://localhost:3001';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'TrainDiary API',
    version: '1.0.0',
    description: 'Refactored backend for TrainDiary (fitness & nutrition app)',
  },
  servers: [
    {
      url: BACKEND_URL,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          statusCode: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
          },
          401: {
            description: 'Invalid credentials',
          },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  fullname: { type: 'string' },
                },
                required: ['email', 'password', 'fullname'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
          },
          400: {
            description: 'Invalid input',
          },
        },
      },
    },
    '/api/exercises': {
      get: {
        summary: 'Get all exercises',
        tags: ['Master Data'],
        responses: {
          200: {
            description: 'List of exercises',
          },
        },
      },
      post: {
        summary: 'Create new exercise',
        tags: ['Master Data'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Exercise created',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/exercises/{id}': {
      get: {
        summary: 'Get exercise by ID',
        tags: ['Master Data'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Exercise details',
          },
          404: {
            description: 'Exercise not found',
          },
        },
      },
    },
    '/api/foods': {
      get: {
        summary: 'Get all foods',
        tags: ['Master Data'],
        responses: {
          200: {
            description: 'List of foods',
          },
        },
      },
      post: {
        summary: 'Create new food',
        tags: ['Master Data'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  calories: { type: 'number' },
                  protein: { type: 'number' },
                  carbs: { type: 'number' },
                  fat: { type: 'number' },
                },
                required: ['name', 'calories'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Food created',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/foods/{id}': {
      get: {
        summary: 'Get food by ID',
        tags: ['Master Data'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Food details',
          },
          404: {
            description: 'Food not found',
          },
        },
      },
    },
    '/api/meals': {
      get: {
        summary: 'Get user meals',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of meals',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        summary: 'Create meal',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  mealType: { type: 'string' },
                  foods: { type: 'array' },
                },
                required: ['date', 'mealType'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Meal created',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/meals/{id}': {
      get: {
        summary: 'Get meal by ID',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meal details',
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Meal not found',
          },
        },
      },
      put: {
        summary: 'Update meal',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meal updated',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      delete: {
        summary: 'Delete meal',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meal deleted',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/nutrition/goals': {
      get: {
        summary: 'Get nutrition goals',
        tags: ['Nutrition'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Nutrition goals',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/workouts': {
      get: {
        summary: 'Get user workouts',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of workouts',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        summary: 'Create workout',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  exercises: { type: 'array' },
                },
                required: ['date'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Workout created',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/workouts/{id}': {
      get: {
        summary: 'Get workout by ID',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Workout details',
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Workout not found',
          },
        },
      },
      put: {
        summary: 'Update workout',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Workout updated',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      delete: {
        summary: 'Delete workout',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Workout deleted',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/workouts/logs': {
      get: {
        summary: 'Get workout logs',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of workout logs',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/users/me': {
      get: {
        summary: 'Get current user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/progress': {
      get: {
        summary: 'Get user progress',
        tags: ['Progress'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Progress data',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/summary': {
      get: {
        summary: 'Get summary data',
        tags: ['Summary'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Summary data',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
  },
};
