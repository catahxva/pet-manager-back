class CustomError extends Error {
  constructor(statusCode, status, errorType) {
    super();

    this.statusCode = statusCode;
    this.status = status;
    this.errorType = errorType;
    this.isCustomError = true;
  }

  errorWithoutStackTrace() {
    return {
      statusCode: this.statusCode,
      status: this.status,
      errorType: this.errorType,
    };
  }
}

export class GenericError extends CustomError {
  constructor({
    statusCode = 400,
    status = process.env.RES_STATUS_FAIL,
    errorType = process.env.ERROR_TYPE_GENERIC,
    message,
  }) {
    super(statusCode, status, errorType);

    this.message = message;
  }

  errorWithoutStackTrace() {
    const baseError = super.errorWithoutStackTrace();

    return {
      ...baseError,
      message: this.message,
    };
  }
}

export class ComplexError extends CustomError {
  constructor({
    statusCode = 400,
    status = process.env.RES_STATUS_FAIL,
    errorType,
    errorsObject,
  }) {
    super(statusCode, status, errorType);

    this.errorsObject = errorsObject;
  }

  errorWithoutStackTrace() {
    const baseError = super.errorWithoutStackTrace();

    return {
      ...baseError,
      errorsObject: this.errorsObject,
    };
  }
}
