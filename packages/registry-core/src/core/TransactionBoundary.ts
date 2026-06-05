export interface TransactionBoundary {
  /**
   * Execute operations within a database transaction.
   * Implementation depends on the ORM (e.g., Prisma.$transaction).
   */
  execute<T>(operation: (tx: any) => Promise<T>): Promise<T>;
}
