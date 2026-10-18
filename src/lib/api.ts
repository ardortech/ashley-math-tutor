import { getPin, clearPin } from "./storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const pin = getPin();
  const headers = new Headers(options.headers);
  if (pin) {
    headers.set("x-app-pin", pin);
  }

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    clearPin();
    window.location.href = "/pin";
    throw new ApiError(401, "PIN 驗證失敗");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res;
}
