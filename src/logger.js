const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const WinstonMongoDB = require("winston-mongodb");
require("dotenv").config();

const LOG_MONGO_URI = process.env.LOGS_MONGO_URI;
const LOG_SERVER_HOST = process.env.LOGGER_SERVER_HOST;
const LOG_SERVER_PORT = process.env.LOGGER_SERVER_PORT;
const LOG_SERVER_API_ENDPOINT = process.env.LOGGER_SERVER_API_ENDPOINT;
const LOG_SERVER_SECRET_HEADER = process.env.LOGGER_SERVER_SECRET_HEADER;
const LOG_SERVER_API_KEY = process.env.LOGGER_SERVER_API_KEY;

// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
	format: combine(timestamp(), logFormat),
	transports: [
		new transports.Console(),
		new transports.File({
			level: "info",
			filename: "logs.log",
			format: combine(timestamp(), logFormat),
		}),
		LOG_MONGO_URI
			? new WinstonMongoDB.MongoDB({
					level: "info",
					db: LOG_MONGO_URI,
					options: {
						useUnifiedTopology: true,
					},
					collection: "logs",
					format: combine(timestamp(), logFormat),
			  })
			: null,
		// https://github.com/winstonjs/winston/blob/master/docs/transports.md#http-transport
		new winston.transports.Http({
			level: "info",
			format: combine(timestamp(), logFormat),
			host: LOG_SERVER_HOST,
			port: LOG_SERVER_PORT,
			path: LOG_SERVER_API_ENDPOINT,
			headers: {
				"Content-Type": "application/json",
				[LOG_SERVER_SECRET_HEADER]: LOG_SERVER_API_KEY,
			},
			handleExceptions: true,
			handleRejections: true,
		}),
	].filter((transport) => transport !== null),
});

// Create a custom stream for morgan to write logs to winston
logger.stream = {
	write: function (message) {
		logger.info(message.trim());
	},
};

module.exports = logger;
