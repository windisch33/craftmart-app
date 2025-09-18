import { Request, Response, NextFunction } from 'express';
import {
  createDeposit as createDepositService,
  getDeposits as getDepositsService,
  getDepositById as getDepositByIdService,
  allocateDeposit as allocateDepositService,
  removeAllocation as removeAllocationService,
  getCustomerJobs as getCustomerJobsService,
  getJobItems as getJobItemsService,
  DepositServiceError,
  SUPPORTED_PAYMENT_METHODS,
  type PaymentMethod,
  type AllocationInput,
  type DepositStatus,
  type CreateDepositInput
} from '../services/depositService';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: 'admin' | 'employee';
  };
}

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
};

const ALLOWED_STATUSES: DepositStatus[] = ['allocated', 'partial', 'unallocated'];

const parseAllocations = (rawAllocations: unknown): AllocationInput[] | undefined => {
  if (!Array.isArray(rawAllocations) || rawAllocations.length === 0) {
    return undefined;
  }

  return rawAllocations.map((allocation: any, idx: number) => {
    const jobId = toNumber(allocation?.job_id ?? allocation?.jobId);
    const amount = toNumber(allocation?.amount);
    const jobItemId = toNumber(allocation?.job_item_id ?? allocation?.jobItemId);

    if (jobId === undefined) {
      throw new DepositServiceError(400, `Allocation at index ${idx} is missing a valid job_id`, 'INVALID_JOB_ALLOCATION');
    }

    if (jobItemId === undefined) {
      throw new DepositServiceError(400, `Allocation for job ${jobId} is missing a valid job_item_id`, 'INVALID_JOB_ITEM');
    }

    if (amount === undefined || amount <= 0) {
      throw new DepositServiceError(400, `Allocation for job ${jobId} must include a positive amount`, 'INVALID_ALLOCATION_AMOUNT');
    }

    const allocationInput: AllocationInput = {
      jobId,
      jobItemId,
      amount
    };

    if (allocation?.notes !== undefined) {
      allocationInput.notes = allocation.notes;
    }

    return allocationInput;
  });
};

export const listDeposits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { customer_id, payment_method, status, limit, offset } = req.query;

    const customerId = toNumber(customer_id as string | undefined);
    const limitNumber = toNumber(limit as string | undefined);
    const offsetNumber = toNumber(offset as string | undefined);

    let paymentMethodValue: PaymentMethod | undefined;
    if (payment_method) {
      const method = String(payment_method) as PaymentMethod;
      if (!SUPPORTED_PAYMENT_METHODS.includes(method)) {
        return res.status(400).json({
          error: `payment_method must be one of: ${SUPPORTED_PAYMENT_METHODS.join(', ')}`
        });
      }
      paymentMethodValue = method;
    }

    let statusValue: DepositStatus | undefined;
    if (status) {
      const normalizedStatus = String(status) as DepositStatus;
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
      statusValue = normalizedStatus;
    }

    const deposits = await getDepositsService({
      ...(customerId !== undefined ? { customerId } : {}),
      ...(paymentMethodValue ? { paymentMethod: paymentMethodValue } : {}),
      ...(statusValue ? { status: statusValue } : {}),
      ...(limitNumber !== undefined ? { limit: limitNumber } : {}),
      ...(offsetNumber !== undefined ? { offset: offsetNumber } : {})
    });

    res.json(deposits);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const getDepositById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const depositId = toNumber(req.params.id);

    if (depositId === undefined) {
      return res.status(400).json({ error: 'Deposit ID must be a number' });
    }

    const deposit = await getDepositByIdService(depositId);
    res.json(deposit);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const createDeposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      customer_id,
      payment_method = 'check',
      reference_number,
      payment_date,
      deposit_date,
      total_amount,
      notes,
      initial_allocations
    } = req.body ?? {};

    const customerId = toNumber(customer_id);
    if (customerId === undefined) {
      return res.status(400).json({ error: 'customer_id is required and must be a number' });
    }

    const totalAmount = toNumber(total_amount);
    if (totalAmount === undefined) {
      return res.status(400).json({ error: 'total_amount is required and must be a number' });
    }

    const paymentMethod = String(payment_method) as PaymentMethod;
    if (!SUPPORTED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `payment_method must be one of: ${SUPPORTED_PAYMENT_METHODS.join(', ')}` });
    }

    const allocations = parseAllocations(initial_allocations);

    const createInput: CreateDepositInput = {
      customerId,
      paymentMethod,
      referenceNumber: reference_number,
      paymentDate: payment_date,
      depositDate: deposit_date,
      totalAmount,
      notes,
      userId,
      ...(allocations ? { initialAllocations: allocations } : {})
    };

    const deposit = await createDepositService(createInput);

    res.status(201).json(deposit);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const allocateDeposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const depositId = toNumber(req.params.id);
    if (depositId === undefined) {
      return res.status(400).json({ error: 'Deposit ID must be a number' });
    }

    const allocations = parseAllocations(req.body?.allocations);

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({ error: 'allocations must be a non-empty array' });
    }

    const deposit = await allocateDepositService({ depositId, allocations, userId });

    res.status(200).json(deposit);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const removeAllocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const allocationId = toNumber(req.params.allocationId);

    if (allocationId === undefined) {
      return res.status(400).json({ error: 'Allocation ID must be a number' });
    }

    const { depositId } = await removeAllocationService(allocationId);
    const deposit = await getDepositByIdService(depositId);

    res.status(200).json(deposit);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const getCustomerJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = toNumber(req.params.customerId);

    if (customerId === undefined) {
      return res.status(400).json({ error: 'Customer ID must be a number' });
    }

    const jobs = await getCustomerJobsService(customerId);
    res.json(jobs);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

export const getJobItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const jobId = toNumber(req.params.jobId);

    if (jobId === undefined) {
      return res.status(400).json({ error: 'Job ID must be a number' });
    }

    const items = await getJobItemsService(jobId);
    res.json(items);
  } catch (error) {
    if (error instanceof DepositServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};
