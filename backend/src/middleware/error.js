import { ApiError } from "../utils/ApiError.js"

export function notFound(_req, _res, next) {
  next(ApiError.notFound("Route not found"))
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500
  const message = err.message ?? "Internal server error"
  if (status >= 500) console.error(err)
  res.status(status).json({
    error: message,
    details: err.details ?? undefined,
  })
}
