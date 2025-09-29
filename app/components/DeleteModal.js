"use client";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalContent = styled.div`
  background: white;
  color: black;
  padding: 16px;
  min-width: 400px;
`;

export default function DeleteModal({ action, confirmName, setConfirmName, onCancel, onConfirm, loading }) {
  if (!action) return null;
  return (
    <ModalOverlay>
      <ModalContent>
        <h3>Excluir Ação</h3>
        <p>Digite o nome da ação para confirmar a exclusão:</p>
        <p style={{ fontStyle: "italic", marginBottom: 8 }}>{action.name}</p>
        <form onSubmit={onConfirm}>
          <input
            placeholder="Nome da ação"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            autoFocus
          />
          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onCancel}>Cancelar</button>
            <button type="submit" disabled={loading}>Excluir</button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
