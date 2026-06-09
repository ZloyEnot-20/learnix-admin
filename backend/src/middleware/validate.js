import { ApiError } from "../utils/ApiError.js"

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })
    if (!result.success) {
      return next(ApiError.badRequest("Validation failed", result.error.flatten()))
    }
    if (result.data.body !== undefined) req.body = result.data.body
    if (result.data.query !== undefined) req.query = result.data.query
    if (result.data.params !== undefined) req.params = result.data.params
    next()
  }
}
