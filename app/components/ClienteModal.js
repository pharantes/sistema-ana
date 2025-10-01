import React, { useState } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  min-width: 320px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
`;
const Title = styled.h2`
  margin-bottom: 16px;
`;
const Form = styled.form`
  display: grid;
  gap: 12px;
`;
const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const Button = styled.button`
  padding: 8px 16px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default function ClienteModal({ open, onClose, onSubmit, initial }) {
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
        codigo: initial.codigo ? String(Number(initial.codigo)) : "",
      });
    }
  }, [initial]);

  function handleChange(e) {
    let value = e.target.value;
    if (e.target.name === "codigo") {
      // Only allow numbers, strip leading zeros for input
      value = value.replace(/\D/g, "");
    }
    setForm({ ...form, [e.target.name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const paddedForm = {
      ...form,
      codigo: String(form.codigo).padStart(4, "0"),
    };
    onSubmit(paddedForm);
    setForm({
      codigo: "",
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
    <ModalOverlay>
      <ModalContent>
        <Title>{initial ? "Editar Cliente" : "Novo Cliente"}</Title>
        <Form onSubmit={handleSubmit}>
          <Input name="codigo" placeholder="Código" value={form.codigo} onChange={handleChange} required type="text" maxLength={4} pattern="\d{1,4}" />
          <Input name="nome" placeholder="Nome do Cliente" value={form.nome} onChange={handleChange} required />
          <Input name="endereco" placeholder="Endereço" value={form.endereco} onChange={handleChange} required />
          <Input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} required />
          <Input name="uf" placeholder="UF" value={form.uf} onChange={handleChange} required />
          <Input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} required />
          <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <Input name="nomeContato" placeholder="Nome do contato" value={form.nomeContato} onChange={handleChange} required />
          <Input name="tipo" placeholder="Tipo" value={form.tipo} onChange={handleChange} required />
          <Input name="cnpjCpf" placeholder="CNPJ/CPF" value={form.cnpjCpf} onChange={handleChange} required />
          <Button type="submit">{initial ? "Salvar" : "Criar"}</Button>
          <Button type="button" style={{ background: '#aaa', marginLeft: 8 }} onClick={onClose}>Cancelar</Button>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}
