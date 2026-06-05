export interface RevenueContext {
  traceId: string;
  context: 'homepage' | 'search' | 'entity' | 'recommendation' | 'newsletter' | 'api';
  workspaceId?: string;
}

export class RevenueContextResolver {
  public resolveContext(traceId: string, contextName: RevenueContext['context'], workspaceId?: string): RevenueContext {
    return {
      traceId,
      context: contextName,
      workspaceId
    };
  }
}
