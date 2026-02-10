/**
 * Database Seed Script
 * Seeds the database with realistic 1-year agency data
 * 
 * Usage: node scripts/seed-db.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import models
import Cliente from '../lib/db/models/Cliente.js';
import Colaborador from '../lib/db/models/Colaborador.js';
import Action from '../lib/db/models/Action.js';
import ContasAReceber from '../lib/db/models/ContasAReceber.js';
import ContasAPagar from '../lib/db/models/ContasAPagar.js';
import ContaFixa from '../lib/db/models/ContaFixa.js';
import User from '../lib/db/models/User.js';

/**
 * Brazilian first names pool
 */
const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
  'Isabela', 'João', 'Karla', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro',
  'Rafaela', 'Samuel', 'Tatiana', 'Victor', 'Julia', 'Matheus', 'Fernanda', 'Ricardo',
  'Patricia', 'Roberto', 'Camila', 'Thiago', 'Beatriz', 'Guilherme', 'Larissa', 'Diego',
  'Amanda', 'Rafael', 'Juliana', 'Marcelo', 'Cristina', 'Anderson', 'Vanessa', 'Leonardo',
  'Priscila', 'Fernando', 'Adriana', 'Rodrigo', 'Monica', 'Renato', 'Simone', 'Marcos',
  'Sandra', 'Paulo', 'Luciana', 'Carlos', 'Aline', 'Andre', 'Fabiana'
];

/**
 * Brazilian last names pool
 */
const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
  'Nascimento', 'Fernandes', 'Araujo', 'Soares', 'Monteiro', 'Mendes', 'Cardoso', 'Reis',
  'Castro', 'Pinto', 'Barbosa', 'Teixeira', 'Marques', 'Nunes', 'Freitas', 'Moreira'
];

/**
 * Small service business names
 */
const SERVICE_BUSINESSES = [
  'TransLog Transportes', 'VanExpress Mudanças', 'Catering Sabor & Arte',
  'Buffet Delícias', 'Som & Luz Eventos', 'Foto & Video Pro', 'Segurança Total'
];

/**
 * Event types for agency actions
 */
const EVENT_TYPES = [
  'Campanha Digital', 'Produção de Vídeo', 'Evento Corporativo', 'Lançamento de Produto',
  'Ação Promocional', 'Social Media Management', 'Campanha de TV', 'Campanha OOH',
  'Material Gráfico', 'Website Development', 'Branding', 'Relatório Mensal',
  'Estratégia de Marketing', 'Consultoria', 'Assessoria de Imprensa', 'E-commerce',
  'Fotografia Institucional', 'Vídeo Institucional', 'Trade Marketing', 'Pesquisa de Mercado'
];

/**
 * Generates a random CPF (for demonstration purposes)
 */
function generateCPF() {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

/**
 * Generates a random CNPJ (for demonstration purposes)
 */
function generateCNPJ() {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/${n()}${n()}${n()}${n()}-${n()}${n()}`;
}

/**
 * Generates a random phone number
 */
function generatePhone() {
  return `(34) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`.padEnd(16, '0');
}

/**
 * Generates a random email
 */
function generateEmail(name) {
  const cleaned = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com'];
  return `${cleaned}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * Random date within range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not found in environment variables');
  }

  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');
}

/**
 * Clean database (preserve users)
 */
async function cleanDatabase() {
  console.log('\n📦 Cleaning database...');

  await Cliente.deleteMany({});
  console.log('  ✓ Cleaned clientes');

  await Colaborador.deleteMany({});
  console.log('  ✓ Cleaned colaboradores');

  await Action.deleteMany({});
  console.log('  ✓ Cleaned actions');

  await ContasAReceber.deleteMany({});
  console.log('  ✓ Cleaned contas a receber');

  await ContasAPagar.deleteMany({});
  console.log('  ✓ Cleaned contas a pagar');

  await ContaFixa.deleteMany({});
  console.log('  ✓ Cleaned contas fixas');

  console.log('✓ Database cleaned (users preserved)\n');
}

/**
 * Ensure admin user exists (create default if none found)
 */
async function ensureAdminUser() {
  console.log('👤 Checking for admin user...');

  let adminUser = await User.findOne({ role: 'admin' });

  if (!adminUser) {
    console.log('  ⚠️  No admin user found, creating default admin...');

    // Hash password for default admin (you should change this after first login)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('  ✓ Created default admin user (username: admin, password: admin123)');
    console.log('  ⚠️  IMPORTANT: Change the password after first login!\n');
  } else {
    console.log(`  ✓ Found existing admin user: ${adminUser.username}\n`);
  }

  return adminUser;
}

/**
 * Seed Colaboradores (50 realistic people + services)
 */
async function seedColaboradores() {
  console.log('👥 Seeding colaboradores...');

  const colaboradores = [];
  const usedNames = new Set();

  // 94% Pessoa Fisica (47 people)
  for (let i = 0; i < 47; i++) {
    let fullName;
    let attempts = 0;

    // Generate unique names
    do {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      fullName = `${firstName} ${lastName}`;
      attempts++;

      // If we can't find a unique name after 100 tries, add a number suffix
      if (attempts > 100) {
        fullName = `${fullName} ${Math.floor(Math.random() * 100)}`;
        break;
      }
    } while (usedNames.has(fullName));

    usedNames.add(fullName);

    colaboradores.push({
      codigo: String(i + 1).padStart(4, '0'),
      nome: fullName,
      empresa: '',
      pix: generatePhone(),
      banco: ['Banco do Brasil', 'Caixa', 'Bradesco', 'Itaú', 'Santander'][Math.floor(Math.random() * 5)],
      conta: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 10)}`,
      uf: 'MG',
      telefone: generatePhone(),
      email: generateEmail(fullName),
      tipo: 'Pessoa Fisica',
      cnpjCpf: generateCPF()
    });
  }

  // 6% Pessoa Juridica (3 service businesses)
  for (let i = 0; i < 3; i++) {
    const businessName = SERVICE_BUSINESSES[i];

    colaboradores.push({
      codigo: String(47 + i + 1).padStart(4, '0'),
      nome: businessName,
      empresa: businessName,
      pix: generateCNPJ(),
      banco: ['Banco do Brasil', 'Bradesco', 'Itaú'][Math.floor(Math.random() * 3)],
      conta: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 10)}`,
      uf: 'MG',
      telefone: generatePhone(),
      email: generateEmail(businessName.replace(/\s+/g, '')),
      tipo: 'Pessoa Juridica',
      cnpjCpf: generateCNPJ()
    });
  }

  const inserted = await Colaborador.insertMany(colaboradores);
  console.log(`  ✓ Created ${inserted.length} colaboradores (${47} PF, ${3} PJ)\n`);

  return inserted;
}

/**
 * Seed Clientes (7 major clients)
 */
async function seedClientes() {
  console.log('🏢 Seeding clientes...');

  const clientes = [
    {
      codigo: '0001',
      nome: 'Coca-Cola Brasil',
      endereco: 'Av. Paulista, 1000',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '(11) 3000-1000',
      email: 'contato@cocacola.com.br',
      nomeContato: 'Maria Silva',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '45.997.418/0001-53',
      banco: 'Itaú',
      conta: '12345-6',
      formaPgt: 'Transferência Bancária'
    },
    {
      codigo: '0002',
      nome: 'Uberlandia Refrescos',
      endereco: 'Av. João Naves, 500',
      cidade: 'Uberlândia',
      uf: 'MG',
      telefone: '(34) 3220-5000',
      email: 'comercial@udirefrescos.com.br',
      nomeContato: 'João Santos',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '12.345.678/0001-90',
      banco: 'Bradesco',
      conta: '23456-7',
      formaPgt: 'Boleto'
    },
    {
      codigo: '0003',
      nome: 'Ambev',
      endereco: 'Rua Dr. Renato Paes de Barros, 1017',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '(11) 2122-1500',
      email: 'parcerias@ambev.com.br',
      nomeContato: 'Carlos Oliveira',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '07.526.557/0001-00',
      banco: 'Santander',
      conta: '34567-8',
      formaPgt: 'Transferência Bancária'
    },
    {
      codigo: '0004',
      nome: 'Rede Bandeirantes',
      endereco: 'Rua Radiantes, 13',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '(11) 2102-2300',
      email: 'comercial@band.com.br',
      nomeContato: 'Patricia Costa',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '88.610.191/0001-10',
      banco: 'Banco do Brasil',
      conta: '45678-9',
      formaPgt: 'Boleto'
    },
    {
      codigo: '0005',
      nome: 'Center Shopping Uberlandia',
      endereco: 'Av. Floriano Peixoto, 1500',
      cidade: 'Uberlândia',
      uf: 'MG',
      telefone: '(34) 3230-3000',
      email: 'marketing@centershopping.com.br',
      nomeContato: 'Ana Ferreira',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '23.456.789/0001-01',
      banco: 'Caixa',
      conta: '56789-0',
      formaPgt: 'Transferência Bancária'
    },
    {
      codigo: '0006',
      nome: 'Unitri - Centro Universitário',
      endereco: 'Av. Nicomedes Alves dos Santos, 4545',
      cidade: 'Uberlândia',
      uf: 'MG',
      telefone: '(34) 3229-9400',
      email: 'marketing@unitri.edu.br',
      nomeContato: 'Roberto Almeida',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '34.567.890/0001-12',
      banco: 'Itaú',
      conta: '67890-1',
      formaPgt: 'Boleto'
    },
    {
      codigo: '0007',
      nome: 'Flavio Calcados',
      endereco: 'Rua Santos Dumont, 890',
      cidade: 'Uberlândia',
      uf: 'MG',
      telefone: '(34) 3214-5500',
      email: 'contato@flaviocalcados.com.br',
      nomeContato: 'Flavio Rodrigues',
      tipo: 'Pessoa Juridica',
      cnpjCpf: '45.678.901/0001-23',
      banco: 'Bradesco',
      conta: '78901-2',
      formaPgt: 'Transferência Bancária'
    }
  ];

  const inserted = await Cliente.insertMany(clientes);
  console.log(`  ✓ Created ${inserted.length} clientes\n`);

  return inserted;
}

/**
 * Seed Contas Fixas (monthly recurring costs)
 */
async function seedContasFixas() {
  console.log('💰 Seeding contas fixas...');

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const contasFixas = [
    {
      name: 'Energia Elétrica',
      empresa: 'CEMIG',
      tipo: 'mensal',
      valor: 850,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 10),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 10)
    },
    {
      name: 'Internet Fibra',
      empresa: 'Vivo Fibra',
      tipo: 'mensal',
      valor: 299,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 5),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 5)
    },
    {
      name: 'Aluguel Escritório',
      empresa: 'Imobiliária Central',
      tipo: 'mensal',
      valor: 3500,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 10),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 10)
    },
    {
      name: 'Segurança Patrimonial',
      empresa: 'Segurança Total',
      tipo: 'mensal',
      valor: 1200,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 15),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 15)
    },
    {
      name: 'Seguro Empresarial',
      empresa: 'Porto Seguro',
      tipo: 'mensal',
      valor: 450,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 20),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 20)
    },
    {
      name: 'Software Adobe Creative Cloud',
      empresa: 'Adobe',
      tipo: 'mensal',
      valor: 320,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 1),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 1)
    },
    {
      name: 'Contador',
      empresa: 'Contabilidade Exata',
      tipo: 'mensal',
      valor: 800,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 5),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 5)
    },
    {
      name: 'Telefonia Corporativa',
      empresa: 'Claro Empresas',
      tipo: 'mensal',
      valor: 380,
      status: 'ABERTO',
      vencimento: new Date(now.getFullYear(), now.getMonth(), 12),
      nextDueAt: new Date(now.getFullYear(), now.getMonth(), 12)
    }
  ];

  const inserted = await ContaFixa.insertMany(contasFixas);
  console.log(`  ✓ Created ${inserted.length} contas fixas (total: R$ ${inserted.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}/month)\n`);

  return inserted;
}

/**
 * Generate actions for a specific month with realistic distribution
 * Monthly revenue target: 60-70k
 * Profit margin: 30-35%
 * Therefore costs should be 65-70% of revenue
 */
async function generateMonthActions(clientes, colaboradores, monthDate, adminEmail) {
  const actions = [];

  // Target monthly revenue: 60k-70k
  const targetRevenue = 60000 + Math.random() * 10000;

  // Client revenue distribution (based on order given)
  // Coca-Cola: 30%, Uberlandia: 20%, Ambev: 18%, Bandeirantes: 12%, 
  // Center Shopping: 10%, Unitri: 7%, Flavio: 3%
  const clientDistribution = [0.30, 0.20, 0.18, 0.12, 0.10, 0.07, 0.03];

  // Number of actions per client this month (1-4 depending on size)
  const actionsPerClient = [3, 2, 2, 2, 1, 1, 1];

  for (let clientIdx = 0; clientIdx < clientes.length; clientIdx++) {
    const cliente = clientes[clientIdx];
    const clientRevenue = targetRevenue * clientDistribution[clientIdx];
    const numActions = actionsPerClient[clientIdx];

    for (let actionIdx = 0; actionIdx < numActions; actionIdx++) {
      // Revenue for this action
      const actionRevenue = (clientRevenue / numActions) * (0.85 + Math.random() * 0.3);

      // Costs should be 65-70% of revenue for 30-35% profit margin
      const costPercentage = 0.65 + Math.random() * 0.05;
      const totalCosts = actionRevenue * costPercentage;

      // Generate action date within this month
      const actionDate = new Date(monthDate.getFullYear(), monthDate.getMonth(),
        Math.floor(Math.random() * 28) + 1);

      // Event type
      const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];

      // Distribute costs among 2-5 colaboradores (ensure unique staff per action)
      const numStaff = Math.floor(Math.random() * 4) + 2; // 2-5 people
      const staff = [];
      let remainingCost = totalCosts;
      const usedColaboradores = new Set(); // Track used colaboradores

      for (let staffIdx = 0; staffIdx < numStaff; staffIdx++) {
        // Find a unique colaborador not yet used in this action
        let colab;
        let attempts = 0;
        do {
          colab = colaboradores[Math.floor(Math.random() * colaboradores.length)];
          attempts++;
          // Safety valve: if we can't find a unique one after 50 tries, allow duplicates
          if (attempts > 50) break;
        } while (usedColaboradores.has(colab._id.toString()));

        usedColaboradores.add(colab._id.toString());

        // Last person gets remaining cost, others get random portion
        let staffCost;
        if (staffIdx === numStaff - 1) {
          staffCost = remainingCost;
        } else {
          staffCost = (remainingCost / (numStaff - staffIdx)) * (0.7 + Math.random() * 0.6);
          remainingCost -= staffCost;
        }

        staff.push({
          name: colab.nome,
          value: Math.round(staffCost * 100) / 100,
          pix: colab.pix,
          bank: colab.banco,
          pgt: 'PIX',
          vencimento: addDays(actionDate, 30)
        });
      }

      // Occasionally add extra costs (20% chance)
      const costs = [];
      if (Math.random() < 0.2) {
        const extraCostAmount = totalCosts * (0.05 + Math.random() * 0.10);
        const costColab = colaboradores[Math.floor(Math.random() * colaboradores.length)];

        costs.push({
          description: ['Material Gráfico', 'Locação de Equipamento', 'Transporte', 'Alimentação'][Math.floor(Math.random() * 4)],
          value: Math.round(extraCostAmount * 100) / 100,
          pix: costColab.pix,
          bank: costColab.banco,
          pgt: 'PIX',
          vencimento: addDays(actionDate, 15),
          colaboradorId: costColab._id,
          vendorName: costColab.nome,
          vendorEmpresa: costColab.empresa || ''
        });
      }

      actions.push({
        name: `${eventType} - ${cliente.nome}`,
        event: eventType,
        client: String(cliente._id),
        date: actionDate,
        startDate: actionDate,
        endDate: addDays(actionDate, Math.floor(Math.random() * 7) + 1),
        paymentMethod: 'Transferência Bancária',
        dueDate: addDays(actionDate, 30),
        staff,
        costs,
        createdBy: adminEmail
      });
    }
  }

  return actions;
}

/**
 * Seed Actions (12 months of realistic agency work)
 */
async function seedActions(clientes, colaboradores, adminUser) {
  console.log('📋 Seeding actions (12 months)...');

  const allActions = [];
  const now = new Date();

  // Generate actions for the past 12 months
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    console.log(`  Generating actions for ${monthName}...`);
    const monthActions = await generateMonthActions(clientes, colaboradores, monthDate, adminUser.username);
    allActions.push(...monthActions);
  }

  const inserted = await Action.insertMany(allActions);
  console.log(`  ✓ Created ${inserted.length} actions over 12 months\n`);

  return inserted;
}

/**
 * Create ContasAReceber for each action
 */
async function seedContasAReceber(actions) {
  console.log('💵 Seeding contas a receber...');

  const contasAReceber = [];

  for (const action of actions) {
    // Calculate total revenue (sum of all staff costs + costs + margin)
    const totalStaffCost = action.staff.reduce((sum, s) => sum + s.value, 0);
    const totalExtraCosts = action.costs.reduce((sum, c) => sum + c.value, 0);
    const totalCosts = totalStaffCost + totalExtraCosts;

    // Revenue is costs / 0.70 (to achieve 30% margin)
    const revenue = totalCosts / 0.67; // Using 67% cost ratio for 33% margin

    // 70% chance the receivable is RECEBIDO if action is older than 45 days
    const daysSinceAction = (new Date() - action.date) / (1000 * 60 * 60 * 24);
    const isReceived = daysSinceAction > 45 && Math.random() < 0.7;

    contasAReceber.push({
      actionIds: [action._id],
      clientId: action.client,
      status: isReceived ? 'RECEBIDO' : 'ABERTO',
      reportDate: action.date,
      dataVencimento: action.dueDate || addDays(action.date, 30),
      dataRecebimento: isReceived ? addDays(action.date, Math.floor(Math.random() * 45) + 15) : null,
      valor: Math.round(revenue * 100) / 100,
      descricao: `Recebimento - ${action.name}`,
      recorrente: false
    });
  }

  const inserted = await ContasAReceber.insertMany(contasAReceber);

  const totalReceived = inserted.filter(c => c.status === 'RECEBIDO').reduce((sum, c) => sum + c.valor, 0);
  const totalPending = inserted.filter(c => c.status === 'ABERTO').reduce((sum, c) => sum + c.valor, 0);

  console.log(`  ✓ Created ${inserted.length} contas a receber`);
  console.log(`    - Recebido: R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`    - Em aberto: R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);

  return inserted;
}

/**
 * Create ContasAPagar for each action (staff + costs)
 */
async function seedContasAPagar(actions) {
  console.log('💸 Seeding contas a pagar...');

  const contasAPagar = [];

  for (const action of actions) {
    const daysSinceAction = (new Date() - action.date) / (1000 * 60 * 60 * 24);

    // Create conta a pagar for each staff member
    for (const staffMember of action.staff) {
      // 75% chance it's paid if action is older than 30 days
      const isPaid = daysSinceAction > 30 && Math.random() < 0.75;

      contasAPagar.push({
        actionId: action._id,
        staffName: staffMember.name,
        // Don't include costId at all for staff entries (not even null)
        status: isPaid ? 'PAGO' : 'ABERTO',
        reportDate: action.date
      });
    }

    // Create conta a pagar for each additional cost
    for (const cost of action.costs) {
      const isPaid = daysSinceAction > 15 && Math.random() < 0.8;

      contasAPagar.push({
        actionId: action._id,
        // Don't include staffName at all for cost entries
        costId: cost._id,
        colaboradorId: cost.colaboradorId,
        status: isPaid ? 'PAGO' : 'ABERTO',
        reportDate: action.date
      });
    }
  }

  const inserted = await ContasAPagar.insertMany(contasAPagar);

  const paidCount = inserted.filter(c => c.status === 'PAGO').length;
  const openCount = inserted.filter(c => c.status === 'ABERTO').length;

  console.log(`  ✓ Created ${inserted.length} contas a pagar`);
  console.log(`    - Pagas: ${paidCount}`);
  console.log(`    - Em aberto: ${openCount}\n`);

  return inserted;
}

/**
 * Print summary statistics
 */
async function printSummary() {
  console.log('\n📊 Database Summary:\n');

  const clientesCount = await Cliente.countDocuments();
  const colaboradoresCount = await Colaborador.countDocuments();
  const actionsCount = await Action.countDocuments();
  const receberCount = await ContasAReceber.countDocuments();
  const pagarCount = await ContasAPagar.countDocuments();
  const fixasCount = await ContaFixa.countDocuments();

  console.log(`  Clientes: ${clientesCount}`);
  console.log(`  Colaboradores: ${colaboradoresCount}`);
  console.log(`  Actions: ${actionsCount}`);
  console.log(`  Contas a Receber: ${receberCount}`);
  console.log(`  Contas a Pagar: ${pagarCount}`);
  console.log(`  Contas Fixas: ${fixasCount}`);

  // Calculate financial summary
  const receber = await ContasAReceber.find({});
  const totalRevenue = receber.reduce((sum, c) => sum + c.valor, 0);
  const receivedRevenue = receber.filter(c => c.status === 'RECEBIDO').reduce((sum, c) => sum + c.valor, 0);

  const actions = await Action.find({});
  let totalCosts = 0;
  for (const action of actions) {
    const staffCosts = action.staff.reduce((sum, s) => sum + s.value, 0);
    const extraCosts = action.costs.reduce((sum, c) => sum + c.value, 0);
    totalCosts += staffCosts + extraCosts;
  }

  const profitMargin = ((totalRevenue - totalCosts) / totalRevenue * 100).toFixed(1);
  const monthlyAvgRevenue = (totalRevenue / 12).toFixed(2);

  console.log(`\n  💰 Financial Summary (12 months):`);
  console.log(`     Total Revenue: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`     Received: R$ ${receivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`     Total Costs: R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`     Profit: R$ ${(totalRevenue - totalCosts).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`     Profit Margin: ${profitMargin}%`);
  console.log(`     Monthly Avg Revenue: R$ ${parseFloat(monthlyAvgRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

  console.log('\n✅ Seeding complete!\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🌱 Starting database seed...\n');

    await connectDB();
    await cleanDatabase();
    const adminUser = await ensureAdminUser();

    const colaboradores = await seedColaboradores();
    const clientes = await seedClientes();
    await seedContasFixas();
    const actions = await seedActions(clientes, colaboradores, adminUser);
    await seedContasAReceber(actions);
    await seedContasAPagar(actions);

    await printSummary();

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
