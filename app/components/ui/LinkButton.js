"use client";
import styled from 'styled-components';

const Btn = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: var(--link-color, #2563eb);
  text-decoration: underline;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: var(--font-size-sm, 0.9rem);
`;

export default function LinkButton({ children, onClick, className, title, ...rest }) {
  return (
    <Btn onClick={onClick} className={className} title={title} {...rest}>
      {children}
    </Btn>
  );
}
