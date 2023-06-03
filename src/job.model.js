const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
	name: { type: String, unique: true },
	type: { type: String },
	interval: { type: String },
	apiEndpoint: { type: String },
	method: { type: String },
	headers: { type: Object },
});

const Job = mongoose.model("Job", jobSchema);

const createJob = async (jobData) => {
	const job = new Job(jobData);
	await job.save();
	return job;
};

const getAllJobs = async () => {
	return Job.find({});
};

module.exports = {
	Job,
	createJob,
	getAllJobs,
};
