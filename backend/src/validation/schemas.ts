import Joi from 'joi';

// using existing Joi import at top of file

// Email validation regex (RFC 5322 compliant)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Common validation schemas
export const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string()
      .pattern(emailRegex)
      .max(255)
      .required()
      .messages({
        'string.pattern.base': 'Invalid email format',
        'string.empty': 'Email is required',
        'string.max': 'Email must be less than 255 characters'
      }),
    password: Joi.string()
      .min(6)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must be less than 255 characters'
      })
  }),

  register: Joi.object({
    email: Joi.string()
      .pattern(emailRegex)
      .max(255)
      .required()
      .messages({
        'string.pattern.base': 'Invalid email format',
        'string.empty': 'Email is required',
        'string.max': 'Email must be less than 255 characters'
      }),
    password: Joi.string()
      .min(8)
      .max(255)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be less than 255 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    first_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name must be less than 50 characters'
      }),
    last_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name must be less than 50 characters'
      }),
    role: Joi.string()
      .valid('admin', 'employee')
      .default('employee')
      .messages({
        'any.only': 'Role must be either admin or employee'
      })
  }),

  createUser: Joi.object({
    email: Joi.string()
      .pattern(emailRegex)
      .max(255)
      .required()
      .messages({
        'string.pattern.base': 'Invalid email format',
        'string.empty': 'Email is required',
        'string.max': 'Email must be less than 255 characters'
      }),
    password: Joi.string()
      .min(8)
      .max(255)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be less than 255 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    first_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name must be less than 50 characters'
      }),
    last_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name must be less than 50 characters'
      }),
    role: Joi.string()
      .valid('admin', 'employee')
      .default('employee')
      .messages({
        'any.only': 'Role must be either admin or employee'
      })
  }),

  updateUser: Joi.object({
    first_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.empty': 'First name cannot be empty',
        'string.max': 'First name must be less than 50 characters'
      }),
    last_name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.empty': 'Last name cannot be empty',
        'string.max': 'Last name must be less than 50 characters'
      }),
    role: Joi.string()
      .valid('admin', 'employee')
      .optional()
      .messages({
        'any.only': 'Role must be either admin or employee'
      }),
    is_active: Joi.boolean()
      .optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string()
      .min(8)
      .max(255)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must be less than 255 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
  }),

  // Customer schemas
  createCustomer: Joi.object({
    company_name: Joi.string()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.empty': 'Company name is required',
        'string.max': 'Company name must be less than 255 characters'
      }),
    contact_name: Joi.string()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.empty': 'Contact name is required',
        'string.max': 'Contact name must be less than 255 characters'
      }),
    email: Joi.string()
      .pattern(emailRegex)
      .max(255)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Invalid email format',
        'string.max': 'Email must be less than 255 characters'
      }),
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .max(20)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Invalid phone number format',
        'string.max': 'Phone number must be less than 20 characters'
      }),
    address: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Address must be less than 500 characters'
      }),
    city: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'City must be less than 100 characters'
      }),
    state: Joi.string()
      .trim()
      .length(2)
      .uppercase()
      .optional()
      .allow('')
      .messages({
        'string.length': 'State must be a 2-letter code',
        'string.uppercase': 'State must be uppercase'
      }),
    zip_code: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Invalid ZIP code format (use 12345 or 12345-6789)'
      })
  })
};

// Export individual schemas for convenience
export const {
  login: loginSchema,
  register: registerSchema,
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  resetPassword: resetPasswordSchema,
  createCustomer: createCustomerSchema
} = schemas;

// Customer API validation (aligned to current API fields)

const apiEmail = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .max(255);

export const createCustomerApiSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  address: Joi.string().trim().max(500).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().length(2).uppercase().allow('', null),
  zip_code: Joi.string().trim().pattern(/^\d{5}(-\d{4})?$/).allow('', null),
  phone: Joi.string().trim().max(50).allow('', null),
  mobile: Joi.string().trim().max(50).allow('', null),
  fax: Joi.string().trim().max(50).allow('', null),
  email: apiEmail.allow('', null),
  accounting_email: apiEmail.allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null)
}).unknown(false);

export const updateCustomerApiSchema = createCustomerApiSchema; 

// ============================================
// Product API Schemas
// ============================================

// GET /api/products?type=...
export const getProductsQuerySchema = Joi.object({
  type: Joi.string().valid('handrail', 'landing_tread', 'rail_parts').optional()
}).unknown(false);

// Handrail product schemas
export const createHandrailProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Name is required'
  }),
  cost_per_6_inches: Joi.number().min(0).required().messages({
    'number.base': 'cost_per_6_inches must be a number',
    'number.min': 'cost_per_6_inches must be non-negative'
  })
}).unknown(false);

export const updateHandrailProductSchema = createHandrailProductSchema;

// Landing tread product schemas
export const createLandingTreadProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Name is required'
  }),
  cost_per_6_inches: Joi.number().min(0).required().messages({
    'number.base': 'cost_per_6_inches must be a number',
    'number.min': 'cost_per_6_inches must be non-negative'
  }),
  labor_install_cost: Joi.number().min(0).required().messages({
    'number.base': 'labor_install_cost must be a number',
    'number.min': 'labor_install_cost must be non-negative'
  })
}).unknown(false);

export const updateLandingTreadProductSchema = createLandingTreadProductSchema;

// Rail parts product schemas
export const createRailPartsProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Name is required'
  }),
  base_price: Joi.number().min(0).required().messages({
    'number.base': 'base_price must be a number',
    'number.min': 'base_price must be non-negative'
  }),
  labor_install_cost: Joi.number().min(0).required().messages({
    'number.base': 'labor_install_cost must be a number',
    'number.min': 'labor_install_cost must be non-negative'
  })
}).unknown(false);

export const updateRailPartsProductSchema = createRailPartsProductSchema;
