import HttpError from '../utils/httpError.js'

// Validates req.body against a zod schema and replaces it with the parsed result.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      throw new HttpError(400, result.error.issues[0].message)
    }
    req.body = result.data
    next()
  }
}
