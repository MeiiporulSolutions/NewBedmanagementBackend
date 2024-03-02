
const express = require('express');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorhandler');
const bedRoutes = require('./router/bedmanage');
const logger = require('./logger');

require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
const url = "mongodb://127.0.0.1:27017/Beddb";
mongoose.connect(url);
const con = mongoose.connection;
con.on('open', () => {
    logger.info('MongoDB connected');
});

// Swagger documentation setup
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swagger/swaggerOptions');

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/', bedRoutes);

// Error handling middleware
app.use(errorHandler);


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
