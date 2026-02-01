// Script to generate swagger.json at build time
import { generateSwaggerSpec } from '../src/lib/swagger';

console.log('Generating Swagger specification...');
generateSwaggerSpec();
console.log('Swagger specification generated successfully!');
