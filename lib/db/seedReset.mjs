import 'dotenv/config';
import dbConnect from './connect.js';
import mongoose from 'mongoose';
import Action from './models/Action.js';
import Cliente from './models/Cliente.js';
import Servidor from './models/Servidor.js';
import ContasAPagar from './models/ContasAPagar.js';

async function main() {
  await dbConnect();

  // Clean collections
  await Promise.all([
    Action.deleteMany({}),
    Cliente.deleteMany({}),
    Servidor.deleteMany({}),
    ContasAPagar.deleteMany({}),
  ]);

  // Seed clientes (fill all required fields)
  const clientes = await Cliente.insertMany([
    {
      codigo: '1',
      nome: 'Acme Corp',
      endereco: 'Av. Paulista, 1000',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '11999990000',
      email: 'contato@acme.com',
      nomeContato: 'Carlos Silva',
      tipo: 'PJ',
      cnpjCpf: '12.345.678/0001-90',
    },
    {
      codigo: '2',
      nome: 'Umbrella',
      endereco: 'Rua das Flores, 200',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      telefone: '21988887777',
      email: 'financeiro@umbrella.com',
      nomeContato: 'Ana Souza',
      tipo: 'PJ',
      cnpjCpf: '98.765.432/0001-10',
    },
  ]);

  // Seed servidores (fill all required fields)
  const servidores = await Servidor.insertMany([
    {
      codigo: '1',
      nome: 'João Silva',
      pix: 'joao@nubank.com',
      banco: 'Nubank',
      uf: 'SP',
      telefone: '11911112222',
      email: 'joao@exemplo.com',
      tipo: 'PF',
      cnpjCpf: '123.456.789-10',
    },
    {
      codigo: '2',
      nome: 'Maria Souza',
      pix: 'maria@itau.com',
      banco: 'Itaú',
      uf: 'RJ',
      telefone: '21922223333',
      email: 'maria@exemplo.com',
      tipo: 'PF',
      cnpjCpf: '234.567.890-21',
    },
    {
      codigo: '3',
      nome: 'Pedro Lima',
      pix: 'pedro@bradesco.com',
      banco: 'Bradesco',
      uf: 'MG',
      telefone: '31933334444',
      email: 'pedro@exemplo.com',
      tipo: 'PF',
      cnpjCpf: '345.678.901-32',
    },
  ]);

  // Map servidores to staff entries for Action
  function staff(name, value, pix, bank) {
    return { name, value, pix, bank };
  }

  const acoes = await Action.insertMany([
    {
      name: 'Site Landing',
      event: 'Landing Page',
      client: clientes[0].nome,
      date: new Date(),
      paymentMethod: 'PIX',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      staff: [
        staff(servidores[0].nome, 1200, servidores[0].pix, servidores[0].banco),
        staff(servidores[1].nome, 800, servidores[1].pix, servidores[1].banco),
      ],
      createdBy: 'admin',
    },
    {
      name: 'Campanha Social',
      event: 'Social',
      client: clientes[1].nome,
      date: new Date(),
      paymentMethod: 'TED',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      staff: [
        staff(servidores[2].nome, 1500, servidores[2].pix, servidores[2].banco),
      ],
      createdBy: 'admin',
    },
  ]);

  console.log('Seed completed:', {
    clientes: clientes.length,
    servidores: servidores.length,
    acoes: acoes.length,
  });

  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


