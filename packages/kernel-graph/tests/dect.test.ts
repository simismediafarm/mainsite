import { DECTMiddleware, DECTViolation } from '../src/v7.3/verification/invariant_engine';
import { createExecutionContext } from '../src/v7.2.1/ecvm/sandbox';

describe('DECT Middleware', () => {
  it('throws CTX_NULL if execution context is missing', () => {
    expect(() => {
      DECTMiddleware.assertDeterministicExecution({ intent_id: 'test' }, null as any, { hash: 'abc' });
    }).toThrow(DECTViolation);
    
    try {
      DECTMiddleware.assertDeterministicExecution({ intent_id: 'test' }, null as any, { hash: 'abc' });
    } catch (e: any) {
      expect(e.code).toBe('CTX_NULL');
    }
  });

  it('throws ECVM_DIRTY if context was mutated', () => {
    const ctx = createExecutionContext('test-123');
    ctx.__dirty__ = true;
    expect(() => {
      DECTMiddleware.assertDeterministicExecution({ intent_id: 'test' }, ctx, { hash: 'abc' });
    }).toThrow(DECTViolation);
  });
});
