import React, { useState } from "react";
import styled from "styled-components";
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';

const Title = styled.h2`
  margin-bottom: var(--space-sm, 12px);
`;
const Input = styled.input``;

export default function ServidorModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        codigo: initial.codigo ? String(Number(initial.codigo)) : "",
      };
    }
    return {
      codigo: "",
      nome: "",
      pix: "",
      banco: "",
      uf: "",
      telefone: "",
      email: "",
      tipo: "",
      cnpjCpf: "",
    };
  });

  React.useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        codigo: initial.codigo ? String(Number(initial.codigo)) : "",
      });
    }
  }, [initial]);

  function handleChange(e) {
    let value = e.target.value;
    if (e.target.name === "codigo") value = value.replace(/\D/g, "");
    setForm((s) => ({ ...s, [e.target.name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const paddedForm = { ...form, codigo: String(form.codigo || "").padStart(4, "0") };
    onSubmit(paddedForm);
    setForm({ codigo: "", nome: "", pix: "", banco: "", uf: "", telefone: "", email: "", tipo: "", cnpjCpf: "" });
  }

  if (!open) return null;
  return (
    <Modal onClose={onClose} ariaLabel={initial ? "Editar Servidor" : "Novo Servidor"}>
      <Title>{initial ? "Editar Servidor" : "Novo Servidor"}</Title>
      <FL.FormGrid as="form" onSubmit={handleSubmit}>
        <div>
          <FL.Label>Código</FL.Label>
          <Input name="codigo" placeholder="Código" value={form.codigo} onChange={handleChange} required type="text" maxLength={4} pattern="\\d{1,4}" />
        </div>
        <div>
          <FL.Label>Nome do Fornecedor</FL.Label>
          <Input name="nome" placeholder="Nome do Fornecedor" value={form.nome} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>PIX</FL.Label>
          <Input name="pix" placeholder="PIX" value={form.pix} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>Banco</FL.Label>
          <Input name="banco" placeholder="Banco" value={form.banco} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>UF</FL.Label>
          <Input name="uf" placeholder="UF" value={form.uf} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>Telefone</FL.Label>
          <Input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>Email</FL.Label>
          <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>Tipo</FL.Label>
          <Input name="tipo" placeholder="Tipo" value={form.tipo} onChange={handleChange} />
        </div>
        <div>
          <FL.Label>CNPJ/CPF</FL.Label>
          <Input name="cnpjCpf" placeholder="CNPJ/CPF" value={form.cnpjCpf} onChange={handleChange} />
        </div>
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit">{initial ? "Salvar" : "Criar"}</FE.Button>
        </FL.Actions>
      </FL.FormGrid>
    </Modal>
  );
}

