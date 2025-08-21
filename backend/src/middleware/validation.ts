import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Creates a validation middleware for request body validation
 * @param schema - Joi validation schema
 * @param location - Location to validate ('body', 'query', 'params')
 * @returns Express middleware function
 */
export const validate = (
  schema: Joi.ObjectSchema, 
  location: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the data to validate based on location
    let dataToValidate;
    switch (location) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      default:
        dataToValidate = req.body;
    }

    // Validate the data
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Show all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields from the validated data
    });

    if (error) {
      // Format validation errors for better user experience
      const validationErrors: ValidationError[] = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: validationErrors.length === 1 
          ? validationErrors[0].message 
          : `${validationErrors.length} validation errors occurred`
      });
    }

    // Replace the original data with the validated (and potentially cleaned) data
    switch (location) {
      case 'body':
        req.body = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'params':
        req.params = value;
        break;
    }

    next();
  };
};

/**
 * Middleware for validating request body
 * @param schema - Joi validation schema
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'body');
};

/**
 * Middleware for validating query parameters
 * @param schema - Joi validation schema
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'query');
};

/**
 * Middleware for validating route parameters
 * @param schema - Joi validation schema
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'params');
};

/**
 * Common ID parameter validation schema
 */
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive',
    'any.required': 'ID parameter is required'
  })
});

/**
 * Utility function to create consistent error responses
 */
export const createValidationErrorResponse = (message: string, details?: any) => {
  return {
    error: 'Validation failed',
    message,
    details
  };
};