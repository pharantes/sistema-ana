import styled from 'styled-components';

export const Button = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: #1976d2;
  color: #fff;
  font-size: 1rem;
`;

export const SecondaryButton = styled(Button)`
  background: #aaa;
  margin-left: 8px;
`;

export const InlineButton = styled.button`
  margin-left: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
`;

export const TopButton = styled(Button)`
  margin-bottom: 16px;
`;

export const Input = styled.input`
  padding: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

// named exports are already declared above
