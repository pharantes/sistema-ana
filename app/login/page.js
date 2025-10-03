"use client";
import { useRouter } from "next/navigation";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      username: form.get("username"),
      password: form.get("password"),
    };

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // successful login — redirect to home
      router.push("/");
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Erro ao fazer login");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
