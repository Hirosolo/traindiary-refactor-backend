import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const BACKEND_URL = process.env.SERVER_URL || 'http://localhost:3001';

const options = {
  definition: {
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
    },
  },
  // Path to the API docs - use absolute paths for Vercel compatibility
  apis: [
    path.join(process.cwd(), 'src/app/api/**/*.ts'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
