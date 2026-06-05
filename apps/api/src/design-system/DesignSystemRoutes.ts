import { Hono } from "hono";
import { DesignSystemController } from "./DesignSystemController";

export const createDesignSystemRoutes = (controller: DesignSystemController) => {
  const router = new Hono();

  router.post("/", (c) => controller.createDraft(c));
  router.post("/:id/publish", (c) => controller.publish(c));
  router.post("/:id/rollback", (c) => controller.rollback(c));
  router.post("/:id/promote", (c) => controller.promote(c));
  router.get("/:id/artifact", (c) => controller.getArtifact(c));
  router.get("/:id/css", (c) => controller.getCss(c));
  router.get("/:id", (c) => controller.getObject(c));
  router.get("/", (c) => controller.listObjects(c));

  return router;
};
