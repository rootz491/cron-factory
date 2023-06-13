const cron = require("node-cron");
const axios = require("axios");
const { stringify } = require("flatted");
const { createJob, getAllJobs, getJob, toggleJob } = require("./job.model");
const logger = require("./logger");

let scheduledJobs = [];

const scheduleJob = (job) => {
	const { name, type, interval, apiEndpoint, method, headers, payload } = job;

	if (!name || !type || !apiEndpoint || !method || !headers) {
		logger.error("Invalid job data", job);
		return false;
	}

	if (typeof name !== "string")
		throw new Error("name must be a string, but got:", typeof name);

	if (typeof type !== "string")
		throw new Error("type must be a string, but got:", typeof type);

	if (typeof apiEndpoint !== "string")
		throw new Error(
			"apiEndpoint must be a string, but got:",
			typeof apiEndpoint
		);

	if (typeof method !== "string")
		throw new Error("method must be a string, but got:", typeof method);

	if (
		method !== "GET" &&
		method !== "POST" &&
		method !== "PUT" &&
		method !== "DELETE" &&
		method !== "PATCH" &&
		method !== "HEAD" &&
		method !== "OPTIONS" &&
		method !== "TRACE" &&
		method !== "CONNECT"
	)
		throw new Error(
			"method must be one of GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, TRACE, CONNECT, but got:",
			method
		);

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
			params: method === "GET" ? payload : undefined,
			...(headers && { headers }),
			...(payload && method !== "GET" && { data: payload }),
		})
			.then((response) => {
				logger.info(`Job '${name}' triggered successfully!`, {
					meta: {
						jobName: name,
						payload,
						method,
						headers,
						apiEndpoint,
						response: response?.data ?? response?.body,
					},
				});
			})
			.catch((error) => {
				const statusCode = error?.response?.status;
				logger.error(`Failed to trigger job '${name}':`, {
					meta: {
						jobName: name,
						payload,
						method,
						headers,
						apiEndpoint,
						...(statusCode && { statusCode: error?.response?.status }),
					},
				});
			});
	});

	scheduledJobs.push({
		name,
		job: jobObj,
	});

	return true;
};

const scheduleJobs = () => {
	logger.info("Scheduling jobs");
	getAllJobs()
		.then((jobs) => {
			if (jobs.length === 0) {
				logger.info("No jobs to schedule");
				return;
			}
			jobs
				.filter((job) => job.status === "active") //	on restart, only schedule active jobs
				.forEach((job) => {
					logger.info(`Scheduling job '${job.name}'`);
					scheduleJob(job);
				});
		})
		.catch((error) => {
			logger.error("Failed to get jobs:", error);
		});
};

const stopAllJobs = async () => {
	logger.info("Stopping all jobs");
	scheduledJobs.forEach((item) => {
		item?.job?.stop();
	});
	scheduledJobs = [];
};

const stopJobByName = (name) => {
	const jobObj = scheduledJobs.find((job) => job.name === name);
	if (jobObj) {
		jobObj.job.stop();
		logger.info(`Job '${name}' stopped successfully`);
		//	Remove the job from scheduledJobs array
		scheduledJobs = scheduledJobs.filter((job) => job.name !== name);
		return true;
	}
	logger.info(`Job '${name}' not found`);
	return false;
};

const startJobByName = async (name) => {
	if (!name) throw new Error("name is required, but not provided");
	if (typeof name !== "string")
		throw new Error("name must be a string, but got:", typeof name);

	// Check if the job is already scheduled
	const jobObj = scheduledJobs.find((job) => job.name === name);
	if (jobObj) {
		logger.error(`Job '${name}' is already scheduled`);
		return true;
	}

	const job = await getJob({ jobName: name });
	if (job) {
		logger.info(`Scheduling job '${name}'`);
		scheduleJob(job);
		return true;
	} else {
		logger.info(`Job '${name}' not found`);
		return false;
	}
};

module.exports = {
	scheduleJob,
	scheduleJobs,
	stopAllJobs,
	stopJobByName,
	startJobByName,
};
