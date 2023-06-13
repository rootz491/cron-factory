const mongoose = require("mongoose");
const logger = require("./logger");

const jobSchema = new mongoose.Schema({
	name: { type: String, unique: true },
	type: { type: String },
	interval: { type: String },
	apiEndpoint: { type: String },
	method: { type: String },
	headers: { type: Object },
	payload: { type: Object },
	status: { type: String, default: "active", enum: ["active", "inactive"] },
});

const Job = mongoose.model("Job", jobSchema);

const createJob = async (jobData) => {
	const job = new Job(jobData);
	await job.save();
	return job;
};

const getJob = async ({ jobId, jobName }) => {
	if (!jobId && !jobName)
		throw new Error("jobId or jobName is required, but not provided");
	if (jobId && jobName)
		throw new Error("jobId or jobName is required, but not both");
	return await Job.findOne({ $or: [{ _id: jobId }, { name: jobName }] }).exec();
};

const toggleJob = async ({ jobId, jobName, status }) => {
	try {
		if (!jobId && !jobName)
			throw new Error("jobId or jobName is required, but not provided");
		if (jobId && jobName)
			throw new Error("jobId or jobName is required, but not both");
	
		if (!status) throw new Error("status is required, but not provided");
	
		if (status && !["active", "inactive"].includes(status))
			throw new Error("Invalid status provided");
	
		const job = await getJob({ jobId, jobName });
		if (!job) throw new Error("Job not found");
	
		job.status = status;
	
		await job.save();
		return job;
	} catch (error) {
		logger.error("Failed to toggle job:", error);
		return error;
	}
};

const getAllJobs = async () => {
	return Job.find({});
};

module.exports = {
	Job,
	createJob,
	getAllJobs,
	getJob,
	toggleJob,
};
