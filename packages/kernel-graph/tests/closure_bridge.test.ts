import { getClosureBridge } from '../src/v7.3/verification/closure_bridge';

describe('Closure Bridge', () => {
  it('instantiates correctly and provides lean-compatible artifacts', () => {
    const bridge = getClosureBridge();
    expect(bridge).toBeDefined();
    expect(bridge.generatePoE).toBeDefined();
  });
});
