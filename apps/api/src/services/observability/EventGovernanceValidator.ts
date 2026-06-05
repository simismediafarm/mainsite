export class EventGovernanceValidator {
  /**
   * Validates that all events strictly adhere to the Event Sourcing OS contract.
   * Rejects missing fields to maintain data integrity and lineage reconstructability.
   */
  public validate(event: any): void {
    const requiredFields = [
      'traceId', 'correlationId', 'causationId', 'aggregateId',
      'aggregateType', 'version', 'engineId', 'eventType'
    ];

    const missing = requiredFields.filter(field => !event[field]);

    if (missing.length > 0) {
      throw new Error(`Event Governance Violation: Missing required fields: ${missing.join(', ')}`);
    }

    if (typeof event.version !== 'number' || event.version < 1) {
      throw new Error(`Event Governance Violation: Invalid version ${event.version}`);
    }
  }
}
