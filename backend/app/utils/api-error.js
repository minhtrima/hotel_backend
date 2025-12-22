class ApiError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode ? statusCode : 500;
    this.success = false;
    this.message = message ? message : "An unexpected error occurred";
  }
}

module.exports = ApiError;
