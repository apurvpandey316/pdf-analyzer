// Throw this from any route; errorHandler turns it into a JSON response.
export default class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
