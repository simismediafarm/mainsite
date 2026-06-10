import { Hono } from 'hono';
import { adminCommandRouter } from './command';
import { adminMetricsRouter } from './metrics';
import { adminTraceRouter } from './trace';
import { adminDlqRouter } from './dlq';
import { adminPostsRouter } from './posts';
import { adminRssRouter } from './rss';
import { adminUsersRouter } from './users';

export const adminRouter = new Hono();

adminRouter.route('/command', adminCommandRouter);
adminRouter.route('/metrics', adminMetricsRouter);
adminRouter.route('/trace', adminTraceRouter);
adminRouter.route('/dlq', adminDlqRouter);
adminRouter.route('/posts', adminPostsRouter);
adminRouter.route('/rss', adminRssRouter);
adminRouter.route('/users', adminUsersRouter);
