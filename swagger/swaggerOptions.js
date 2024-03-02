module.exports = {
  swaggerDefinition: {
      openapi: '3.0.0',
      info: {
          title: 'Bed Management API',
          version: '1.0.0',
          description: 'API endpoints for managing beds.',
      },
      servers: [
          {
              url: 'http://localhost:4000', // Adjust the URL as per your server configuration
              description: 'Development server',
          },
      ],
  },
  apis: ['./controller/beds.js', './controller/patients.js', './controller/transfers.js', './controller/discharges.js','./dashboard/dash.js' ], // Paths to the files containing your Swagger definitions
};
