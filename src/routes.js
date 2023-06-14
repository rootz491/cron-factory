const express = require("express");
const { apiKeyCheck } = require("./middleware");
const { createJob, getAllJobs, Job, toggleJob } = require("./job.model");
const logger = require("./logger");
const {
	scheduleJob,
	stopJobByName,
	stopAllJobs,
	startJobByName,
} = require("./cron");
const { transformPayload } = require("./helper");

const router = express.Router();

// Endpoint to create a new job
router.post("/jobs", apiKeyCheck, async (req, res) => {
	console.log("post");
	const { name, type, interval, apiEndpoint, method, headers, payload } =
		req.body;

	try {
		// Check if the job name is unique
		const existingJob = await Job.findOne({ name });
		if (existingJob) {
			return res.status(400).send("Job with the same name already exists");
		}

		const isJobScheduled = scheduleJob({
			name,
			type,
			interval,
			apiEndpoint,
			method,
			headers,
			payload: transformPayload(payload),
		});

		if (!isJobScheduled)
			return res
				.status(500)
				.send("Couldn't schedule the job, check the logs for more details");

		// Create a new job
		await createJob({
			name,
			type,
			interval,
			apiEndpoint,
			method,
			headers,
			payload: transformPayload(payload),
		});

		if (res) {
			res.status(201).send("Job created successfully");
		}
	} catch (error) {
		logger.error("Failed to create job:", error);
		res.status(500).send("Internal Server Error");
	}
});

// Endpoint to get all jobs
router.get("/jobs", apiKeyCheck, async (req, res) => {
	try {
		const jobs = await getAllJobs();
		res.json(jobs);
	} catch (error) {
		logger.error("Failed to get jobs:", error);
		res.status(500).send("Internal Server Error");
	}
});

router.delete("/jobs", apiKeyCheck, async (req, res) => {
	try {
		// const jobs = await Job.deleteMany();
		// stopAllJobs();
		// res.json(jobs);
		res.json({
			message: "API is disabled for now",
		});
	} catch (error) {
		logger.error("Failed to delete jobs:", error);
		res.status(500).send("Internal Server Error");
	}
});

router.delete("/jobs/:name", apiKeyCheck, async (req, res) => {
	try {
		const { name } = req.params;
		const job = await Job.deleteOne({ name }, { new: true }).exec();
		if (!job) return res.status(404).send(`Job with name '${name}' not found`);

		if (job.deletedCount === 0)
			return res.status(404).send(`Job with name '${name}' not found`);

		const isDeleted = stopJobByName(name);
		logger.info(
			`Job '${name}' deleted: ${isDeleted ? "was running" : "wasn't running"}`
		);

		res.json({
			message: "Job deleted successfully",
			job,
		});
	} catch (error) {
		logger.error("Failed to delete job:", error);
		res.status(500).send("Internal Server Error");
	}
});

router.patch("/jobs/:name", apiKeyCheck, async (req, res) => {
	try {
		const { name } = req.params;
		const { status } = req.body;

		const job = await toggleJob({ jobName: name, status });

		if (job instanceof Error) {
			return res.status(404).send(job);
		}

		if (status === "active") {
			startJobByName(name);
		} else {
			stopJobByName(name);
		}

		res.json({
			message: "Job updated successfully",
			job,
		});
	} catch (error) {
		logger.error("Failed to update job:", error);
		res.status(500).send("Internal Server Error");
	}
});

module.exports = router;
