const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Endpoints reachable without a session — a 401 from these means "wrong
// credentials", not "your session is invalid", so they must never trigger
// the redirect below.
const PUBLIC_PATHS = ["/auth/login", "/auth/forgot-password", "/auth/verify-otp"];

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dims.auth");
    if (!raw) return {};
    const { token } = JSON.parse(raw) as { token?: string };
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeader(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      null,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // non-JSON error body; keep the status-based message
    }
    // A protected-route 401 means the stored token is missing/expired — the
    // only honest response is to actually send them to sign in, not surface
    // this inline as if it were a normal data-loading error.
    if (
      response.status === 401 &&
      !PUBLIC_PATHS.includes(path) &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("dims.auth");
      window.location.href = "/login";
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
