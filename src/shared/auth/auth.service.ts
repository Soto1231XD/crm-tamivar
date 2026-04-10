import { apiRequest } from "../apiRequest";
import type {
  BackendLoginSuccess,
  BackendLoginChallenge,
  LoginApiResult,
  LoginCredentials,
  AppUser
} from "./interfaces/auth.interface";

export async function loginApi(
  credentials: LoginCredentials,
): Promise<LoginApiResult> {
  const data = await apiRequest<BackendLoginSuccess | BackendLoginChallenge>(
    "/auth/login",
    {
      method: "POST",
      data: credentials,
    },
  );

  if ("requires_2fa" in data) {
    return {
      status: "requires_2fa",
      challengeId: data.challenge_id,
      message: data.message,
    };
  }

  return {
    status: "authenticated",
    accessToken: data.access_token,
    user: data.user,
  };
}

export async function verifyTwoFaApi(
  challengeId: string,
  codigo: string,
): Promise<{ accessToken: string; user: AppUser }> {
  const data = await apiRequest<BackendLoginSuccess>("/auth/verify-2fa", {
    method: "POST",
    data: {
      challenge_id: challengeId.trim(),
      codigo: codigo.trim(),
    },
  });

  return {
    accessToken: data.access_token,
    user: data.user,
  };
}