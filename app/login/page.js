"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import styled from 'styled-components';

const CenterWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
`;
const FormCard = styled.form`
  background: white;
  padding: var(--space-lg, var(--space-md, var(--space-md, 16px)));
  border-radius: var(--radius-md, var(--space-xs, var(--space-xs, 8px)));
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: var(--login-card-width, 300px);
`;
const ErrorBox = styled.div`
  background: #fee;
  color: #c33;
  padding: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  margin-bottom: var(--space-md, var(--space-md, var(--space-md, 16px)));
  text-align: center;
`;
const StyledInput = styled.input`
  width: 100%;
  padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  border: 1px solid #ddd;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: calc(var(--space-lg, 24px));
`;

const FieldRow = styled.div`
  margin-bottom: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;
const FieldRowLarge = styled(FieldRow)`
  margin-bottom: var(--space-lg, 24px);
`;
const LabelBold = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const SubmitButton = styled.button`
  width: 100%;
  height: var(--control-height, 36px);
  padding: 0 var(--space-md, var(--space-md, var(--space-md, 16px)));
  background: #0070f3;
  color: white;
  border: none;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  cursor: pointer;
  font-size: var(--font-size-base, 1rem);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciais inválidas");
      } else {
        // Check if session was created successfully
        const session = await getSession();
        if (session) {
          router.push("/");
          router.refresh();
        } else {
          setError("Erro ao criar sessão");
        }
      }
    } catch (error) {
      setError("Erro ao fazer login");
      try { process?.stderr?.write(`Login error: ${String(error)}\n`); } catch { /* noop */ }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenterWrap>
      <FormCard onSubmit={handleSubmit}>
        <Title>Login</Title>

        {error && (
          <ErrorBox>{error}</ErrorBox>
        )}

        <FieldRow>
          <LabelBold>Usuário:</LabelBold>
          <StyledInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FieldRow>

        <FieldRowLarge>
          <LabelBold>Senha:</LabelBold>
          <StyledInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FieldRowLarge>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </SubmitButton>
      </FormCard>
    </CenterWrap>
  );
}