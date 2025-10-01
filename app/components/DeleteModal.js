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

export default function DeleteModal({ action, confirmName, setConfirmName, onCancel, onConfirm, loading, label }) {
  if (!action) return null;
  // Determine entity type and label
  let entity = "Ação";
  let confirmField = "nome";
  let confirmLabel = label || "Digite o nome da ação para confirmar a exclusão:";
  let placeholder = "Nome da ação";
  let value = action.name;
  if (action.codigo && action.nome) {
    // Cliente or Servidor
    entity = action.entityType || "Cliente";
    confirmField = "codigo";
    confirmLabel = label || `Digite o código do ${entity.toLowerCase()} para confirmar a exclusão:`;
    placeholder = `Código do ${entity.toLowerCase()}`;
    value = action.codigo;
  }
  return (
    <ModalOverlay>
      <ModalContent>
        <h3>Excluir {entity}</h3>
        <p>{confirmLabel}</p>
        <p style={{ fontStyle: "italic", marginBottom: 8 }}>{value}</p>
        <form onSubmit={onConfirm}>
          <input
            placeholder={placeholder}
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
