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
  unit_number: Joi.string().trim().max(50).allow('', null),
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

// ============================================
// Project (Jobs parent) API Schemas
// ============================================

export const createProjectApiSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(1).max(255).required(),
  address: Joi.string().trim().max(500).allow('', null),
  unit_number: Joi.string().trim().max(50).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().length(2).uppercase().allow('', null),
  zip_code: Joi.string().trim().pattern(/^\d{5}(-\d{4})?$/).allow('', null)
}).unknown(false);

export const updateProjectApiSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255),
  address: Joi.string().trim().max(500).allow('', null),
  unit_number: Joi.string().trim().max(50).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().length(2).uppercase().allow('', null),
  zip_code: Joi.string().trim().pattern(/^\d{5}(-\d{4})?$/).allow('', null)
}).min(1).unknown(false);

// GET /api/jobs query schema (projects list)
export const getProjectsQuerySchema = Joi.object({
  q: Joi.string().trim().max(255).optional(),
  address: Joi.string().trim().max(500).optional(),
  city: Joi.string().trim().max(100).optional(),
  state: Joi.string().trim().length(2).uppercase().optional(),
  zip: Joi.string().trim().max(20).optional()
}).unknown(false);

// ============================================
// Job Item (child of project) API Schemas
// ============================================

export const createJobItemApiSchema = Joi.object({
  customer_id: Joi.number().integer().positive(),
  project_id: Joi.number().integer().positive(),
  salesman_id: Joi.number().integer().positive().allow(null),
  title: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('quote', 'order', 'invoice').default('quote'),
  delivery_date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().allow('')).allow(null),
  job_location: Joi.string().trim().max(255).allow('', null),
  order_designation: Joi.string().trim().max(100).allow('', null),
  model_name: Joi.string().trim().max(100).allow('', null),
  installer: Joi.string().trim().max(100).allow('', null),
  terms: Joi.string().trim().max(2000).allow('', null),
  po_number: Joi.string().trim().max(100).allow('', null),
  show_line_pricing: Joi.boolean().default(true)
}).xor('customer_id', 'project_id').unknown(false);

export const updateJobItemApiSchema = Joi.object({
  customer_id: Joi.number().integer().positive(),
  job_id: Joi.number().integer().positive(), // allow switching project linkage
  salesman_id: Joi.number().integer().positive().allow(null),
  title: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('quote', 'order', 'invoice'),
  delivery_date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().allow('')).allow(null),
  job_location: Joi.string().trim().max(255).allow('', null),
  order_designation: Joi.string().trim().max(100).allow('', null),
  model_name: Joi.string().trim().max(100).allow('', null),
  installer: Joi.string().trim().max(100).allow('', null),
  terms: Joi.string().trim().max(2000).allow('', null),
  po_number: Joi.string().trim().max(100).allow('', null),
  show_line_pricing: Joi.boolean()
}).min(1).unknown(false);

// Job Sections
export const createJobSectionApiSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  display_order: Joi.number().integer().min(0).default(0)
}).unknown(false);

export const updateJobSectionApiSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  display_order: Joi.number().integer().min(0)
}).min(1).unknown(false);

// Quote Items schemas appended after stair schemas (see below for exports)

// ============================================
// Stairs API Schemas
// ============================================

// POST /api/stairs/calculate-price
export const calculateStairPriceSchema = Joi.object({
  jobId: Joi.number().integer().optional(),
  floorToFloor: Joi.number().positive().required(),
  numRisers: Joi.number().integer().min(1).max(30).required(),
  treads: Joi.array().items(
    Joi.object({
      riserNumber: Joi.number().integer().min(1).required(),
      type: Joi.string().valid('box', 'open_left', 'open_right', 'double_open').required(),
      stairWidth: Joi.number().positive().required()
    }).unknown(false)
  ).min(0).required(),
  treadMaterialId: Joi.number().integer().required(),
  riserMaterialId: Joi.number().integer().required(),
  roughCutWidth: Joi.number().min(8).max(20).optional(),
  noseSize: Joi.number().min(0.5).max(3).optional(),
  stringerType: Joi.string().pattern(/^\d+(?:\.\d+)?x\d+(?:\.\d+)?$/).optional(),
  stringerMaterialId: Joi.number().integer().optional(),
  numStringers: Joi.number().integer().min(0).max(5).optional(),
  centerHorses: Joi.number().integer().min(0).max(5).optional(),
  fullMitre: Joi.boolean().optional(),
  bracketType: Joi.string().trim().max(255).allow('', null).optional(),
  specialParts: Joi.array().items(
    Joi.object({
      partId: Joi.number().integer().required(),
      materialId: Joi.number().integer().optional(),
      quantity: Joi.number().integer().min(1).default(1),
      position: Joi.string().trim().max(100).allow('', null)
    }).unknown(false)
  ).default([]),
  includeLandingTread: Joi.boolean().optional(),
  individualStringers: Joi.object({
    left: Joi.object({
      width: Joi.number().positive().required(),
      thickness: Joi.number().positive().required(),
      materialId: Joi.number().integer().required()
    }).optional(),
    right: Joi.object({
      width: Joi.number().positive().required(),
      thickness: Joi.number().positive().required(),
      materialId: Joi.number().integer().required()
    }).optional(),
    center: Joi.alternatives().try(
      Joi.object({
        width: Joi.number().positive().required(),
        thickness: Joi.number().positive().required(),
        materialId: Joi.number().integer().required()
      }),
      Joi.valid(null)
    ).optional()
  }).optional()
}).unknown(false);

// POST /api/stairs/configurations
export const createStairConfigurationApiSchema = Joi.object({
  jobId: Joi.number().integer().required(),
  configName: Joi.string().trim().min(1).max(255).required(),
  floorToFloor: Joi.number().positive().required(),
  numRisers: Joi.number().integer().min(1).max(30).required(),
  treadMaterialId: Joi.number().integer().required(),
  riserMaterialId: Joi.number().integer().required(),
  treadSize: Joi.string().trim().max(50).allow('', null),
  roughCutWidth: Joi.number().min(8).max(20).required(),
  noseSize: Joi.number().min(0.5).max(3).required(),
  stringerType: Joi.string().trim().max(50).allow('', null),
  stringerMaterialId: Joi.number().integer().allow(null),
  numStringers: Joi.number().integer().min(0).max(5).allow(null),
  centerHorses: Joi.number().integer().min(0).max(5).allow(null),
  fullMitre: Joi.boolean().required(),
  bracketType: Joi.string().trim().max(255).allow('', null),
  subtotal: Joi.number().min(0).required(),
  laborTotal: Joi.number().min(0).required(),
  taxAmount: Joi.number().min(0).required(),
  totalAmount: Joi.number().min(0).required(),
  specialNotes: Joi.string().trim().max(2000).allow('', null),
  items: Joi.array().items(
    Joi.object({
      itemType: Joi.string().valid('tread', 'riser', 'stringer', 'special_part').required(),
      riserNumber: Joi.number().integer().min(1).allow(null),
      treadType: Joi.string().valid('box', 'open_left', 'open_right', 'double_open').allow(null),
      stairWidth: Joi.number().positive().allow(null),
      boardTypeId: Joi.number().integer().allow(null),
      materialId: Joi.number().integer().allow(null),
      specialPartId: Joi.number().integer().allow(null),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
      laborPrice: Joi.number().min(0).required(),
      totalPrice: Joi.number().min(0).required(),
      notes: Joi.string().trim().max(1000).allow(null)
    }).unknown(false)
  ).default([]),
  individualStringers: Joi.object({
    left: Joi.object({
      width: Joi.number().positive().required(),
      thickness: Joi.number().positive().required(),
      materialId: Joi.number().integer().required()
    }).optional(),
    right: Joi.object({
      width: Joi.number().positive().required(),
      thickness: Joi.number().positive().required(),
      materialId: Joi.number().integer().required()
    }).optional(),
    center: Joi.alternatives().try(
      Joi.object({
        width: Joi.number().positive().required(),
        thickness: Joi.number().positive().required(),
        materialId: Joi.number().integer().required()
      }),
      Joi.valid(null)
    ).optional()
  }).optional()
}).unknown(true);

// ============================================
// Quote Items (depend on stair configuration schema)
// ============================================

export const addQuoteItemApiSchema = Joi.object({
  part_number: Joi.string().trim().max(100).allow('', null),
  description: Joi.string().trim().min(1).max(2000).required(),
  quantity: Joi.number().min(0).required(),
  unit_price: Joi.number().min(0).required(),
  is_taxable: Joi.boolean().optional(),
  product_id: Joi.number().integer().positive().optional(),
  length_inches: Joi.number().integer().min(6).max(240).optional(),
  stair_configuration: createStairConfigurationApiSchema.optional()
}).unknown(false);

export const updateQuoteItemApiSchema = Joi.object({
  part_number: Joi.string().trim().max(100).allow('', null),
  description: Joi.string().trim().min(1).max(2000),
  quantity: Joi.number().min(0),
  unit_price: Joi.number().min(0),
  is_taxable: Joi.boolean(),
  product_id: Joi.number().integer().positive(),
  length_inches: Joi.number().integer().min(6).max(240),
  stair_configuration: createStairConfigurationApiSchema,
  stair_config_id: Joi.number().integer().positive()
}).min(1).unknown(false);
