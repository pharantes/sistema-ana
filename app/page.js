"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardClient from "./dashboard/DashboardClient";
import styled from 'styled-components';

// Styled Components
const CenterFull = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const PagePad = styled.div`
  padding: var(--page-padding);
`;

const ButtonPrimary = styled.button`
  height: var(--control-height, 36px);
  padding: 0 var(--space-md, var(--space-md, var(--space-md, 16px)));
  margin-right: var(--space-md, var(--space-md, var(--space-md, 16px)));
  background: #0070f3;
  color: white;
  border: none;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  cursor: pointer;
`;

const ButtonDanger = styled.button`
  height: var(--control-height, 36px);
  padding: 0 var(--space-md, var(--space-md, var(--space-md, 16px)));
  background: #f56565;
  color: white;
  border: none;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  cursor: pointer;
`;

const ButtonRow = styled.div`
  margin-top: var(--space-lg, 24px);
`;

function handleNavigateToActions(router) {
  router.push("/acoes");
}

function handleSignOut() {
  signOut({ callbackUrl: "/login" });
}

/**
 * Home page component that displays the dashboard and navigation buttons.
 * Redirects unauthenticated users to the login page.
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  const isAuthenticated = Boolean(session);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <CenterFull>
        <div>Carregando...</div>
      </CenterFull>
    );
  }

  return (
    <PagePad>
      <DashboardClient />
      <ButtonRow>
        <ButtonPrimary onClick={() => handleNavigateToActions(router)}>Ir para Ações</ButtonPrimary>
        <ButtonDanger onClick={handleSignOut}>Sair</ButtonDanger>
      </ButtonRow>
    </PagePad>
  );
}