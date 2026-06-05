export class CompilerError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'CompilerError';
  }
}

export class SemanticDepthViolationError extends CompilerError {
  constructor(message: string, details?: any) {
    super('SEMANTIC_DEPTH_VIOLATION', message, details);
  }
}

export class MissingPrimitiveTokenError extends CompilerError {
  constructor(message: string, details?: any) {
    super('MISSING_PRIMITIVE_TOKEN', message, details);
  }
}

export class InvalidFingerprintError extends CompilerError {
  constructor(message: string, details?: any) {
    super('INVALID_FINGERPRINT', message, details);
  }
}
