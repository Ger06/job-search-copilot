import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "./validation.js";

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const sessionId = req.header("X-Session-Id");
  if (!sessionId || sessionId.trim().length === 0) {
    next(new ValidationError("Falta el header X-Session-Id"));
    return;
  }
  req.sessionId = sessionId;
  next();
}
