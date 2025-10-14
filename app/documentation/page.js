"use client";
import { useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg);
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 2px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: var(--space-sm);
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
`;

const SidebarWrapper = styled.div`
  flex-shrink: 0;
  width: 250px;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: var(--space-md);
  }
`;

const Sidebar = styled.nav`
  position: fixed;
  width: 250px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: var(--space-md);
  
  @media (max-width: 768px) {
    position: static;
    width: 100%;
    max-height: none;
    overflow-y: visible;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: var(--space-sm);
`;

const SidebarLink = styled.a`
  display: block;
  padding: var(--space-xs) var(--space-sm);
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all 0.2s;
  background: ${props => props.$active ? '#eff6ff' : 'transparent'};
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    background: #eff6ff;
    color: #3b82f6;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-top: var(--space-xl);
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid #e5e7eb;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-top: var(--space-lg);
    margin-bottom: var(--space-md);
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4b5563;
    margin-top: var(--space-md);
    margin-bottom: var(--space-sm);
  }
  
  p {
    color: #374151;
    line-height: 1.75;
    margin-bottom: var(--space-md);
  }
  
  ul, ol {
    margin-bottom: var(--space-md);
    padding-left: var(--space-lg);
  }
  
  li {
    color: #374151;
    line-height: 1.75;
    margin-bottom: var(--space-xs);
  }
  
  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
    color: #dc2626;
  }
  
  pre {
    background: #1f2937;
    color: #f9fafb;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin-bottom: var(--space-md);
    
    code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
  }
  
  blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: var(--space-md);
    margin: var(--space-md) 0;
    color: #6b7280;
    font-style: italic;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space-md);
  }
  
  th, td {
    border: 1px solid #e5e7eb;
    padding: var(--space-sm);
    text-align: left;
  }
  
  th {
    background: #f9fafb;
    font-weight: 600;
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    margin: var(--space-md) 0;
  }
  
  strong {
    font-weight: 600;
    color: #111827;
  }
  
  em {
    font-style: italic;
  }
  
  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: var(--space-lg) 0;
  }
`;

const DOCUMENTATION = `
# Documentação do Sistema Ana

Guia completo de administração e uso do sistema.

---

# 📊 Dashboard

O Dashboard é a página inicial do sistema, onde você visualiza um resumo geral das operações.

## Como Usar

1. **Acesse o Dashboard** clicando no logo "Sistema Ana" ou navegando para a página inicial
2. Use os **filtros** no topo para personalizar a visualização:
   - **Cliente**: Filtre dados de um cliente específico
   - **Data Inicial**: Defina a data de início do período
   - **Data Final**: Defina a data de término do período
3. Use os **Atalhos** para períodos comuns:
   - **Hoje**: Apenas o dia atual
   - **Esta Semana**: Últimos 7 dias
   - **Este Mês**: Mês atual completo
   - **Este Ano**: Ano atual completo

## KPIs Principais

O Dashboard exibe 6 indicadores principais:

### Clientes
- Número total de clientes únicos no período selecionado
- Baseado nas ações e contas a receber

### Colaboradores
- Número total de colaboradores cadastrados no sistema
- Conta todos os colaboradores ativos

### Ações
- Total de ações/projetos criadas no período
- Inclui todas as ações vinculadas aos filtros

### Lucro Previsto
- **Fórmula**: Receita Prevista - Custos Previstos
- Mostra o lucro esperado antes do recebimento/pagamento

### Receita Prevista
- Soma de todas as contas a receber no período
- Inclui valores de todas as parcelas previstas

### Receita Recebida
- Soma apenas das contas recebidas (status "RECEBIDO")
- Mostra quanto já foi efetivamente recebido

## Gráficos

### Receita e Custos por Mês
Gráfico de linha mostrando a evolução mensal de:
- **Receita Prevista** (linha azul)
- **Receita Recebida** (linha verde)
- **Custos** (linha vermelha)

### Lucro por Mês
Gráfico de barras mostrando:
- **Lucro Previsto** (barras azuis)
- **Lucro Real** (barras verdes)

### Receita por Cliente
Gráfico de pizza mostrando a distribuição percentual da receita entre os clientes principais.

---

# 👥 Clientes

Gerenciamento completo de clientes do sistema.

## Como Visualizar

1. Acesse **"Clientes"** no menu superior
2. Visualize a lista de todos os clientes cadastrados
3. Use a **barra de busca** para encontrar clientes por nome ou e-mail
4. Use o **filtro de status** para ver apenas clientes ativos ou inativos

## Como Criar um Cliente

1. Clique no botão **"+ Novo Cliente"**
2. Preencha o formulário:
   - **Nome**: Nome completo do cliente (obrigatório)
   - **E-mail**: E-mail de contato (obrigatório)
   - **Telefone**: Número de telefone (opcional)
   - **Empresa**: Nome da empresa (opcional)
   - **Status**: ATIVO ou INATIVO
3. Clique em **"Salvar"**

## Como Editar um Cliente

1. Na lista de clientes, clique no nome do cliente
2. Você será levado à página de detalhes
3. Clique no botão **"Editar"**
4. Modifique os campos desejados
5. Clique em **"Salvar"**

## Como Excluir um Cliente

1. Na lista de clientes, clique no ícone de **lixeira** (🗑️)
2. Confirme a exclusão no modal
3. **⚠️ Atenção**: A exclusão é permanente e removerá todos os dados relacionados

## Página de Detalhes

Ao clicar em um cliente, você vê:
- Informações completas do cliente
- Lista de ações vinculadas ao cliente
- Histórico de contas a receber
- Estatísticas de receita

---

# 👷 Colaboradores

Gerenciamento de colaboradores/equipe.

## Como Visualizar

1. Acesse **"Colaboradores"** no menu superior
2. Visualize todos os colaboradores cadastrados
3. Use a **busca** para encontrar por nome ou e-mail
4. Use o **filtro de status** (ATIVO/INATIVO)

## Como Criar um Colaborador

1. Clique em **"+ Novo Colaborador"**
2. Preencha o formulário:
   - **Nome**: Nome completo (obrigatório)
   - **E-mail**: E-mail (obrigatório)
   - **Telefone**: Número de contato (opcional)
   - **Cargo**: Função/cargo (opcional)
   - **Status**: ATIVO ou INATIVO
3. Clique em **"Salvar"**

## Como Editar um Colaborador

1. Clique no colaborador na lista
2. Na página de detalhes, clique em **"Editar"**
3. Modifique os campos
4. Salve as alterações

## Como Excluir um Colaborador

1. Clique no ícone de lixeira na lista
2. Confirme a exclusão
3. **⚠️ Atenção**: Verifique se não há contas a pagar vinculadas

## Página de Detalhes

Mostra:
- Informações do colaborador
- Contas a pagar vinculadas
- Histórico de pagamentos
- Total de valores pagos

---

# 🎯 Ações

Gerenciamento de ações/projetos do sistema.

## Como Visualizar

1. Acesse **"Ações"** no menu
2. Veja todas as ações cadastradas
3. Use os filtros:
   - **Busca por nome**
   - **Filtro por cliente**
   - **Filtro por status**
   - **Filtro por data**

## Como Criar uma Ação

1. Clique em **"+ Nova Ação"**
2. Preencha:
   - **Nome**: Nome da ação/projeto (obrigatório)
   - **Cliente**: Selecione o cliente (obrigatório)
   - **Descrição**: Descrição detalhada (opcional)
   - **Data**: Data da ação (obrigatório)
   - **Status**: Status atual (ABERTO, EM_ANDAMENTO, CONCLUÍDO)
   - **Valor**: Valor da ação (opcional)
3. Clique em **"Salvar"**

## Como Editar uma Ação

1. Clique na ação na lista ou no ícone de edição
2. Modifique os campos necessários
3. Salve as alterações

## Como Excluir uma Ação

1. Clique no ícone de lixeira
2. Confirme a exclusão
3. **⚠️ Atenção**: Isso afetará contas a receber e a pagar vinculadas

## Vincular Custos

Ao criar uma ação, você pode adicionar custos:
1. Na tela de criação/edição de ação
2. Clique em **"Adicionar Custo"**
3. Preencha:
   - **Descrição**: Descrição do custo
   - **Valor**: Valor do custo
   - **Colaborador**: Quem receberá (opcional)
   - **Vencimento**: Data de vencimento
   - **Status**: ABERTO ou PAGO
4. Custos são automaticamente criados como "Contas a Pagar"

---

# 💰 Contas a Receber

Gerenciamento de valores a receber de clientes.

## Como Visualizar

1. Acesse **"Contas a Receber"** no menu
2. Veja todas as contas (parcelas)
3. Use os filtros:
   - **Busca**: Por cliente ou descrição
   - **Status**: ABERTO, RECEBIDO, VENCIDO, CANCELADO
   - **Período**: Data inicial e final
   - **Cliente**: Filtro por cliente específico

## Sistema de Parcelas

O sistema suporta pagamento parcelado:
- Cada parcela aparece como uma linha separada na tabela
- Cada parcela tem seu próprio status
- Você pode marcar parcelas individuais como recebidas

## Como Criar Conta a Receber

1. Clique em **"+ Nova Conta"**
2. Escolha o tipo:
   - **Pagamento Único**: Apenas uma parcela
   - **Parcelado**: Dividir em múltiplas parcelas

### Pagamento Único
1. Preencha:
   - **Cliente**: Selecione o cliente
   - **Ação**: Selecione a ação relacionada (opcional)
   - **Valor**: Valor total
   - **Data de Vencimento**: Quando deve ser recebido
   - **Descrição**: Descrição do pagamento (opcional)
   - **Status**: ABERTO ou RECEBIDO
2. Clique em **"Salvar"**

### Pagamento Parcelado
1. Selecione **"Parcelado"**
2. Preencha:
   - **Cliente** e **Ação**
   - **Valor Total**: Valor que será dividido
   - **Número de Parcelas**: Quantas parcelas (2-36)
   - **Data do Primeiro Vencimento**: Vencimento da 1ª parcela
   - **Descrição**: Descrição base
3. O sistema automaticamente:
   - Divide o valor igualmente
   - Cria as parcelas com vencimentos mensais
   - Numera as parcelas (1/12, 2/12, etc.)

## Como Marcar como Recebido

1. Localize a conta/parcela na lista
2. Clique no ícone de **check** (✓) ou edite a conta
3. Altere o status para **"RECEBIDO"**
4. Opcionalmente, atualize a **Data de Recebimento**
5. Salve

## Como Editar

1. Clique no ícone de edição (✏️)
2. Modifique os campos
3. Para parcelas, você pode:
   - Alterar o valor individual
   - Mudar o status
   - Atualizar a data de vencimento
4. Salve as alterações

## Como Excluir

1. Clique no ícone de lixeira (🗑️)
2. Confirme a exclusão
3. **⚠️ Atenção**: Para contas parceladas, você pode excluir parcelas individualmente

## Relatório de Conta

Você pode gerar um PDF da conta:
1. Clique no nome do cliente na lista
2. Na página de detalhes, clique em **"Gerar Relatório"**
3. O PDF será gerado com todas as parcelas e status

---

# 💸 Contas a Pagar

Gerenciamento de despesas e pagamentos a colaboradores.

## Como Visualizar

1. Acesse **"Contas a Pagar"** no menu
2. Veja todas as despesas
3. Use os filtros:
   - **Busca**: Por descrição
   - **Status**: ABERTO, PAGO, VENCIDO
   - **Período**: Filtro por data
   - **Colaborador**: Filtro por beneficiário

## Tipos de Contas a Pagar

### 1. Contas Vinculadas a Ações
- Criadas automaticamente ao adicionar custos em ações
- Vinculadas a um projeto/ação específico
- Podem ser pagas individualmente

### 2. Contas Fixas Recorrentes
- Despesas que se repetem mensalmente
- Configuradas uma vez, geradas automaticamente
- Exemplos: aluguel, internet, salários

## Como Criar Conta a Pagar (Manual)

1. Clique em **"+ Nova Conta"**
2. Preencha:
   - **Descrição**: Descrição da despesa
   - **Valor**: Valor a pagar
   - **Ação**: Vincular a uma ação (opcional)
   - **Colaborador**: Quem receberá (opcional)
   - **Data de Vencimento**: Quando deve ser pago
   - **Status**: ABERTO ou PAGO
3. Clique em **"Salvar"**

## Como Criar Conta Fixa Recorrente

1. Clique em **"+ Nova Conta Fixa"**
2. Preencha:
   - **Descrição**: Nome da despesa recorrente
   - **Valor**: Valor mensal
   - **Colaborador**: Beneficiário (opcional)
   - **Dia de Vencimento**: Dia do mês (1-31)
   - **Status**: ATIVO ou INATIVO
3. A conta será criada automaticamente todo mês

## Como Marcar como Pago

1. Localize a conta na lista
2. Clique no ícone de check (✓)
3. Ou edite e mude o status para **"PAGO"**
4. Atualize a **Data de Pagamento** se necessário
5. Salve

## Como Editar

1. Clique no ícone de edição (✏️)
2. Modifique os campos necessários
3. **⚠️ Atenção**: Ao editar contas vinculadas a ações, o valor da ação será atualizado
4. Salve as alterações

## Como Excluir

1. Clique no ícone de lixeira (🗑️)
2. Confirme a exclusão
3. Para contas fixas, você pode:
   - Desativar (para de gerar novas)
   - Excluir completamente

## Gestão de Contas Fixas

Para gerenciar contas fixas recorrentes:
1. Na página de Contas a Pagar
2. Clique em **"Gerenciar Contas Fixas"**
3. Veja todas as contas fixas cadastradas
4. Edite ou exclua conforme necessário
5. Ative/desative contas fixas

---

# 🔄 Fluxo de Trabalho Recomendado

## 1. Configuração Inicial

1. **Cadastre Clientes**
   - Adicione todos os clientes com quem trabalha
   - Configure status (ATIVO/INATIVO)
   - Atualize informações de contato

2. **Cadastre Colaboradores**
   - Adicione membros da equipe
   - Configure cargos e informações
   - Defina status

3. **Configure Contas Fixas**
   - Adicione despesas recorrentes
   - Configure dia de vencimento
   - Ative as contas

## 2. Novo Projeto/Ação

1. **Crie a Ação**
   - Defina nome e descrição
   - Vincule ao cliente
   - Defina data e status

2. **Adicione Custos**
   - Adicione custos previstos
   - Vincule colaboradores
   - Defina vencimentos

3. **Crie Contas a Receber**
   - Defina valor total
   - Configure parcelamento se necessário
   - Defina vencimentos

## 3. Gestão Diária

1. **Verifique o Dashboard**
   - Analise KPIs
   - Identifique ações necessárias
   - Acompanhe metas

2. **Atualize Status**
   - Marque contas recebidas
   - Marque contas pagas
   - Atualize status de ações

3. **Analise Relatórios**
   - Verifique lucro real vs previsto
   - Identifique contas vencidas
   - Acompanhe receita por cliente

## 4. Fechamento Mensal

1. **Reconcilie Contas**
   - Verifique todas as contas recebidas
   - Confirme todos os pagamentos
   - Atualize status pendentes

2. **Analise Performance**
   - Compare lucro real vs previsto
   - Analise receita por cliente
   - Identifique oportunidades

3. **Planeje Próximo Mês**
   - Verifique vencimentos futuros
   - Planeje ações
   - Ajuste contas fixas se necessário

---

# 💡 Dicas e Boas Práticas

## Organização

- ✅ **Nomeie ações claramente**: Use nomes descritivos para facilitar busca
- ✅ **Mantenha clientes atualizados**: Atualize status e informações regularmente
- ✅ **Use descrições**: Adicione descrições detalhadas em contas e ações
- ✅ **Configure contas fixas**: Automatize despesas recorrentes

## Financeiro

- ✅ **Parcele quando necessário**: Use parcelamento para facilitar recebimento
- ✅ **Acompanhe vencimentos**: Fique atento a contas vencidas
- ✅ **Atualize status rapidamente**: Marque como pago/recebido assim que ocorrer
- ✅ **Use filtros do dashboard**: Acompanhe períodos específicos

## Eficiência

- ✅ **Use busca**: Encontre registros rapidamente pela busca
- ✅ **Use atalhos de data**: Aproveite os atalhos (Hoje, Esta Semana, etc.)
- ✅ **Gere relatórios**: Use relatórios PDF para compartilhar com clientes
- ✅ **Filtre por cliente**: Foque em clientes específicos quando necessário

## Manutenção

- ✅ **Revise contas fixas mensalmente**: Verifique se ainda são necessárias
- ✅ **Limpe contas antigas**: Exclua ou marque como canceladas contas não mais relevantes
- ✅ **Atualize colaboradores**: Mantenha lista de colaboradores atualizada
- ✅ **Faça backup**: Exporte dados importantes regularmente

---

# ❓ Perguntas Frequentes

## Como alterar o status de múltiplas contas de uma vez?
Atualmente, você precisa editar cada conta individualmente. Para agilizar, use filtros para isolar as contas desejadas.

## Posso editar uma parcela específica sem afetar as outras?
Sim! Cada parcela é independente e pode ser editada, marcada como recebida ou excluída separadamente.

## O que acontece se eu excluir um cliente com contas vinculadas?
O sistema impedirá a exclusão se houver contas ativas. Você deve primeiro cancelar/excluir as contas relacionadas.

## Como rastreio contas vencidas?
Use o filtro de status "VENCIDO" em Contas a Receber ou Contas a Pagar. O sistema marca automaticamente contas vencidas.

## Posso ter ações sem cliente vinculado?
Não, toda ação deve ter um cliente associado. Se necessário, crie um cliente genérico (ex: "Interno").

## Como funciona o cálculo de lucro?
- **Lucro Previsto** = Receita Prevista - Custos Previstos
- **Lucro Real** = Receita Recebida - Custos Pagos

## Posso alterar o número de parcelas após criar?
Não diretamente. Você precisaria excluir e recriar, ou adicionar/remover parcelas manualmente.

## Contas fixas são criadas automaticamente?
Sim! Contas fixas ativas geram automaticamente uma nova conta a pagar todo mês no dia especificado.

---

# 🔐 Segurança e Permissões

## Login e Autenticação

- Todos os usuários devem fazer login
- Sessões expiram após 30 dias de inatividade
- Senhas devem ser fortes e únicas

## Permissões

Atualmente, todos os usuários logados têm acesso completo. Em versões futuras, haverá níveis de permissão:
- **Admin**: Acesso total
- **Gerente**: Visualização e edição
- **Usuário**: Apenas visualização

## Proteção de Dados

- Todos os dados são armazenados com segurança
- Comunicação criptografada (HTTPS)
- Backup regular recomendado

---

# 📞 Suporte

Se você encontrar problemas ou tiver dúvidas:

1. **Verifique esta documentação** primeiro
2. **Tente usar a busca** para encontrar informações
3. **Entre em contato com o suporte** se o problema persistir

**Lembre-se**: Esta documentação é seu guia completo. Consulte-a sempre que tiver dúvidas!

---

_Última atualização: Outubro 2025_
`;

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const sections = [
    { id: 'dashboard', title: '📊 Dashboard' },
    { id: 'clientes', title: '👥 Clientes' },
    { id: 'colaboradores', title: '👷 Colaboradores' },
    { id: 'acoes', title: '🎯 Ações' },
    { id: 'contas-receber', title: '💰 Contas a Receber' },
    { id: 'contas-pagar', title: '💸 Contas a Pagar' },
    { id: 'fluxo', title: '🔄 Fluxo de Trabalho' },
    { id: 'dicas', title: '💡 Dicas' },
    { id: 'faq', title: '❓ FAQ' },
    { id: 'seguranca', title: '🔐 Segurança' },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Custom components for ReactMarkdown to add IDs to headings
  const components = {
    h1: ({ children, ...props }) => {
      const text = children?.toString() || '';
      // Map heading text to section IDs
      const idMap = {
        '📊 Dashboard': 'dashboard',
        '👥 Clientes': 'clientes',
        '👷 Colaboradores': 'colaboradores',
        '🎯 Ações': 'acoes',
        '💰 Contas a Receber': 'contas-receber',
        '💸 Contas a Pagar': 'contas-pagar',
        '🔄 Fluxo de Trabalho Recomendado': 'fluxo',
        '💡 Dicas e Boas Práticas': 'dicas',
        '❓ Perguntas Frequentes': 'faq',
        '🔐 Segurança e Permissões': 'seguranca',
      };
      const id = idMap[text];
      return <h1 id={id} {...props}>{children}</h1>;
    }
  };

  return (
    <Container>
      <Header>
        <Title>📚 Documentação</Title>
        <Subtitle>Guia completo de administração do Sistema Ana</Subtitle>
      </Header>

      <ContentWrapper>
        <SidebarWrapper>
          <Sidebar>
            <SidebarTitle>Navegação</SidebarTitle>
            {sections.map(section => (
              <SidebarLink
                key={section.id}
                href={`#${section.id}`}
                $active={activeSection === section.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick(section.id);
                }}
              >
                {section.title}
              </SidebarLink>
            ))}
          </Sidebar>
        </SidebarWrapper>

        <Content>
          <ReactMarkdown components={components}>{DOCUMENTATION}</ReactMarkdown>
        </Content>
      </ContentWrapper>
    </Container>
  );
}
