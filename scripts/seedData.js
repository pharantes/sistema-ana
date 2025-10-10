#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
/* global process, console */
import 'dotenv/config';
import dbConnect from '../lib/db/connect.js';
import mongoose from 'mongoose';
import User from '../lib/db/models/User.js';
import Action from '../lib/db/models/Action.js';
import Cliente from '../lib/db/models/Cliente.js';
import Colaborador from '../lib/db/models/Colaborador.js';
import bcrypt from 'bcryptjs';

function pad(n, width = 4) { return String(n).padStart(width, '0'); }

function addBusinessDays(baseDate, days) {
  const d = new Date(baseDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

function computeDueDateFrom(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 15);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  return d;
}

async function run() {
  await dbConnect();

  // Ensure users exist as requested
  const userDefs = [
    { username: 'admin', password: 'adminpassword', role: 'admin' },
    { username: 'staff', password: 'staffpassword', role: 'staff' }
  ];
  for (const u of userDefs) {
    const found = await User.findOne({ username: u.username });
    if (!found) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.create({ username: u.username, password: hashed, role: u.role });
      console.log(`Created user ${u.username}`);
    }
  }

  // Create provided clientes (IDs will be used in actions)
  const clienteNomes = [
    'Coca-Cola',
    'Center Shopping',
    'Politriz',
    'Flavio Calcados',
    'Unitri',
    'Uberlandia Refrescos',
    'Rede Bandeirantes',
  ];
  const clientes = clienteNomes.map((nome, idx) => ({
    codigo: pad(idx + 1),
    nome,
    endereco: `Av. Exemplo ${idx + 1}, 123`,
    cidade: 'Uberlândia',
    uf: 'MG',
    telefone: `34 9${pad(idx + 10, 2)}00-0000`,
    email: `${nome.toLowerCase().replace(/\s+/g, '')}${idx + 1}@example.com`,
    nomeContato: `Contato ${idx + 1}`,
    tipo: 'PJ',
    cnpjCpf: `00.000.000/000${idx + 1}-00`
  }));
  await Cliente.deleteMany({});
  const createdClientes = await Cliente.insertMany(clientes);

  // Create 10 colaboradores (random names)
  const colaboradorNomes = [
    'Ana Souza', 'Bruno Lima', 'Carlos Pereira', 'Daniela Alves', 'Eduardo Silva',
    'Fernanda Gomes', 'Gustavo Rocha', 'Helena Martins', 'Igor Santos', 'Juliana Costa'
  ];
  const colaboradores = colaboradorNomes.map((nome, idx) => ({
    codigo: pad(idx + 1),
    nome,
    pix: `pix-${nome.toLowerCase().replace(/\s+/g, '-')}`,
    banco: ['Itaú', 'Bradesco', 'Nubank', 'Caixa', 'BB'][idx % 5],
    uf: 'MG',
    telefone: `34 9${pad(idx + 20, 2)}00-0000`,
    email: `${nome.toLowerCase().replace(/\s+/g, '')}@example.com`,
    tipo: 'Pessoa Fisica',
    cnpjCpf: `000.000.000-0${idx + 1}`
  }));
  await Colaborador.deleteMany({});
  const createdColaboradores = await Colaborador.insertMany(colaboradores);

  // Create 10 actions with realistic examples
  await Action.deleteMany({});
  const actions = [];
  const paymentMethods = ['Pix', 'TED', 'Boleto', 'Dinheiro'];
  const base = new Date();
  const actionNames = [
    'Campanha Promocional', 'Lançamento de Produto', 'Ação de Degustação', 'Ativação de Marca', 'Roadshow Regional',
    'Treinamento de Equipe', 'Feira Setorial', 'Workshop Técnico', 'Coletiva de Imprensa', 'Evento Corporativo'
  ];
  for (let i = 0; i < 10; i++) {
    const client = createdClientes[i % createdClientes.length];
    const start = new Date(base);
    start.setDate(start.getDate() - (28 - i * 2));
    const end = new Date(start);
    end.setDate(end.getDate() + (i % 3));
    const due = computeDueDateFrom(start.toISOString().split('T')[0]);
    const created = new Date(start);
    const staffCount = 1 + (i % 3);
    const staff = [];
    for (let s = 0; s < staffCount; s++) {
      const col = createdColaboradores[(i + s) % createdColaboradores.length];
      staff.push({ name: col.nome, value: 150 + 75 * s, pix: col.pix, bank: col.banco });
    }
    actions.push({
      name: actionNames[i],
      event: `${actionNames[i]} ${client.nome}`,
      client: client._id, // store client as ID
      date: created,
      startDate: start,
      endDate: end,
      paymentMethod: paymentMethods[i % paymentMethods.length],
      dueDate: due,
      staff,
      createdBy: 'admin',
      createdAt: created,
    });
  }
  await Action.insertMany(actions);

  await mongoose.connection.close();
  console.log('Seed completed');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
