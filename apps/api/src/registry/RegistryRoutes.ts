import { Hono } from "hono";
import { RegistryController } from "./RegistryController";

export const createRegistryRoutes = (controller: RegistryController) => {
  const router = new Hono();

  // Middleware pipeline (Authentication -> Tenant -> Env -> RBAC)
  // Scaffold implementation
  router.use('*', async (c, next) => {
    // 1. Auth resolution
    // 2. Tenant resolution
    // 3. Env resolution
    // 4. RBAC Check (inject context into request or just pass via body)
    // For now we assume the client sends the `context` object in the JSON body,
    // but in a real app this middleware would construct `RegistryContext` and attach it to `c.set('registryContext', ctx)`
    await next();
  });

  router.post("/", (c) => controller.createDraft(c));
  router.post("/:uid/review", (c) => controller.submitReview(c));
  router.post("/:uid/publish", (c) => controller.publish(c));
  router.post("/:uid/rollback", (c) => controller.rollback(c));
  router.post("/:uid/promote", (c) => controller.promote(c));

  return router;
};
