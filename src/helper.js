const moment = require("moment");

const SHORT_CODES = {
	today: moment().startOf("day").toISOString(),
	tommorow: moment().add(1, "day").startOf("day").toISOString(),
	yesterday: moment().subtract(1, "day").startOf("day").toISOString(),
	"this-month": moment().startOf("month").toISOString(),
	"last-month": moment().subtract(1, "month").startOf("month").toISOString(),
	"this-year": moment().startOf("year").toISOString(),
	"last-year": moment().subtract(1, "year").startOf("year").toISOString(),
};

const transformPayload = (payload) => {
	if (!payload) return undefined;

	let transformedPayload = {};

	for (const [key, value] of Object.entries(payload)) {
		if (SHORT_CODES[value]) {
			transformedPayload[key] = SHORT_CODES[value];
		} else {
			transformedPayload[key] = value;
		}
	}

	return transformedPayload;
};

// Test the transformPayload function
/*
console.log(
	transformPayload({
		createdAt: "today",
		updatedAt: "tommorow",
		name: "yesterday",
		age: "this-month",
		dob: "last-month",
		doj: "this-year",
		dol: "last-year",
	})
);

/*  Output:
{
  createdAt: '2023-06-12T18:30:00.000Z',
  updatedAt: '2023-06-13T18:30:00.000Z',
  name: '2023-06-11T18:30:00.000Z',
  age: '2023-05-31T18:30:00.000Z',
  dob: '2023-04-30T18:30:00.000Z',
  doj: '2022-12-31T18:30:00.000Z',
  dol: '2021-12-31T18:30:00.000Z'
}

*/

module.exports = {
	SHORT_CODES,
	transformPayload,
};
