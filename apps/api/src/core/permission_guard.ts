import { Context } from 'hono';

export type ActionType = 
  | 'SCRAPE_MANUAL' 
  | 'FEED_IMPORT' 
  | 'CONTENT_UPDATE' 
  | 'AD_SLOT_UPDATE' 
  | 'SYSTEM_CONFIG'
  | 'VIEW_DASHBOARD';

export type Role = 'ADMIN' | 'SYSTEM' | 'VIEWER' | 'EDITOR';

const ACTION_POLICY_MATRIX: Record<ActionType, Role[]> = {
  SCRAPE_MANUAL: ['ADMIN', 'SYSTEM'],
  FEED_IMPORT: ['ADMIN', 'EDITOR', 'SYSTEM'],
  CONTENT_UPDATE: ['ADMIN', 'EDITOR'],
  AD_SLOT_UPDATE: ['ADMIN'],
  SYSTEM_CONFIG: ['ADMIN', 'SYSTEM'],
  VIEW_DASHBOARD: ['ADMIN', 'EDITOR', 'VIEWER']
};

export class PermissionGuard {
  static async verify(c: Context, action: ActionType): Promise<boolean> {
    const opsKey = c.req.header('X-SIMIS-OPS-KEY');
    if (opsKey && process.env.SIMIS_OPS_KEY && opsKey === process.env.SIMIS_OPS_KEY) {
      // CLI or Bot with valid ops key is considered SYSTEM
      return true;
    }

    const user = c.get('user');
    let role: Role = 'VIEWER';

    if (user && user.user_metadata) {
      if (user.user_metadata.role === 'admin') role = 'ADMIN';
      else if (user.user_metadata.role === 'editor') role = 'EDITOR';
      else if (user.user_metadata.role === 'system') role = 'SYSTEM';
    }

    const allowedRoles = ACTION_POLICY_MATRIX[action];
    
    if (!allowedRoles.includes(role)) {
      throw new Error(`Permission denied for action ${action}. Required roles: ${allowedRoles.join(', ')}`);
    }

    return true;
  }
}
