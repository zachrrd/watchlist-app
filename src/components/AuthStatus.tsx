import { neon } from "../lib/neon";

export default function AuthStatus() {
  const { data: session, isPending, error } = neon.auth.useSession();

  if (isPending) {
    return <p>Memeriksa sesi login...</p>;
  }

  if (error) {
    return <p>Auth error: {error.message}</p>;
  }

  if (!session) {
    return <p>Belum ada user yang login.</p>;
  }

  return (
    <div>
      <p>Login sebagai: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}