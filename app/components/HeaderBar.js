"use client";
import styled from "styled-components";

const Main = styled.main`
  padding: 24px;
`;
const Welcome = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export default function HeaderBar({ username, role, onNewAction, onSignOut }) {
  return (
    <Welcome>
      <div>
        <b>Bem-vindo, {username} ({role})</b>
      </div>
      <div>
        <button onClick={onNewAction} style={{ marginRight: 8 }}>Nova Ação</button>
        <button onClick={onSignOut}>Sair</button>
      </div>
    </Welcome>
  );
}
