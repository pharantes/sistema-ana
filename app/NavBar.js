"use client";

// ...existing code...

"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";

const Navbar = styled.nav`
  background: #222;
  padding: 1rem;
`;
const NavList = styled.ul`
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
`;
const NavItem = styled.li``;
const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
  &:hover {
    color: #00bcd4;
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
      </NavList>
    </Navbar>
  );
}
