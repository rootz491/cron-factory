### Authentication

- Header

  ```json
  {
  	"API_KEY": "process.env.API_KEY"
  }
  ```

### Database[s]

1.  Cron Jobs - Stores information about cron job - `process.env.SERVER_MONGO_URI`

2.  Logs - Stores logs of cron jobs execution and server traffic as well as general logs of the server. - `process.env.LOGS_MONGO_URI`

### Endpoints

1. GET /jobs

- Returns a list of jobs.

2. POST /jobs

- Creates a new job.

- Body

  ```json
  {
  	"name": "Bot Login FAILED ATTEMPT",
  	"type": "interval",
  	"interval": "*/15 * * * * *",
  	"apiEndpoint": "http://127.0.0.1:2999/auth/signin",
  	"method": "POST",
  	"headers": {
  		"Content-Type": "application/json",
  		"API_KEY": "1234567890"
  	}
  }
  ```

3. DELETE /jobs

- Delete all jobs

4. DELETE /jobs/:name

- Delete a job by name

### Known Issues

- HTTP Logs are not being sent to the Logger server API.
  It's a problem with winston logger's HTTP Transport.

  - https://github.com/winstonjs/winston/issues/1160

  - Possible Solution: Create a custom transport for HTTP requests.

- While storing whole response in case of trigger failure, getting circular JSON error.
  - [explaination](https://stackoverflow.com/questions/64735881/typeerror-converting-circular-structure-to-json-starting-at-object-with-constr)
  - possible solution: [flatted](https://www.npmjs.com/package/flatted)
