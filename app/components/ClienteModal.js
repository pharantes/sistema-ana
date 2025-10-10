import React, { useState } from "react";
import styled from "styled-components";
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';
const Title = styled.h2`
  margin-bottom: 12px;
`;
const Input = styled.input``;

export default function ClienteModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
      };
    }
    return {
      nome: "",
      endereco: "",
      cidade: "",
      uf: "",
      telefone: "",
      email: "",
      nomeContato: "",
      tipo: "",
      cnpjCpf: ""
    };
  });

  // Update form state when initial changes (for editing)
  React.useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
      });
    }
  }, [initial]);

  function handleChange(e) {
    let value = e.target.value;
    setForm({ ...form, [e.target.name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
    setForm({
      nome: "",
      endereco: "",
      cidade: "",
      uf: "",
      telefone: "",
      email: "",
      nomeContato: "",
      tipo: "",
      cnpjCpf: ""
    });
  }

  if (!open) return null;
  return (
    <Modal onClose={onClose} ariaLabel={initial ? 'Editar Cliente' : 'Novo Cliente'}>
      <Title>{initial ? "Editar Cliente" : "Novo Cliente"}</Title>
      <FL.FormGrid as="form" onSubmit={handleSubmit}>
        <div>
          <FL.Label>Nome do Cliente</FL.Label>
          <Input name="nome" placeholder="Nome do Cliente" value={form.nome} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Endereço</FL.Label>
          <Input name="endereco" placeholder="Endereço" value={form.endereco} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Cidade</FL.Label>
          <Input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>UF</FL.Label>
          <Input name="uf" placeholder="UF" value={form.uf} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Telefone</FL.Label>
          <Input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Email</FL.Label>
          <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Nome do contato</FL.Label>
          <Input name="nomeContato" placeholder="Nome do contato" value={form.nomeContato} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>Tipo</FL.Label>
          <Input name="tipo" placeholder="Tipo" value={form.tipo} onChange={handleChange} required />
        </div>
        <div>
          <FL.Label>CNPJ/CPF</FL.Label>
          <Input name="cnpjCpf" placeholder="CNPJ/CPF" value={form.cnpjCpf} onChange={handleChange} required />
        </div>
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit">{initial ? "Salvar" : "Criar"}</FE.Button>
        </FL.Actions>
      </FL.FormGrid>
    </Modal>
  );
}
