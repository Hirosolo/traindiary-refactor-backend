import swaggerJSDoc from 'swagger-jsdoc';

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
        url: 'http://localhost:3001',
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
  // Path to the API docs
  apis: ['./src/app/api/**/*.ts', './src/lib/swagger-docs.ts'], // Target all API routes
};

export const swaggerSpec = swaggerJSDoc(options);
