"use client";
import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-lg);
  text-align: center;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: var(--space-md);
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: var(--space-lg);
  max-width: 600px;
`;

const ErrorDetails = styled.details`
  margin-top: var(--space-md);
  padding: var(--space-sm);
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  text-align: left;
  max-width: 600px;
  width: 100%;
  
  summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    user-select: none;
    
    &:hover {
      color: #111827;
    }
  }
  
  pre {
    margin-top: var(--space-sm);
    padding: var(--space-sm);
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-size: 0.875rem;
    color: #dc2626;
  }
`;

const RetryButton = styled.button`
  padding: var(--space-sm) var(--space-lg);
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:active {
    background: #1d4ed8;
  }
`;

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // You can also log to an error reporting service here
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <ErrorContainer>
          <ErrorTitle>Algo deu errado</ErrorTitle>
          <ErrorMessage>
            Desculpe, ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
          </ErrorMessage>

          <RetryButton onClick={this.handleReset}>
            Tentar Novamente
          </RetryButton>

          {isDevelopment && this.state.error && (
            <ErrorDetails>
              <summary>Detalhes do Erro (apenas em desenvolvimento)</summary>
              <pre>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
