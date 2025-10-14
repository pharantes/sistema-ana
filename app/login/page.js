"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
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

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(StyledInput)`
  padding-right: 40px; /* Make room for the eye icon */
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
  outline: none;
  
  &:hover {
    color: #0070f3;
  }
  
  &:active {
    color: #0051cc;
  }
  
  &:focus-visible {
    outline: 2px solid #0070f3;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  svg {
    width: 20px;
    height: 20px;
    pointer-events: none;
  }
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

/**
 * Logs error to stderr if available
 * @param {Error} error - Error to log
 */
function logLoginError(error) {
  try {
    process?.stderr?.write(`Login error: ${String(error)}\n`);
  } catch {
    // Ignore logging errors
  }
}

/**
 * Login page component with credentials authentication
 */
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/");
    }
  }, [status, session, router]);

  // Show loading while checking authentication status or redirecting
  if (status === "loading" || status === "authenticated") {
    return (
      <CenterWrap>
        <FormCard as="div">
          <Title>
            {status === "authenticated" ? "Redirecionando..." : "Carregando..."}
          </Title>
        </FormCard>
      </CenterWrap>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const signInResult = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setErrorMessage("Credenciais inválidas");
        setIsLoading(false);
        return;
      }

      // Successfully signed in - redirect to dashboard
      // Don't set isLoading to false, keep showing loading during redirect
      router.replace("/");
      router.refresh();
    } catch (error) {
      setErrorMessage("Erro ao fazer login");
      logLoginError(error);
      setIsLoading(false);
    }
  };

  return (
    <CenterWrap>
      <FormCard onSubmit={handleSubmit}>
        <Title>Login</Title>

        {errorMessage && (
          <ErrorBox>{errorMessage}</ErrorBox>
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
          <PasswordInputWrapper>
            <PasswordInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TogglePasswordButton
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={0}
            >
              {showPassword ? (
                // Eye slash icon (hide password)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                // Eye icon (show password)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </TogglePasswordButton>
          </PasswordInputWrapper>
        </FieldRowLarge>

        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </SubmitButton>
      </FormCard>
    </CenterWrap>
  );
}