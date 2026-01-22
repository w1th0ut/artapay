const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "ArtaPay",
    subtitle: "Seamless Cross-Border Payments",
    description: "Any Stablecoin. Anywhere. Gasless.",
    screenshotUrls: [
      `${ROOT_URL}/assets/Send_Feature_Scan.png`,
      `${ROOT_URL}/assets/Receive_Feature.png`,
      `${ROOT_URL}/assets/Swap_Feature.png`
    ],
    iconUrl: `${ROOT_URL}/logo.svg`,
    splashImageUrl: `${ROOT_URL}/assets/banner.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["payments", "stablecoin", "cross-border", "gasless", "defi"],
    heroImageUrl: `${ROOT_URL}/assets/banner.png`,
    tagline: "Any Stablecoin. Anywhere. Gasless.",
    ogTitle: "ArtaPay - Seamless Cross-Border Payments",
    ogDescription: "Any Stablecoin. Anywhere. Gasless.",
    ogImageUrl: `${ROOT_URL}/assets/banner.png`,
  },
} as const;

