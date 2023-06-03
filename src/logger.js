const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const WinstonMongoDB = require("winston-mongodb");
require("dotenv").config();


// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

// Create a custom logger
const logger = createLogger({
	format: combine(timestamp(), logFormat),
	transports: [
		new transports.Console(),
		new WinstonMongoDB.MongoDB({
			level: "info",
			db: process.env.LOGS_MONGO_URI,
			options: {
				useUnifiedTopology: true,
			},
			collection: "logs",
			format: combine(timestamp(), logFormat),
		}),
		new transports.File({
			level: "info",
			filename: "logs.log",
			format: combine(timestamp(), logFormat),
		}),
	],
});

// Create a custom stream for morgan to write logs to winston
logger.stream = {
  write: function (message) {
    logger.info(message.trim());
  }
};


module.exports = logger;
