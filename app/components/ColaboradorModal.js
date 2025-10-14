import { useState, useEffect } from "react";
import styled from "styled-components";
import { GridTwoGap as GridTwo } from './ui/primitives';
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';

const Title = styled.h2`
  margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;
// using FE.Input instead of local Input
// GridTwo imported from primitives

export default function ColaboradorModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial]);

  function handleChange(e) {
    let value = e.target.value;
    if (e.target.name === "codigo") value = value.replace(/\D/g, "");
    setForm((s) => ({ ...s, [e.target.name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
    setForm({ nome: "", empresa: "", pix: "", banco: "", conta: "", uf: "", telefone: "", email: "", tipo: "", cnpjCpf: "" });
  }

  if (!open) return null;
  return (
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
  );
}
