"use client";
import styled from "styled-components";
import * as FE from './FormElements';

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
        <FE.InlineButton onClick={onNewAction}>Nova Ação</FE.InlineButton>
        <button onClick={onSignOut}>Sair</button>
      </div>
    </Welcome>
  );
}
