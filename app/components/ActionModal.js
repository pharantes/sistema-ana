
"use client";
import { useEffect, useState } from "react";
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
const StaffRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
`;

export default function ActionModal({ editing, form, setForm, staffRows, setStaffRows, onClose, onSubmit, loading }) {
  const [servidores, setServidores] = useState([]);
  useEffect(() => {
    fetch("/api/servidor")
      .then(res => res.json())
      .then(data => setServidores(data));
  }, []);
  return (
    <ModalOverlay>
      <ModalContent>
        <h3>{editing ? 'Editar Ação' : 'Nova Ação'}</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="Evento/Nome da ação"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              placeholder="Cliente"
              value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              required
            />
            <div>
              <label htmlFor="servidor">Servidor</label>
              <select
                id="servidor"
                value={form.servidor || ""}
                onChange={e => setForm(f => ({ ...f, servidor: e.target.value }))}
                required
              >
                <option value="">Selecione um servidor</option>
                {servidores.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input placeholder="Forma de pagamento" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="date">Data do evento</label>
              <input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="dueDate">Vencimento</label>
              <input id="dueDate" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Profissionais</div>
              {staffRows.map((row, idx) => (
                <StaffRow key={idx}>
                  <input placeholder="Nome" value={row.name} onChange={e => { const next = [...staffRows]; next[idx].name = e.target.value; setStaffRows(next); }} />
                  <input placeholder="Valor" value={row.value} onChange={e => { const next = [...staffRows]; next[idx].value = e.target.value; setStaffRows(next); }} />
                  <input placeholder="PIX" value={row.pix} onChange={e => { const next = [...staffRows]; next[idx].pix = e.target.value; setStaffRows(next); }} />
                  <input placeholder="Banco" value={row.bank} onChange={e => { const next = [...staffRows]; next[idx].bank = e.target.value; setStaffRows(next); }} />
                  <button type="button" onClick={() => setStaffRows(rows => rows.filter((_, i) => i !== idx))}>Remover</button>
                </StaffRow>
              ))}
              <button type="button" onClick={() => setStaffRows(rows => [...rows, { name: "", value: "", pix: "", bank: "" }])}>Adicionar profissional</button>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
