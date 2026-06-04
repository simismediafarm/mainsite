export interface RiskScore {
  score: number; // 0-100, where 100 is highest risk
  flags: string[];
  isApproved: boolean;
}

export class RiskEngine {
  private static readonly MAX_SAFE_SCORE = 75;
  
  // Banned keywords for safety/compliance (e.g. AdSense policies)
  private static readonly BANNED_KEYWORDS = [
    'illegal', 'hack', 'crack', 'malware', 'phishing', 
    'hate', 'violence', 'scam'
  ];

  static async evaluateContent(content: string, title: string): Promise<RiskScore> {
    let score = 0;
    const flags: string[] = [];
    const textToScan = `${title} ${content}`.toLowerCase();

    // 1. Keyword Scanning
    for (const kw of this.BANNED_KEYWORDS) {
      if (textToScan.includes(kw)) {
        score += 30;
        flags.push(`banned_keyword:${kw}`);
      }
    }

    // 2. Length heuristics (e.g. too short could be thin content)
    if (content.length < 300) {
      score += 20;
      flags.push('thin_content');
    }

    // 3. Excessive linking (spam heuristic)
    const linkCount = (content.match(/<a /g) || []).length;
    if (linkCount > 10) {
      score += (linkCount - 10) * 2;
      flags.push('high_link_density');
    }

    const isApproved = score <= this.MAX_SAFE_SCORE;

    return {
      score,
      flags,
      isApproved
    };
  }

  static async evaluateAdPlacement(slotId: string, provider: string): Promise<boolean> {
    // Determine if ad placement violates spacing rules or policy limits
    // e.g. no more than 3 ads from a specific provider per page
    
    // Placeholder logic for ad validation
    if (provider === 'custom' && !slotId) {
      return false; // custom ads must have specific slots
    }
    
    return true;
  }
}
