const express = require("express");
const morgan = require("morgan");
const { connectToDatabase } = require("./db");
const router = require("./routes");
const logger = require("./logger");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(morgan("combined", { stream: logger.stream }));

// Connect to MongoDB
connectToDatabase();

// Apply routes
app.use("/", router);

// Start the server
app.listen(port, () => {
	logger.info(`Server running on port ${port}`);
});
