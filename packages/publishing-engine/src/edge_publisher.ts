export async function deployToEdge(rendered: any) {
  if (!process.env.VERCEL_DEPLOY_HOOK) {
    console.warn("[WARNING] VERCEL_DEPLOY_HOOK not set, skipping actual edge deploy.");
    return { status: "MOCKED_SUCCESS", url: "https://mock.simis.ai" };
  }

  const response = await fetch(process.env.VERCEL_DEPLOY_HOOK, {
    method: "POST",
    body: JSON.stringify(rendered)
  });

  if (!response.ok) {
    throw new Error("DEPLOY_FAILED");
  }

  return response.json();
}
