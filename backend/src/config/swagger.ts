import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PredixRoute API',
      version: '1.0.0',
      description: 'AI-powered logistics intelligence platform API',
    },
    servers: [{ url: `${config.frontendUrl.replace(/:\d+$/, ':3000')}/api/v1`, description: 'API Gateway' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'prx_access' },
        apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
