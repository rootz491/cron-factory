const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const WinstonMongoDB = require("winston-mongodb");
const { default: axios } = require("axios");
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

class CustomTransport extends winston.Transport {
	constructor(opts) {
		super(opts);
		if (!opts.url) throw Error("URL not provided");
		this.url = opts.url;
	}
	log(info, callback) {
		try {
			setImmediate(() => {
				this.emit("logged", info);
			});
			axios
				.post(this.url, info, {
					headers: {
						[LOG_SERVER_SECRET_HEADER]: LOG_SERVER_API_KEY,
					},
				})
				.catch((error) => {
					logger.error("Failed to log to custom transport:", error);
				});
			callback();
		} catch (error) {
			logger.error("Failed to log to custom transport:", error);
		}
	}
}

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
		new CustomTransport({
			url: `${LOG_SERVER_HOST}:${LOG_SERVER_PORT}${LOG_SERVER_API_ENDPOINT}`,
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
