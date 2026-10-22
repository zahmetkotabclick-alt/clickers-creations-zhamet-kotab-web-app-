import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Cast to pino.Logger (base type) so pino-http v9's Options.logger constraint
// is satisfied regardless of how TypeScript infers the generic parameters.
export const logger: pino.Logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
