"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";

const Navbar = styled.nav`
  background: var(--color-primary, #6c2bb0);
  padding: var(--space-md, 16px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
const NavList = styled.ul`
  display: flex;
  gap: var(--space-lg, 24px);
  list-style: none;
  margin: 0;
  padding: 0;
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
  padding: var(--space-xs, 8px) var(--space-sm, 12px);
  border-radius: var(--radius-sm, 4px);
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: var(--color-primary-700, #5a2390);
    color: var(--color-surface, #fff);
  }
`;

export default function NavBar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return (
    <Navbar>
      <NavList>
        {role === "admin" && (
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
          <NavLink href="/servidores">Servidores</NavLink>
        </NavItem>
      </NavList>
    </Navbar>
  );
}
