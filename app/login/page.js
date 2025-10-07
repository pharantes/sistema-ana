"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = form.get("username");
    const password = form.get("password");

    // Use NextAuth redirect so cookies/session are set before middleware runs
    const result = await signIn("credentials", {
      redirect: true,
      callbackUrl: "/",
      username,
      password,
    });

    // If redirect is blocked or result returns error
    if (result?.error) {
      alert(result.error || "Erro ao fazer login");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
