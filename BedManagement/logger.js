const winston = require('winston');

// Define logger configuration
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: 'logfile.log' }) // Log to a file
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
  )
});

module.exports = logger;
