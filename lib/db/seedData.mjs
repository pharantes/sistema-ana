import dbConnect from './connect.js';
import Cliente from './models/Cliente.js';
import Colaborador from './models/Colaborador.js';

async function seed() {
  await dbConnect();
  console.log('Connected');

  // Clear small sample sets (use carefully)
  await Cliente.deleteMany({});
  await Colaborador.deleteMany({});

  const clientes = [
    { codigo: '0001', nome: 'Clinica Alpha', endereco: 'Rua A, 123', cidade: 'Cidade A', uf: 'SP', telefone: '1111-1111', email: 'alpha@cli.com', nomeContato: 'Ana', tipo: 'Empresa', cnpjCpf: '00.000.000/0001-00' },
    { codigo: '0002', nome: 'Instituto Beta', endereco: 'Av B, 45', cidade: 'Cidade B', uf: 'RJ', telefone: '2222-2222', email: 'beta@inst.com', nomeContato: 'Paulo', tipo: 'Empresa', cnpjCpf: '11.111.111/0001-11' },
    { codigo: '0003', nome: 'Paciente Silva', endereco: 'Rua C, 9', cidade: 'Cidade C', uf: 'MG', telefone: '3333-3333', email: 'silva@pac.com', nomeContato: 'Silva', tipo: 'Pessoa', cnpjCpf: '999.999.999-99' },
  ];

  const colaboradores = [
    { codigo: '1001', nome: 'Dr. João', empresa: 'Clinica João', pix: 'joao@pix', banco: 'Banco A', uf: 'SP', telefone: '4444-4444', email: 'joao@ser.com', tipo: 'Pessoa', cnpjCpf: '22.222.222/0001-22' },
    { codigo: '1002', nome: 'Dra. Maria', empresa: '', pix: 'maria@pix', banco: 'Banco B', uf: 'RJ', telefone: '5555-5555', email: 'maria@ser.com', tipo: 'Pessoa', cnpjCpf: '33.333.333/0001-33' },
    { codigo: '1003', nome: 'Equipe X', empresa: 'Empresa X LTDA', pix: 'equipe@pix', banco: 'Banco C', uf: 'MG', telefone: '6666-6666', email: 'equipe@ser.com', tipo: 'Equipe', cnpjCpf: '44.444.444/0001-44' },
  ];

  const createdClientes = await Cliente.insertMany(clientes);
  const createdColaboradores = await Colaborador.insertMany(colaboradores);

  console.log('Seed completed');
  console.log('Clientes:', createdClientes.map(c => ({ _id: c._id, codigo: c.codigo, nome: c.nome })));
  console.log('Colaboradores:', createdColaboradores.map(s => ({ _id: s._id, codigo: s.codigo, nome: s.nome })));
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
