require("dotenv").config();

// Middleware to check API key for security
const apiKeyCheck = (req, res, next) => {
	const apiKey = req.header("API-Key");
	if (apiKey === process.env.API_KEY) {
		next();
	} else {
		res.status(401).send("Unauthorized");
	}
};

module.exports = { apiKeyCheck };
