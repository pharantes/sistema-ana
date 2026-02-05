import { useState, useEffect } from "react";
import styled from "styled-components";
import { GridTwoGap as GridTwo } from './ui/primitives';
import Modal from './Modal';
import ErrorModal from './ErrorModal';
import * as FE from './FormElements';
import * as FL from './FormLayout';

const Title = styled.h2`
  margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;

/**
 * Creates initial empty form state
 */
function createEmptyForm() {
  return {
    nome: "",
    empresa: "",
    pix: "",
    banco: "",
    conta: "",
    uf: "",
    telefone: "",
    email: "",
    tipo: "",
    cnpjCpf: "",
  };
}

/**
 * Sanitizes numeric fields by removing non-digit characters
 */
function sanitizeNumericField(fieldName, value) {
  if (fieldName === "codigo") {
    return value.replace(/\D/g, "");
  }
  return value;
}

/**
 * ColaboradorModal - Form modal for creating and editing colaboradores
 */
export default function ColaboradorModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(createEmptyForm());
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });

  useEffect(() => {
    if (initial) {
      setForm({ ...initial });
    }
  }, [initial]);

  function handleChange(e) {
    const fieldName = e.target.name;
    const sanitizedValue = sanitizeNumericField(fieldName, e.target.value);
    setForm((previousForm) => ({ ...previousForm, [fieldName]: sanitizedValue }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    if (!form.nome?.trim()) {
      setErrorModal({
        open: true,
        message: "O campo Nome do Colaborador é obrigatório."
      });
      return;
    }

    onSubmit(form);
    setForm(createEmptyForm());
  }

  if (!open) return null;
  return (
    <>
      <ErrorModal
        open={errorModal.open}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, message: "" })}
      />
      <Modal onClose={onClose} ariaLabel={initial ? "Editar Colaborador" : "Novo Colaborador"}>
        <Title>{initial ? "Editar Colaborador" : "Novo Colaborador"}</Title>
        <FL.FormGrid as="form" onSubmit={handleSubmit}>
          <GridTwo>
            <div>
              <FL.Label>Nome do Colaborador</FL.Label>
              <FE.Input name="nome" placeholder="Nome do Colaborador" value={form.nome} onChange={handleChange} required />
            </div>
            <div>
              <FL.Label>Empresa</FL.Label>
              <FE.Input name="empresa" placeholder="Empresa (opcional)" value={form.empresa} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>PIX</FL.Label>
              <FE.Input name="pix" placeholder="PIX" value={form.pix} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>Banco</FL.Label>
              <FE.Input name="banco" placeholder="Banco" value={form.banco} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>Conta</FL.Label>
              <FE.Input name="conta" placeholder="Conta (agência/conta)" value={form.conta} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>UF</FL.Label>
              <FE.Input name="uf" placeholder="UF" value={form.uf} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>Telefone</FL.Label>
              <FE.Input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>Email</FL.Label>
              <FE.Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <FL.Label>Tipo</FL.Label>
              <select name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="">Selecionar</option>
                <option value="Pessoa Fisica">Pessoa Fisica</option>
                <option value="Pessoa Juridica">Pessoa Juridica</option>
              </select>
            </div>
            <div>
              <FL.Label>CNPJ/CPF</FL.Label>
              <FE.Input name="cnpjCpf" placeholder="CNPJ/CPF" value={form.cnpjCpf} onChange={handleChange} />
            </div>
          </GridTwo>
          <FL.Actions>
            <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
            <FE.Button type="submit">{initial ? "Salvar" : "Criar"}</FE.Button>
          </FL.Actions>
        </FL.FormGrid>
      </Modal>
    </>
  );
}
