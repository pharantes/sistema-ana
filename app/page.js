"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardClient from "./dashboard/DashboardClient";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Bem-vindo ao Sistema</h1>
      <p>Você está logado como: {session.user?.username || session.user?.name}</p>
      <DashboardClient />
      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={() => router.push("/acoes")}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "1rem",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Ir para Ações
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "0.5rem 1rem",
            background: "#f56565",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}