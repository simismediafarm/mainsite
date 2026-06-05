import { Post, Role } from '@simis/shared';
import { db } from '../store/sqlite_db';

export class EditorialEngine {
  /**
   * RBAC verification
   */
  public static canExecute(role: Role | undefined, action: 'approve' | 'reject' | 'feature' | 'submit' | 'auto_publish'): boolean {
    const permissions: Record<string, Role[]> = {
      'approve': ['admin', 'editor'],
      'reject': ['admin', 'editor'],
      'feature': ['admin', 'editor'],
      'submit': ['admin', 'editor', 'author', 'contributor'],
      'auto_publish': ['admin', 'system_ingestor']
    };

    return !!role && permissions[action].includes(role);
  }

  public static async submitForReview(postId: string, userId: string): Promise<{ success: boolean; message?: string; post?: any }> {
    const user = await db.getProfile(userId);
    if (!user) return { success: false, message: 'unauthorized_or_user_not_found' };
    if (!this.canExecute(user?.role as Role, 'submit')) {
      return { success: false, message: 'Unauthorized to submit' };
    }

    const post = await db.getPost(postId);
    if (!post) return { success: false, message: 'Post not found' };

    const updated = await db.transitionPostState(postId, 'pending_review');
    return updated ? { success: true, post: updated } : { success: false, message: 'Invalid state transition' };
  }

  public static async approvePost(postId: string, userId: string): Promise<{ success: boolean; message?: string; post?: any }> {
    const user = await db.getProfile(userId);
    if (!this.canExecute(user?.role as Role, 'approve')) {
      return { success: false, message: 'Unauthorized to approve' };
    }

    const updated = await db.transitionPostState(postId, 'approved');
    if (!updated) return { success: false, message: 'Invalid state transition' };

    // Auto publish if approved in our simple flow
    const published = await db.transitionPostState(postId, 'published');
    
    // Broadcast editorial state changed (custom SSE event for V1.1)
    if (published) {
      this.emitEditorialEvent(published, 'approved_and_published');
    }

    return published ? { success: true, post: published } : { success: false, message: 'Failed to publish' };
  }

  public static async rejectPost(postId: string, userId: string): Promise<{ success: boolean; message?: string; post?: any }> {
    const user = await db.getProfile(userId);
    if (!this.canExecute(user?.role as Role, 'reject')) {
      return { success: false, message: 'Unauthorized to reject' };
    }

    const updated = await db.transitionPostState(postId, 'draft');
    if (updated) {
      this.emitEditorialEvent(updated, 'rejected');
    }

    return updated ? { success: true, post: updated } : { success: false, message: 'Invalid state transition' };
  }

  public static async featurePost(postId: string, userId: string): Promise<{ success: boolean; message?: string; post?: any }> {
    const user = await db.getProfile(userId);
    if (!this.canExecute(user?.role as Role, 'feature')) {
      return { success: false, message: 'Unauthorized to feature' };
    }

    const updated = await db.transitionPostState(postId, 'featured');
    if (updated) {
      this.emitEditorialEvent(updated, 'featured');
    }

    return updated ? { success: true, post: updated } : { success: false, message: 'Invalid state transition' };
  }

  private static emitEditorialEvent(post: any, action: string) {
    db.emitEvent({
      type: 'editorial_state_changed',
      payload: { id: post.id, action }
    });
    console.log(`[EditorialEngine] Post ${post.id} was ${action}.`);
  }
}
