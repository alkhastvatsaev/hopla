import "server-only";

export type VerifiedFirebaseUser = {
  uid: string;
  email?: string;
};

export async function verifyFirebaseRequest(
  request: Request,
): Promise<VerifiedFirebaseUser | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    },
  );
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = payload.users?.[0];
  return user?.localId ? { uid: user.localId, email: user.email } : null;
}
