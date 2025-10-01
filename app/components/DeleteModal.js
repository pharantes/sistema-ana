"use client";
import styled from "styled-components";
import Modal from './Modal';
import * as FL from './FormLayout';
import * as FE from './FormElements';

export default function DeleteModal({ action, confirmName, setConfirmName, onCancel, onConfirm, loading, label }) {
  if (!action) return null;
  let entity = "Ação";
  let confirmField = "nome";
  let confirmLabel = label || "Digite o nome da ação para confirmar a exclusão:";
  let placeholder = "Nome da ação";
  let value = action.name;
  if (action.codigo && action.nome) {
    entity = action.entityType || "Cliente";
    confirmField = "codigo";
    confirmLabel = label || `Digite o código do ${entity.toLowerCase()} para confirmar a exclusão:`;
    placeholder = `Código do ${entity.toLowerCase()}`;
    value = action.codigo;
  }

  return (
    <Modal onClose={onCancel} ariaLabel={`Confirmar exclusão de ${entity}`}>
      <h3>Excluir {entity}</h3>
      <p>{confirmLabel}</p>
      <FL.Note italic>{value}</FL.Note>
      <form onSubmit={onConfirm}>
        <input
          placeholder={placeholder}
          value={confirmName}
          onChange={e => setConfirmName(e.target.value)}
          autoFocus
        />
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onCancel}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit" disabled={loading}>Excluir</FE.Button>
        </FL.Actions>
      </form>
    </Modal>
  );
}
