export interface PublishRequest {
  tenantId: string;
  artifactName: string;
  requestedVersion: string;
  pipelineId: string;
  timestamp: Date;
  artifactHash: string;
}

export interface ExistingArtifactVersion {
  version: string;
  pipelineId: string;
  timestamp: Date;
  artifactHash: string;
}

export class MarketplaceArbitrator {
  /**
   * Resolves version conflicts deterministically under strict governance constraints.
   * Returns the final resolved version string to be published.
   */
  public arbitrate(request: PublishRequest, existingVersions: ExistingArtifactVersion[]): string {
    // Constraint 2: Case B - Same pipeline retry is idempotent
    const exactMatch = existingVersions.find(v => 
      v.pipelineId === request.pipelineId && 
      v.artifactHash === request.artifactHash
    );
    if (exactMatch) {
      return exactMatch.version; // Return the exact version already assigned
    }

    // Normalize requested version (strip suffixes for base collision detection)
    const baseRequested = request.requestedVersion.split('-')[0];

    // Find versions that share the same semantic base (Case A)
    const collisions = existingVersions.filter(v => v.version.startsWith(baseRequested));

    if (collisions.length > 0) {
      // We have a collision. Resolve deterministically.
      const allCompeting = [
        ...collisions,
        {
          version: request.requestedVersion,
          pipelineId: request.pipelineId,
          timestamp: request.timestamp,
          artifactHash: request.artifactHash
        }
      ];

      // Sort deterministically: older timestamp first. If tie, sort by pipelineId.
      allCompeting.sort((a, b) => {
        const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.pipelineId.localeCompare(b.pipelineId);
      });

      // Find the rank of the incoming request
      const rankIndex = allCompeting.findIndex(c => 
        c.pipelineId === request.pipelineId && 
        c.artifactHash === request.artifactHash
      );

      // Assign suffix: index 0 -> 'a', index 1 -> 'b', etc.
      const suffix = String.fromCharCode(97 + rankIndex);
      return `${baseRequested}-${suffix}`;
    }

    // Constraint 2: Case C - Higher semver intent simply wins (no collision)
    // If it didn't collide with a same base version, we grant the requested version directly.
    return request.requestedVersion;
  }
}
