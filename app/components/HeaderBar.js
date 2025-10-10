"use client";
import styled from "styled-components";

const Welcome = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export default function HeaderBar({ username, role }) {
  return (
    <Welcome>
      <div>
        <b>Bem-vindo, {username} ({role})</b>
      </div>
      <div />
    </Welcome>
  );
}
