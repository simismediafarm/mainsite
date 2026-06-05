export class RegistryError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class RegistryValidationError extends RegistryError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class DependencyViolationError extends RegistryError {
  constructor(message: string, details?: any) {
    super('DEPENDENCY_VIOLATION', message, details);
  }
}

export class CycleDetectedError extends RegistryError {
  constructor(message: string, details?: any) {
    super('CYCLE_DETECTED', message, details);
  }
}

export class TenantBoundaryViolationError extends RegistryError {
  constructor(message: string, details?: any) {
    super('TENANT_BOUNDARY_VIOLATION', message, details);
  }
}

export class LockAcquisitionError extends RegistryError {
  constructor(message: string, details?: any) {
    super('LOCK_ACQUISITION_FAILED', message, details);
  }
}

export class VersionConsistencyError extends RegistryError {
  constructor(message: string, details?: any) {
    super('VERSION_CONSISTENCY_ERROR', message, details);
  }
}

export class PayloadIntegrityError extends RegistryError {
  constructor(message: string, details?: any) {
    super('PAYLOAD_INTEGRITY_ERROR', message, details);
  }
}

export class PromotionRejectedError extends RegistryError {
  constructor(message: string, details?: any) {
    super('PROMOTION_REJECTED', message, details);
  }
}

export class WorkflowViolationError extends RegistryError {
  constructor(message: string, details?: any) {
    super('WORKFLOW_VIOLATION', message, details);
  }
}
