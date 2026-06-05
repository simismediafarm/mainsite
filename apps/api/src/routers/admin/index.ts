import { Hono } from 'hono';
import { adminCommandRouter } from './command';
import { adminMetricsRouter } from './metrics';
import { adminTraceRouter } from './trace';

export const adminRouter = new Hono();

adminRouter.route('/command', adminCommandRouter);
adminRouter.route('/metrics', adminMetricsRouter);
adminRouter.route('/trace', adminTraceRouter);
