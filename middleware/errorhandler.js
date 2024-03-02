
const logger = require('../logger'); // Import the logger module

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(message);

  // Define default title
  let title = 'Internal Server Error';

  // Set title based on status code
  switch (statusCode) {
      case 400:
          title = 'Bad Request';
          break;
      case 404:
          title = 'Not Found';
          break;
      case 401:
          title = 'Unauthorized';
          break;
  }

  // Send the appropriate response
  res.status(statusCode).json({ title, message });
};



module.exports = errorHandler;
