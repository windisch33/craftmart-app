import { Request, Response, NextFunction } from 'express';
import type { ObjectSchema } from 'joi';

export function validateBody(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details?.map(d => d.message) || ['Invalid request'];
      return res.status(400).json({ error: 'Validation failed', details });
    }
    // Replace body with sanitized value
    (req as any).body = value;
    next();
  };
}

