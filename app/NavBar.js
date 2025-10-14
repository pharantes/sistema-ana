"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";

// Styled Components
const Navbar = styled.nav`
  background: var(--color-primary, #6c2bb0);
  padding: 0;
  box-shadow: 0 2px var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) rgba(0, 0, 0, 0.1);
`;

const NavInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: var(--space-xs, 8px) 16px;
`;

const NavList = styled.ul`
  display: flex;
  gap: var(--gap-md, var(--space-lg, 24px));
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
`;

const NavItem = styled.li`
  display: flex;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: var(--color-surface, #fff);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--font-size-sm, 0.875rem);
  padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px))) var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: var(--color-primary-700, #5a2390);
    color: var(--color-surface, #fff);
  }
`;

const RightArea = styled.div`
  display: flex;
  gap: var(--gap-sm, var(--space-sm, var(--space-sm, 12px)));
  align-items: center;
  margin-left: auto;
`;

const SignOutButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px))) var(--space-sm, 10px);
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  cursor: pointer;
  font-weight: 600;
  height: var(--control-height, 36px);
  display: inline-flex;
  align-items: center;
  &:hover { background: rgba(255,255,255,0.06); }
`;

function handleSignOut() {
  signOut({ callbackUrl: "/login" });
}

/**
 * Navigation bar component that displays application navigation links and sign-out button.
 * Admin users see additional menu items.
 */
export default function NavBar() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "admin";

  return (
    <Navbar>
      <NavInner>
        <NavList>
          <NavItem>
            <NavLink href="/">Dashboard</NavLink>
          </NavItem>
          {isAdmin && (
            <NavItem>
              <NavLink href="/contasareceber">Contas a receber</NavLink>
            </NavItem>
          )}
          <NavItem>
            <NavLink href="/contasapagar">Contas a pagar</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/acoes">Ações</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/clientes">Clientes</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/colaboradores">Colaboradores</NavLink>
          </NavItem>
        </NavList>

        <RightArea>
          <NavItem>
            <NavLink href="/documentation">📚 Documentação</NavLink>
          </NavItem>
          {session && (
            <SignOutButton onClick={handleSignOut}>
              Sair
            </SignOutButton>
          )}
        </RightArea>
      </NavInner>
    </Navbar>
  );
}