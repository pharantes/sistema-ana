"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AcoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [acoes, setAcoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchAcoes();
  }, [session, status, router]);

  const fetchAcoes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/action");

      if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch actions");
      }

      const data = await response.json();
      setAcoes(data);
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Ações</h1>
      <p>Bem-vindo, {session.user?.username || session.user?.name}</p>

      <div style={{ marginTop: "2rem" }}>
        <h2>Lista de Ações</h2>
        {acoes.length === 0 ? (
          <p>Nenhuma ação encontrada.</p>
        ) : (
          <ul>
            {acoes.map((acao) => (
              <li key={acao._id} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ddd" }}>
                <strong>{acao.name}</strong>
                <p>{acao.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}