import React, { useState } from "react";
import styled from "styled-components";
import { GridTwoGap as GridTwo } from './ui/primitives';
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';

const Title = styled.h2`
  margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;

/**
 * Creates initial empty cliente form state
 */
function createEmptyClienteForm() {
  return {
    nome: "",
    endereco: "",
    cidade: "",
    uf: "",
    telefone: "",
    email: "",
    nomeContato: "",
    tipo: "",
    cnpjCpf: "",
    banco: "",
    conta: "",
    formaPgt: "",
  };
}

/**
 * ClienteModal - Form modal for creating and editing clientes
 */
export default function ClienteModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => {
    return initial ? { ...initial } : createEmptyClienteForm();
  });

  React.useEffect(() => {
    if (initial) {
      setForm({ ...initial });
    }
  }, [initial]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(previousForm => ({ ...previousForm, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
    setForm(createEmptyClienteForm());
  }

  if (!open) return null;
  return (
    <Modal onClose={onClose} ariaLabel={initial ? 'Editar Cliente' : 'Novo Cliente'}>
      <Title>{initial ? "Editar Cliente" : "Novo Cliente"}</Title>
      <FL.FormGrid as="form" onSubmit={handleSubmit}>
        <GridTwo>
          <div>
            <FL.Label>Nome do Cliente</FL.Label>
            <FE.Input name="nome" placeholder="Nome do Cliente" value={form.nome} onChange={handleChange} required />
          </div>
          <div>
            <FL.Label>Nome do contato</FL.Label>
            <FE.Input name="nomeContato" placeholder="Nome do contato" value={form.nomeContato} onChange={handleChange} />
          </div>
          <div>
            <FL.Label>Endereço</FL.Label>
            <FE.Input name="endereco" placeholder="Endereço" value={form.endereco} onChange={handleChange} />
          </div>
          <div>
            <FL.Label>Cidade</FL.Label>
            <FE.Input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} />
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
            <FE.Select name="tipo" value={form.tipo || ''} onChange={handleChange}>
              <option value="">Selecionar</option>
              <option value="Pessoa Fisica">Pessoa Fisica</option>
              <option value="Pessoa Juridica">Pessoa Juridica</option>
            </FE.Select>
          </div>
          <div>
            <FL.Label>CNPJ/CPF</FL.Label>
            <FE.Input name="cnpjCpf" placeholder="CNPJ/CPF" value={form.cnpjCpf} onChange={handleChange} />
          </div>
          <div>
            <FL.Label>Banco</FL.Label>
            <FE.Input name="banco" placeholder="Banco" value={form.banco || ''} onChange={handleChange} />
          </div>
          <div>
            <FL.Label>Conta</FL.Label>
            <FE.Input name="conta" placeholder="Conta" value={form.conta || ''} onChange={handleChange} />
          </div>
          <div>
            <FL.Label>Forma Pgt</FL.Label>
            <FE.Select name="formaPgt" value={form.formaPgt || ''} onChange={handleChange}>
              <option value="">Selecionar</option>
              <option value="PIX">PIX</option>
              <option value="TED">TED</option>
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="BOLETO">BOLETO</option>
            </FE.Select>
          </div>
        </GridTwo>
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit">{initial ? "Salvar" : "Criar"}</FE.Button>
        </FL.Actions>
      </FL.FormGrid>
    </Modal>
  );
}
