let errors = {};

errors.NotFound = (message, code) => {
	Error.captureStackTrace(this, this.constructor);
	
	this.name = 'Not Found';
	this.message = message || 'The requested resource could not be found.';
	this.code = code || 404;
};

errors.InternalServerError = (message, code, err) => {
	if (err) {
		this.stack = err.stack;
		this._err = err;
	}
	
	if (!this.stack) Error.captureStackTrace(this, this.constructor);
	
	this.name = 'Internal Server Error';
	this.message = message || 'Internal server error. Please try again later.';
	this.code = code || 500;
};

errors.UnprocessableEntity = (message, code) => {
	Error.captureStackTrace(this, this.constructor);
	
	this.name = 'Unprocessable Entity';
	this.message = message || 'Unprocessable entity. Check your request and try again.';
	this.code = code || 422;
};

module.exports = errors;