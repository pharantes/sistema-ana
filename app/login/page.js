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

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (!result || result.error) {
      alert(result?.error || "Erro ao fazer login");
      return;
    }

    router.push("/");
  }

  return (
    <div style={{ padding: 24 }}>
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
