import { Router } from "express";
import { TraceResolverService } from "../../services/admin/trace-resolver.service";

export const adminTraceRouter = Router();

const traceResolver = new TraceResolverService();

// GET /admin/trace/:traceId
adminTraceRouter.get("/:traceId", async (req, res) => {
  const { traceId } = req.params;
  
  // READ-ONLY: Fetch full causality chain graph across OS layers
  const traceGraph = await traceResolver.resolveTrace(traceId);
  
  if (!traceGraph) {
    return res.status(404).json({ error: "Trace not found" });
  }
  
  res.json(traceGraph);
});
