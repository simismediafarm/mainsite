"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueDispatcherService = exports.authzQueue = exports.commandQueue = void 0;
const bullmq_1 = require("bullmq");
const shared_1 = require("@simis/shared");
exports.commandQueue = new bullmq_1.Queue(shared_1.SIMIS_QUEUE_NAMES.COMMAND, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD
    }
});
// Create Authz Queue for RBAC evaluation
exports.authzQueue = new bullmq_1.Queue('simis-authz-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD
    }
});
class QueueDispatcherService {
    /**
     * Dispatch a validated SIMISCommand to the BullMQ processing pipeline.
     */
    static async dispatch(command) {
        const jobName = `simis-command-${command.type}`;
        // Add command to BullMQ with priority mapping
        const job = await exports.commandQueue.add(jobName, command, {
            jobId: command.id, // Enforce uniqueness and correlation
            priority: this.mapPriority(command.priority),
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
        return job.id;
    }
    /**
     * Dispatch a validated SIMISCommand to the Authz processing pipeline.
     */
    static async dispatchToAuthz(command) {
        const jobName = `simis-authz-${command.type}`;
        // Add command to BullMQ with priority mapping
        const job = await exports.authzQueue.add(jobName, command, {
            jobId: command.id, // Enforce uniqueness and correlation
            priority: this.mapPriority(command.priority),
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
        return job.id;
    }
    static mapPriority(priority) {
        switch (priority) {
            case 'critical': return 1;
            case 'standard': return 2;
            case 'low': return 3;
            default: return 2;
        }
    }
}
exports.QueueDispatcherService = QueueDispatcherService;
