import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const BACKEND_URL = process.env.SERVER_URL || 'http://localhost:3000';

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
  apis: [
    path.join(process.cwd(), 'src/app/api/**/*.ts'),
  ],
};

// Try to load pre-generated spec for production, otherwise generate on the fly
let swaggerSpec: any;

const preGeneratedPath = path.join(process.cwd(), 'public', 'swagger.json');
if (process.env.NODE_ENV === 'production' && fs.existsSync(preGeneratedPath)) {
  // Production: Use pre-generated spec
  swaggerSpec = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf-8'));
} else {
  // Development: Generate from JSDoc comments
  swaggerSpec = swaggerJSDoc(options);
}

export { swaggerSpec };

// For build-time generation
export const generateSwaggerSpec = () => {
  const spec = swaggerJSDoc(options);
  const outputPath = path.join(process.cwd(), 'public', 'swagger.json');
  
  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log('Swagger spec generated at:', outputPath);
  return spec;
};
