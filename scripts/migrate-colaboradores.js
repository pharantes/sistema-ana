/**
 * Migration script to clean and populate colaboradores with real data
 * 
 * Usage: 
 *   MONGODB_URI=your_connection_string node scripts/migrate-colaboradores.js
 *   or create a .env.local file with MONGODB_URI
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading from .env.local first, then .env
const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📄 Loaded .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📄 Loaded .env');
} else {
  console.log('⚠️  No .env file found, using environment variables');
}

// MongoDB connection - fallback to localhost if not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

const ColaboradorSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    set: v => String(v).padStart(4, '0')
  },
  nome: { type: String, required: true },
  empresa: { type: String },
  pix: { type: String },
  banco: { type: String },
  conta: { type: String },
  uf: { type: String },
  telefone: { type: String },
  email: { type: String },
  tipo: { type: String }, // Removed enum temporarily
  cnpjCpf: { type: String },
}, { timestamps: true });

// Delete the model if it exists to avoid conflicts
if (mongoose.models.Colaborador) {
  delete mongoose.models.Colaborador;
}

const Colaborador = mongoose.model('Colaborador', ColaboradorSchema);

// Raw data from Excel (columns: Nome, PIX, BANCO, Telefone 1, E-mail, Tipo, CNPJ/CPF)
const rawData = [
  { nome: 'Adrielly Guedes De Pontes Alves', pix: '34998892308', banco: 'Nubank', telefone: '34998892308', email: 'adriellyguedes813@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '13488361640' },
  { nome: 'Alexandre de Oliveira Machado Filho', pix: '13617570607', banco: 'itau', telefone: '34984098488', email: 'Alexandre.machadof@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '13617570607' },
  { nome: 'AMANDA GABRILE DE LIMA', pix: '11720582610', banco: 'NUBANK', telefone: '34999099188', email: 'amandadelima550@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '11720582610' },
  { nome: 'ANA CAROLINA DA SILVA', pix: '.01870129628', banco: 'NUBANK', telefone: '34992355470', email: 'Carollulu1234@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.01870129628' },
  { nome: 'ANA CAROLINA DA SILVA - ARAXA', pix: '34988789102', banco: 'MERCADO PAGO', telefone: '34988789102', email: 'diervelyperera@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12544499656' },
  { nome: 'ANA CAROLINA NUNES MENDES', pix: '.05333889619', banco: 'SANTANDER', telefone: '34992640708', email: 'Carol_nunes10@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '.05333889619' },
  { nome: 'Ana Clara de Castro Esposte', pix: '34998416101', banco: 'inter', telefone: '34998416101', email: 'anaclara.esposte@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12307003665' },
  { nome: 'ANA JULIA ARQUAZ MEDEIROS', pix: '163.936.736-56', banco: 'PICPAY', telefone: '34996487494', email: 'juh.arquaz@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '163.936.736-56' },
  { nome: 'ANA MARIA SANTANA MARQUES', pix: '34999796266', banco: 'CAIXA', telefone: '34999796266', email: 'asantanamarques@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12962488609' },
  { nome: 'Ana Paula Di Foggi', pix: '46961386807', banco: 'Nubank', telefone: '11955698727', email: 'Foggi.anapaula@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '46961386807' },
  { nome: 'ANA VITÓRIA LOUREÇO SILVA', pix: '16107084665', banco: 'NUBANK', telefone: '34984392934', email: 'anavitorialour9@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '16107084665' },
  { nome: 'ANNA GABRYELA SAMPAIO', pix: 'sannagabryela@gmail.com', banco: 'PIK PAY', telefone: '34996616661', email: 'sannagabryela@gmail.com', tipo: 'Pessoa Jurídica', cnpjCpf: '.08225191609' },
  { nome: 'Anna Paula Alves Ribeiro', pix: 'annaaribeiiro12@gmail.com', banco: 'nubank', telefone: '34999443129', email: 'annaaribeiiro12@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '118.057.586-59' },
  { nome: 'ANTONY BORGES', pix: '70404576605', banco: 'NUBANK', telefone: '34992535217', email: 'antonyborges2005@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70404576605' },
  { nome: 'Barbara Eliane dos Santos', pix: 'barbaraeliane.s08@gmail.com', banco: 'nubank', telefone: '34991455621', email: 'barbaraeliane.s08@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '175.013.336-96' },
  { nome: 'Brenda Clarice Rodrigues Gomes', pix: '700.105.266.33', banco: 'Nubank', telefone: '47999970719', email: 'claricebrenda6@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '700.105.266.33' },
  { nome: 'BRUNA EMILIA DA COSTA TERRA', pix: '.02193438617', banco: 'INFINITE PAY', telefone: '34992829390', email: '', tipo: 'Pessoa Física', cnpjCpf: '.02193438617' },
  { nome: 'BRUNA LEAL NERNADELLI', pix: '34996828604', banco: 'nubank', telefone: '34996828604', email: 'Brunabernadelli@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '11351625659' },
  { nome: 'Bruno Giarolo', pix: 'Brunjhn@gmail.com', banco: 'Brasil', telefone: '34984375409', email: 'Brunjhn@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12828956997' },
  { nome: 'CAIO VINICIUS LOPES DE OLIVEIRA', pix: '34999485949', banco: 'ITAU', telefone: '34999485949', email: 'Caiovloliveira@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70015158106' },
  { nome: 'CAMILA FERNANDA RESENDE ALVARENGA', pix: '34999533360', banco: 'NUBANK', telefone: '34999533360', email: '', tipo: 'Pessoa Física', cnpjCpf: '' },
  { nome: 'Camila Moraes Silva', pix: '70187325650', banco: 'NUBANK', telefone: '34997684726', email: 'camila.milaby16@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70187325650' },
  { nome: 'Camila Vitória Silva Souza', pix: '34991785391', banco: 'pic pay', telefone: '34991785391', email: 'Camsiilva@icloud.com', tipo: 'Pessoa Física', cnpjCpf: '702.150.946-46' },
  { nome: 'Camilla Ramos dos Santos', pix: '084.918.946.24', banco: 'Nubank', telefone: '34992757975', email: 'Camilladossantos11@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '084.918.946.24' },
  { nome: 'CINARA LIMA DE ARAUJO', pix: '.08154871696', banco: 'NUBANCK', telefone: '34998820635', email: 'cinaralimaaraujooo@icloud.com', tipo: 'Pessoa Física', cnpjCpf: '8154871696' },
  { nome: 'constância botelho jardim', pix: '013.018.971.59', banco: 'Nubank', telefone: '34998070270', email: 'constanciajardimb@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '013.018.971.59' },
  { nome: 'Cyntia Santos Pereira', pix: '512.477.630.001.72', banco: 'C6 Banc', telefone: '34991820265', email: 'Cyntia.sp@hotmail.com', tipo: 'Pessoa Jurídica', cnpjCpf: '512.477.630.001.72' },
  { nome: 'Daniela de Oliveira Rezende', pix: 'redessociaisdaniela@gmail.com', banco: 'Nubank', telefone: '34997180180', email: 'redessociaisdaniela@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12744193617' },
  { nome: 'DANIELLY PIRES VILELA', pix: '64981756060', banco: 'NUBANK', telefone: '64981756060', email: 'Daniellyvilelap@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '.06454975177' },
  { nome: 'Debora Leal Cardoso', pix: '12459090617', banco: 'caixa', telefone: '34991369655', email: 'deboralealcardoso@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '12459090617' },
  { nome: 'DIULIA CRISTINA CARRARA', pix: 'carraradiullia@gmail.com', banco: 'NUBANK', telefone: '34991531813', email: 'carraradiullia@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70313370621' },
  { nome: 'Eduarda cerutti sergio', pix: '16471020651', banco: 'Santander', telefone: '34998920902', email: 'eduardacerutti2@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '16471020651' },
  { nome: 'Eduarda Silva', pix: '14461453600', banco: 'pagbank', telefone: '34999238187', email: 'silvaeduardag5@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '14461453600' },
  { nome: 'EMERSON DE FREITAS ARANTES', pix: '', banco: 'BANCO BRB', telefone: '', email: '', tipo: 'Pessoa Física', cnpjCpf: '' },
  { nome: 'Emilly Alanis Gonzaga Borges', pix: '14880231665', banco: 'Nubank', telefone: '34996836517', email: 'emillyalanisborges@yahoo.com', tipo: 'Pessoa Física', cnpjCpf: '14880231665' },
  { nome: 'EMY CARLA FERREIRA ALVES', pix: '70197119603', banco: 'PIC PAY', telefone: '34996710515', email: 'emykarla.1@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70197119603' },
  { nome: 'ESTER ALVES PEREIRA', pix: '70294049630', banco: 'NUBANK', telefone: '34997948987', email: 'Esteralvespereira0412@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70294049630' },
  { nome: 'Evelyn Caroliny Leal Hernandes', pix: '34991550920', banco: 'santander', telefone: '34991550920', email: 'evelynlealhernandes7@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '15749709680' },
  { nome: 'Filipe Gustavo Alves Lucindo', pix: '64996622477', banco: 'NUBANK', telefone: '64996622477', email: 'lipegus00@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '64996622477' },
  { nome: 'GABRIELA PALHARES DE FARIA', pix: 'gpalhares2014@gmail.com', banco: 'NUBANK', telefone: '34997667453', email: 'gpalhares2014@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.02142548601' },
  { nome: 'Gabriella Aparecida Rabelo de Lima', pix: '15198202673', banco: 'CAIXA', telefone: '34996468865', email: 'gabirabelolima28@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '15198202673' },
  { nome: 'Geicyliane Barboza da Silva', pix: '117.653.606-09', banco: 'NUBANK', telefone: '34998768600', email: 'Geicybarbosa8@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '117.653.606-09' },
  { nome: 'Geovanna Gabryelly Castro Dias', pix: '34991351880', banco: 'NUBANK', telefone: '34991351880', email: 'geovannacastrob8@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70265463688' },
  { nome: 'Giovanna Pereira Jacinto', pix: '34992551967', banco: 'nubank', telefone: '34992551967', email: 'giipereirapj01@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.09615014648' },
  { nome: 'Guilherme Augusto Vilela alves', pix: '34996400734', banco: 'Nubank', telefone: '34996400734', email: 'guilhermevilela.gava@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '10402078632' },
  { nome: 'Guilherme Cintra Sousa', pix: '44199243810', banco: 'NUBANK', telefone: '16994626371', email: 'guilhermecintra15@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '44199243810' },
  { nome: 'GUSTAVO CORREIA ARANTES', pix: 'GARANTES83@GMAIL.COM', banco: 'NUBANK', telefone: '34996790402', email: 'GARANTES83@GMAIL.COM', tipo: 'Pessoa Física', cnpjCpf: '708.641.541-35' },
  { nome: 'Hélica Neres da Silva', pix: '9232019639', banco: 'ITAU', telefone: '34998683702', email: 'lkneres17@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.09232019639' },
  { nome: 'HUMBERTO JUNIOR DE VRITO RODRIGUES', pix: '34999120855', banco: 'NUBANK', telefone: '34999120855', email: 'hjuniior.66@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12199046605' },
  { nome: 'IGOR JOSE NUNES QUEIROZ', pix: '11873896689', banco: 'NUBANK', telefone: '34992159070', email: 'igorjoseeng@outlook.com', tipo: 'Pessoa Física', cnpjCpf: '11873896689' },
  { nome: 'ILDA CAROLINE MARQUES E SANTIS', pix: '34992159070', banco: 'INTER', telefone: '34992159070', email: 'ilda_c_marques@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '10685879623' },
  { nome: 'IMOBILIARIA OBJETIVA', pix: '', banco: '', telefone: '', email: '', tipo: 'Pessoa Física', cnpjCpf: '' },
  { nome: 'INSS', pix: '', banco: '', telefone: '', email: '', tipo: 'Pessoa Física', cnpjCpf: '' },
  { nome: 'ISABELA CAETANO FARIA', pix: '34996402508', banco: 'NUBANK', telefone: '34996402508', email: 'caetanisa@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.019.948.396-51' },
  { nome: 'Isabella de Souza', pix: '34984172544', banco: 'nubank', telefone: '34984172544', email: 'isadsouza@icloud.com', tipo: 'Pessoa Física', cnpjCpf: '14130048651' },
  { nome: 'Isabella Duarte Nogueira', pix: 'sabelladn27@gmail.com', banco: 'itau', telefone: '34992380951', email: 'sabelladn27@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '104.497.506-71' },
  { nome: 'IZZA VITÓRIA', pix: '701.545.916-70', banco: 'INTER', telefone: '34984421061', email: 'izzavitoria123456789@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '701.545.916-70' },
  { nome: 'JANAINA RODRIGUES DE MELO', pix: '12416920685', banco: 'NUBANK', telefone: '34991574405', email: 'janaina.agro95@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '12416920685' },
  { nome: 'Jerusa do Prado Martins Pereira', pix: '14113646600', banco: 'NUBANK', telefone: '34991789864', email: 'jerusadoprado@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '14113646600' },
  { nome: 'JESSICA DANTIELLY SILVA', pix: '12882762658', banco: 'CAIXA', telefone: '34984245005', email: 'jessicadantielly@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12882762658' },
  { nome: 'JESSICA REZENDE ARAÚJO', pix: 'JESSICAARAUJO_@OUTLOOK.COM', banco: 'NUBANK', telefone: '34998950185', email: 'JESSICAARAUJO_@OUTLOOK.COM', tipo: 'Pessoa Física', cnpjCpf: '12900916682' },
  { nome: 'Johan Alves de Paula', pix: '2169203613', banco: 'bradesco', telefone: '34992534901', email: 'johan_alvescst@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '2169203613' },
  { nome: 'JONATHAN PHILIPE MARTINS DE FREITAS', pix: '34992224297', banco: 'INTER', telefone: '34992224297', email: 'Ciribellijp26@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '114.698.606-86' },
  { nome: 'JULIA MARIA ALVES', pix: 'js2206459@gmail.com', banco: 'santander', telefone: '34997412879', email: 'juliamariaalves2206@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '10358488648' },
  { nome: 'KAMILA CRISTINA VIERIA SILVA', pix: 'Kamilacvs@hotmail.com', banco: 'XP', telefone: '34991747980', email: 'Kamilacvs@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '134.612.476.00' },
  { nome: 'Kamilla Costa Assunção', pix: '135.683.556.20', banco: 'itau', telefone: '34991538247', email: 'kamilla2001costq@outlook.com.br', tipo: 'Pessoa Física', cnpjCpf: '135.683.556.20' },
  { nome: 'Karla Cristina Fonseca silva', pix: '34997957858', banco: 'NUBANK', telefone: '34997957858', email: 'joaovitor.karla@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '.09413859655' },
  { nome: 'LARISSA ALVILINO FERREIRA', pix: 'larissaalvilino@gmail.com', banco: 'NUBANK', telefone: '34992003770', email: 'larissaalvilino@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.018.496.776-70' },
  { nome: 'Larissa Fernanda Candido Dias de Sousa', pix: '019.403.446.11', banco: 'Nubank', telefone: '34992155880', email: 'Larissacandido389@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '019.403.446.11' },
  { nome: 'Leandro Alves Pugas Queiroz', pix: '125.589.146-77', banco: 'PIC PAY', telefone: '34991837374', email: 'leandroalvespq@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '125.589.146-77' },
  { nome: 'LILIAN DA SILVA ALVES', pix: '11337601632', banco: 'PIC PAY', telefone: '34992270194', email: 'lilidalves@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '11337601632' },
  { nome: 'Lorenzo Slauter Viola', pix: '34999989392', banco: 'Nubank', telefone: '34999989392', email: 'lorenzo.slauter@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.020.813.386-02' },
  { nome: 'LORRAYNE GOMES CARDOSO', pix: '34997625300', banco: 'CAIXA', telefone: '34997625300', email: 'lorraynec853@icloud.com', tipo: 'Pessoa Física', cnpjCpf: '70050649680' },
  { nome: 'Luan Fassa Fontes', pix: 'luan_fassa@hotmail.com', banco: 'Itau', telefone: '34996053323', email: 'luan_fassa@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '14549959711' },
  { nome: 'Lucas Petraglia Barroso', pix: '', banco: '', telefone: '', email: '', tipo: 'Pessoa Física', cnpjCpf: '13494159602' },
  { nome: 'LUCIANO FERREIRA DA SILVA', pix: '.03989035657', banco: 'itau', telefone: '34991710579', email: 'luciano@setmodels.com.br', tipo: 'Pessoa Física', cnpjCpf: '.03989035657' },
  { nome: 'LUIZA TIAGO RODRIGUES DA SILVA', pix: 'aluizatiago@gmail.com', banco: 'BRASIL', telefone: '34984205547', email: 'aluizatiago@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.015.497.596-63' },
  { nome: 'LUIZA VITORIA MONTEIRO', pix: 'Vitorialuiza964@gmail.com', banco: 'NUBANK', telefone: '34984399486', email: 'Vitorialuiza964@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '142860576-23' },
  { nome: 'Maíra Rosa Silva Dantas Azarias', pix: '34997685479', banco: 'Nubank', telefone: '34997685479', email: 'mairarosa978@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '106.008.376-02' },
  { nome: 'MAISA RIBEIRO PIANCA', pix: 'maisaribeiropianca@gmail.com', banco: 'NUBANK', telefone: '34998128034', email: 'maisaribeiropianca@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '526.205.868-01' },
  { nome: 'MARCUS VINICIUS MARCOMINI CRUZ', pix: '35 999088021', banco: 'nubank', telefone: '35999088021', email: 'marcominivmc@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '14468684607' },
  { nome: 'MARIA CLARA DE PAIVA BORGES', pix: '34 999388665', banco: 'NUBANK', telefone: '34 999388665', email: 'mariaclarapaiva589@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '181.908.766-27' },
  { nome: 'Maria Eduarda Medeiros da Silva', pix: '34998106528', banco: 'NUBANCK', telefone: '34998106528', email: 'contatomadumedeiros@gmail.com', tipo: 'Pessoa Jurídica', cnpjCpf: '111.167.386-19' },
  { nome: 'Maria Eduarda Silva', pix: '34997939505', banco: 'nubank', telefone: '34997939505', email: 'mariaeduardasilva2712@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '13329236663' },
  { nome: 'MARIANA CRISTINA SOUZA CARDOSO', pix: '.02195384689', banco: 'BRADESCO', telefone: '34991297282', email: 'marianaccardoso@outlook.com.br', tipo: 'Pessoa Física', cnpjCpf: '.02195384689' },
  { nome: 'MARYANA SILVA PERREIRA', pix: 'maryanasilva0507@gmail.com', banco: 'NUBANK', telefone: '34999952861', email: 'maryanasilva0507@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '11976175666' },
  { nome: 'MATEUS SILVA DE PAULA', pix: '022.084.226-43', banco: 'PIC PAY', telefone: '34996564642', email: 'mateussilvadepaula97@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '022.084.226-43' },
  { nome: 'MATHEUS DE CASTRO BORSATO', pix: '428.861.358-28', banco: 'NUBANK', telefone: '17991494504', email: 'contatoborsato@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '428.861.358-28' },
  { nome: 'Mayara Andrade Vieira', pix: '079.098.786-48', banco: 'santader', telefone: '34996482935', email: 'mayandradevieira@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '079.098.786-48' },
  { nome: 'Mayara Oliveira Romanuel Gouveia', pix: 'maayaragouveia@gmail.com', banco: 'PAG BANK', telefone: '34988534191', email: 'maayaragouveia@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '157.090.106-69' },
  { nome: 'MELISSA DOMINGOS DOS SANTOS', pix: '14120361608', banco: 'CAIXA', telefone: '34998772003', email: 'melissadomingos80@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '14120361608' },
  { nome: 'MILENA MARQUES OLIVEIRA', pix: '34998078528', banco: 'NUBANK', telefone: '34998078528', email: 'milena.marquez2015@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '129.180.466-80' },
  { nome: 'MUNIQUE MOREIRA RAMOS', pix: '70304577650', banco: 'NUBANK', telefone: '34997213102', email: 'muniquemoreira2@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70304577650' },
  { nome: 'Naraire De Sousa Brito', pix: '70591330628', banco: 'SANTANDER', telefone: '34992849126', email: 'Narairesb@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '70591330628' },
  { nome: 'NATÁLIA GOMES DE MOURA', pix: 'nataliagomesdemoura@gmail.com', banco: 'NUBANK', telefone: '34993131144', email: 'nataliagomesdemoura@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '086.828.816-08' },
  { nome: 'NATHALY VIEIRA SILVA', pix: '12911845625', banco: 'NUBANK', telefone: '34992333152', email: 'nathaaly.queen@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12911845625' },
  { nome: 'NICOLLY MEDEIROS LOPES LOPES DE PAULA', pix: '13541857650', banco: 'NUBANK', telefone: '34998684145', email: 'nicollymlpaula@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '13541857650' },
  { nome: 'ONATHAN PHILIPPE MARTINS DE FREITAS', pix: '34992224297', banco: 'INTER', telefone: '34992224297', email: 'Ciribellijp26@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '114.698.606-86' },
  { nome: 'PÂMELLA GARCIA MARTINS', pix: '34991803475', banco: 'SANTANDER', telefone: '34991803475', email: 'Pamellamartins20@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '097.215.126-56' },
  { nome: 'PAOLA GIOVANNA DOS SANTOS GUEDES', pix: '1c94fe1b-728e-463c-97a5-7ca26278fc68', banco: 'C6 BANK', telefone: '34984350799', email: 'paolagiovana01@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '161.103.026-94' },
  { nome: 'POLIANA PATRICIA DA SILVA', pix: '106.191.406-23', banco: 'itau', telefone: '(34) 99885-0077', email: 'poli.patricia@outlook.com', tipo: 'Pessoa Física', cnpjCpf: '106.191.406-23' },
  { nome: 'PREFEITURA DE UBERLÂNDIA', pix: '', banco: '', telefone: '', email: '', tipo: 'Pessoa Física', cnpjCpf: '' },
  { nome: 'REGIANE ALBANEZ SILVA', pix: '.31969201000125', banco: 'INTER', telefone: '34998307547', email: 'Regianeaalbanez@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '119.754.676-63' },
  { nome: 'RENAN RIBEIRO ALMEIDA', pix: '.02135756636', banco: 'NUBANK', telefone: '34991978287', email: 'ohrenan@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.021.357.566.36' },
  { nome: 'RITA DE CASSIA FLAUSINO SILVA', pix: '52da1e77-06b3-4136-96d2-8d42b47a2cce', banco: 'Nubank', telefone: '34984253363', email: 'rita.rc401@gmail.com.', tipo: 'Pessoa Física', cnpjCpf: '047.547.591-76' },
  { nome: 'ROBERTA SOARES MENDOÇA', pix: '12753073619', banco: 'SICOOB', telefone: '34998052254', email: 'robertamen09@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '12753073619' },
  { nome: 'RUAN MAGNANI GLOBO', pix: '34991372533', banco: 'NUBANK', telefone: '34991372533', email: 'ruanmg06@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '.06613058645' },
  { nome: 'Samilly Victoria Cristino da Costa', pix: '34998737717', banco: 'Nubank', telefone: '34998737717', email: 'samilly_ccosta@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '105.734.346-38' },
  { nome: 'TALITA CASTRO DA SILVA', pix: '34988005925', banco: 'ITAU', telefone: '3498005925', email: 'talitinha_celebridade@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '10 55 93 93 6 95' },
  { nome: 'THAMIRES CASTRO DOS SANTOS', pix: '34984191439', banco: 'SANTANDER', telefone: '34984191439', email: 'thamirescastro.santoss@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '129.666.676-05' },
  { nome: 'THAMYTA NAYARA LANDI RODRIGUES', pix: 'thamytanayara@hotmail.com', banco: 'C6 BANK', telefone: '34997924502', email: 'thamytanayara@hotmail.com', tipo: 'Pessoa Física', cnpjCpf: '.09936552628' },
  { nome: 'THAYNARA DIAS ANDRADE', pix: '148926586-42', banco: 'CAIXA', telefone: '34999673069', email: 'euthayandrade@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '14892658642' },
  { nome: 'Thaynara Gama', pix: '34992445151', banco: 'caixa', telefone: '34992445151', email: 'thaynara@wglog.com.br', tipo: 'Pessoa Física', cnpjCpf: '095.937.436-18' },
  { nome: 'Thiago Eli Batista suzigan', pix: '12399651685', banco: 'Bradesco', telefone: '34992062188', email: 'thiagosuzigan99@icloud.com', tipo: 'Pessoa Física', cnpjCpf: '12399651685' },
  { nome: 'THOMAZ PARANHOS SANTOS', pix: '129.078.296-29', banco: 'C6 BANK', telefone: '34991874605', email: 'thomazparanhos@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '129.078.296-29' },
  { nome: 'VITÓRIA GONÇALVES SHUTZ', pix: '11753336627', banco: 'NUBANK', telefone: '34991692168', email: 'claravitoria2808@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '11753336627' },
  { nome: 'YASMIN CUNHA DE BRITO', pix: '11716412650', banco: 'CAIXA', telefone: '34999746772', email: 'yasmincunha0707@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '11716412650' },
  { nome: 'Yasmin Karoline Ramos Silva', pix: '34999419251', banco: 'branco do brasil', telefone: '34999419251', email: 'yasmin.karoliners@gmail.com', tipo: 'Pessoa Física', cnpjCpf: '13696006661' },
  { nome: 'vanessa souza totoli', pix: '16982249362', banco: 'nubank', telefone: '16982249362', email: 'vanessatotoli@yahoo.com', tipo: 'Pessoa fisica', cnpjCpf: '41887181881' },
  { nome: 'Marianne nunes lamonier', pix: '.01860896600', banco: 'nubank', telefone: '34984412869', email: 'mariannelamonier22@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '.01860896600' },
  { nome: 'Vitória Beatriz alves Silva', pix: '705.760.746-67', banco: 'itau', telefone: '34997407538', email: 'Vitoriajesuscristo25@gmail.com', tipo: 'pessoa fisica', cnpjCpf: '705.760.746-67' },
  { nome: 'Rafaela Batista Burger', pix: '34991897555', banco: 'nubank', telefone: '34991897555', email: 'rafaelaburger@outlook.com', tipo: 'Pessoa fisica', cnpjCpf: '.02323309641' },
  { nome: 'Hemilly Rhafaella dos Santos', pix: '70275137651', banco: 'nubank', telefone: '34993384274', email: 'Hemillyrhafaella123@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '70275137651' },
  { nome: 'Pryscilla Moreira de Carvalho Borges', pix: '34998760120', banco: 'ton', telefone: '34998760120', email: 'pryscillaborges93@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '16991246638' },
  { nome: 'Jessica Coutinho Anchieta', pix: '34998959935', banco: 'santader', telefone: '34998959935', email: 'Coutinhojess@outlook.com', tipo: 'Pessoa fisica', cnpjCpf: '.09970554646' },
  { nome: 'Jessica Miranda Alves Ferreira', pix: '133.585.266-23', banco: 'nubank', telefone: '34999771127', email: 'jessimaf8@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '133.585.266-23' },
  { nome: 'Maria Clara Goulart Zanuto', pix: '.03140793197', banco: 'santader', telefone: '64993305221', email: 'mariacgzanuto17@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '.03140793197' },
  { nome: 'Júlia Milena Rodrigues de Andrade', pix: 'Juliaandrademodelo@gmail.com', banco: 'nubank', telefone: '34999191205', email: 'jumilena18@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '70782104410' },
  { nome: 'Michely Duarte Silva', pix: '085.663.186-84', banco: 'santader', telefone: '34992865948', email: 'michelysilvaduarte@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '085.663.186-84' },
  { nome: 'Rafaella dos Anjos Pereira', pix: '(34) 99860-5277', banco: 'santader', telefone: '(34) 99860-5277', email: 'ellah.apt@gmail.com', tipo: 'Pessoa fisica', cnpjCpf: '128.876.976-84' }
];

// Normalize tipo field to match enum values
function normalizeTipo(tipo) {
  if (!tipo) return 'Pessoa Fisica';
  const normalized = tipo.trim();
  if (normalized.toLowerCase().includes('jurídica') || normalized.toLowerCase().includes('juridica')) {
    return 'Pessoa Juridica';
  }
  return 'Pessoa Fisica';
}

// Clean and prepare data
function prepareColaboradores(data) {
  return data.map((item, index) => ({
    codigo: String(index + 1).padStart(4, '0'),
    nome: item.nome.trim(),
    pix: item.pix?.trim() || '',
    banco: item.banco?.trim() || '',
    telefone: item.telefone?.trim() || '',
    email: item.email?.trim() || '',
    tipo: normalizeTipo(item.tipo),
    cnpjCpf: item.cnpjCpf?.trim() || ''
  }));
}

async function migrateColaboradores() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 Connection string: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//<credentials>@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Delete all existing colaboradores
    console.log('\n🗑️  Deleting existing colaboradores...');
    const deleteResult = await Colaborador.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} colaboradores`);

    // Step 2: Prepare new data
    console.log('\n📝 Preparing new colaboradores data...');
    const colaboradores = prepareColaboradores(rawData);
    console.log(`✅ Prepared ${colaboradores.length} colaboradores`);

    // Step 3: Insert new data
    console.log('\n💾 Inserting new colaboradores...');
    const insertResult = await Colaborador.insertMany(colaboradores);
    console.log(`✅ Inserted ${insertResult.length} colaboradores`);

    // Step 4: Verify the data
    console.log('\n🔍 Verifying data...');
    const count = await Colaborador.countDocuments();
    console.log(`✅ Total colaboradores in database: ${count}`);

    // Show sample records
    console.log('\n📊 Sample records:');
    const samples = await Colaborador.find().limit(5);
    samples.forEach((col, idx) => {
      console.log(`\n${idx + 1}. ${col.nome}`);
      console.log(`   Código: ${col.codigo}`);
      console.log(`   Email: ${col.email}`);
      console.log(`   Tipo: ${col.tipo}`);
      console.log(`   PIX: ${col.pix}`);
      console.log(`   Banco: ${col.banco}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateColaboradores();
