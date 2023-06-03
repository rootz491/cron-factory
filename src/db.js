const mongoose = require("mongoose");
const logger = require("./logger");
require("dotenv").config();

let isConnected = false;

const connectToDatabase = async () => {
	// check if already connected
	if (isConnected) {
		logger.info("Already connected to MongoDB");
		return;
	}

	return mongoose
		.connect(process.env.SERVER_MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		.then(() => {
			isConnected = true;
			logger.info("Connected to MongoDB");
		})
		.catch((error) => {
			isConnected = false;
			logger.error("Failed to connect to MongoDB:", error);
		});
};

const disconnectFromDatabase = async () => {
	return mongoose
		.disconnect()
		.then(() => {
			isConnected = false;
			logger.info("Disconnected from MongoDB");
		})
		.catch((error) => {
			logger.error("Failed to disconnect from MongoDB:", error);
		});
};

const isDatabaseConnected = () => {
	return isConnected;
};

module.exports = {
	connectToDatabase,
	disconnectFromDatabase,
	isDatabaseConnected,
};
