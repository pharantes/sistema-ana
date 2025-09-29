"use client";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
  margin: 0 auto;
`;

export default function LoginForm({ onSubmit }) {
  return (
    <Form onSubmit={onSubmit}>
      <h2>Entrar</h2>
      <input name="username" placeholder="Usuário" required />
      <input name="password" type="password" placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </Form>
  );
}
