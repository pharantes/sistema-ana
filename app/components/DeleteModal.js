"use client";
import Modal from './Modal';
import * as FL from './FormLayout';
import * as FE from './FormElements';

/**
 * Determines entity type and confirmation details based on action properties
 */
function getEntityDetails(action, customLabel) {
  if (action.codigo && action.nome) {
    const entityType = action.entityType || "Cliente";
    return {
      entityType,
      confirmLabel: customLabel || `Digite o código do ${entityType.toLowerCase()} para confirmar a exclusão:`,
      placeholder: `Código do ${entityType.toLowerCase()}`,
      confirmValue: action.codigo,
    };
  }

  return {
    entityType: "Ação",
    confirmLabel: customLabel || "Digite o nome da ação para confirmar a exclusão:",
    placeholder: "Nome da ação",
    confirmValue: action.name,
  };
}

/**
 * DeleteModal - Confirmation modal for entity deletion with typed confirmation
 */
export default function DeleteModal({ action, confirmName, setConfirmName, onCancel, onConfirm, loading, label, hideInput = false }) {
  if (!action) return null;

  const { entityType, confirmLabel, placeholder, confirmValue } = getEntityDetails(action, label);

  return (
    <Modal onClose={onCancel} ariaLabel={`Confirmar exclusão de ${entityType}`}>
      <h3>Excluir {entityType}</h3>
      <p>{confirmLabel}</p>
      {!hideInput && <FL.Note italic>{confirmValue}</FL.Note>}
      <form onSubmit={onConfirm}>
        {!hideInput && (
          <input
            placeholder={placeholder}
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            autoFocus
          />
        )}
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onCancel}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit" disabled={loading}>Excluir</FE.Button>
        </FL.Actions>
      </form>
    </Modal>
  );
}
