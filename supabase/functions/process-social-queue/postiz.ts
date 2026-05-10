type PostizRequest = {
  caption: string;
  imageUrl: string;
  scheduledFor: string;
  integrationIds: string[];
  baseUrl: string;
  apiKey: string;
};

export type PostizResult = {
  status: "scheduled" | "published";
  payload: unknown;
};

async function tryPost(endpoint: string, body: unknown, apiKey: string): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
}

export async function createPostizPost(request: PostizRequest): Promise<PostizResult> {
  const baseUrl = String(request.baseUrl || "").trim().replace(/\/+$/, "");
  const apiKey = String(request.apiKey || "").trim();
  if (!baseUrl || !apiKey) {
    throw new Error("Postiz API is not configured. Set POSTIZ_BASE_URL and POSTIZ_API_KEY.");
  }

  const body = {
    content: request.caption,
    scheduled_at: request.scheduledFor,
    integrations: request.integrationIds,
    media: request.imageUrl ? [request.imageUrl] : [],
    settings: { post_type: "post" }
  };

  const endpoints = [`${baseUrl}/api/posts`, `${baseUrl}/posts`];
  let lastError = "Unknown Postiz error";

  for (const endpoint of endpoints) {
    const response = await tryPost(endpoint, body, apiKey);
    const rawText = await response.text();
    let parsed: unknown = rawText;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      // Keep raw text if JSON parsing fails.
    }

    if (response.ok) {
      return {
        status: "scheduled",
        payload: parsed
      };
    }

    lastError = `Postiz ${response.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`;
  }

  throw new Error(lastError);
}
