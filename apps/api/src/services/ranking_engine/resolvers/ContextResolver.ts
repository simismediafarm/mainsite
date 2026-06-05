export interface RankingContext {
  workspaceId?: string;
  context: 'homepage' | 'search' | 'entity' | 'recommendation' | 'newsletter' | 'api';
  traceId: string;
}

export class ContextResolver {
  /**
   * Determines the ranking execution context deterministically.
   * Pure resolution layer. No database writes.
   */
  public resolveContext(
    traceId: string,
    contextName: 'homepage' | 'search' | 'entity' | 'recommendation' | 'newsletter' | 'api',
    workspaceId?: string
  ): RankingContext {
    return {
      traceId,
      context: contextName,
      workspaceId
    };
  }
}
