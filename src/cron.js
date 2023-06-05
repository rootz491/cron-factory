const cron = require("node-cron");
const axios = require("axios");
const { createJob, getAllJobs } = require("./job.model");
const logger = require("./logger");

let scheduledJobs = [];

const scheduleJob = (job) => {
	const { name, type, interval, apiEndpoint, method, headers } = job;

	if (!name || !type || !apiEndpoint || !method || !headers) {
		logger.error("Invalid job data", job);
		return false;
	}

	const { body } = headers;

	let schedule;
	if (type === "interval") {
		schedule = interval;
	} else if (type === "daily") {
		schedule = "0 0 * * *"; // Runs at 00:00 every day
	} else {
		logger.error(`Invalid job type for job '${name}'`);
		return false;
	}

	const jobObj = cron.schedule(schedule, () => {
		axios(apiEndpoint, {
			method,
			headers,
			data: body,
		})
			.then((response) => {
				logger.info(`Job '${name}' triggered successfully!\n`, response.data);
			})
			.catch((error) => {
				logger.error(`Failed to trigger job '${name}':`, error.message);
			});
	});

	scheduledJobs.push({
		name,
		job: jobObj,
	});

	return true;
};

const scheduleJobs = () => {
	getAllJobs()
		.then((jobs) => {
			if (jobs.length === 0) {
				logger.info("No jobs to schedule");
				return;
			}
			jobs.forEach((job) => {
				scheduleJob(job);
			});
		})
		.catch((error) => {
			logger.error("Failed to get jobs:", error);
		});
};

const stopAllJobs = () => {
	scheduledJobs.forEach((item) => {
		item?.job?.stop();
	});
};

const stopJobByName = (name) => {
	const jobObj = scheduledJobs.find((job) => job.name === name);
	if (jobObj) {
		jobObj.job.stop();
		return true;
	}
	return false;
};

module.exports = {
	scheduleJob,
	scheduleJobs,
	stopAllJobs,
	stopJobByName,
};
