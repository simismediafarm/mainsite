export function checkInvariants(trace: any) {

  const hasValidTransitions =
    trace.transitions.every((t: any) =>
      ["pending","executing","deferred","resolved"].includes(t.to)
    );

  const noExternalMutation =
    !trace.ioEvents.some((e: any) =>
      e.source === "unverified_external_write"
    );

  return hasValidTransitions && noExternalMutation;
}
