import { Context } from 'hono';
import { PermissionGuard, ActionType } from './permission_guard';
import { eventBus } from './event_bus';

export interface OrchestrationRequest {
  action: ActionType;
  actorId: string;
  payload: any;
  resourceId?: string;
  resourceType: string;
}

export class ControlOrchestrator {
  
  /**
   * The single entry point for all control plane mutations.
   * This enforces permissions, executes the requested handler, and emits audit events.
   */
  static async executeAction(
    c: Context, 
    request: OrchestrationRequest, 
    handler: () => Promise<any>
  ): Promise<any> {
    
    console.log(`[Orchestrator] Intercepted action: ${request.action} by ${request.actorId}`);

    let status = 'failed';

    try {
      // 1. Permission Boundary Enforcement
      const isAllowed = await PermissionGuard.verify(c, request.action);
      
      if (!isAllowed) {
        status = 'denied';
        throw new Error('Access Denied');
      }

      // 2. Handler Execution
      console.log(`[Orchestrator] Permission granted. Executing handler for ${request.action}...`);
      const result = await handler();
      
      status = 'success';
      
      // 3. Emit specific domain events based on action type
      if (request.action === 'CONTENT_UPDATE') {
        eventBus.emitEvent('CONTENT_UPDATED', { resourceId: request.resourceId });
      }

      return result;

    } catch (error: any) {
      console.error(`[Orchestrator] Action failed: ${error.message}`);
      
      eventBus.emitEvent('SYSTEM_ERROR', {
        action: request.action,
        error: error.message
      });
      
      throw error;

    } finally {
      // 4. Audit Logging (Guaranteed to execute regardless of success/failure)
      await this.logAudit({
        actorId: request.actorId,
        action: request.action,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        payload: request.payload,
        status: status
      });
    }
  }

  private static async logAudit(auditRecord: any) {
    console.log(`[AuditLog] Writing to DB:`, JSON.stringify(auditRecord));
    
    // In a real application, insert this record into the control_audits table
    // e.g. await db.insert(controlAuditsTable).values(auditRecord);
  }
}
