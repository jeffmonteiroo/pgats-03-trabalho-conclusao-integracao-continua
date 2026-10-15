# Pagamentos / Lab · Portfólio de QA

Pequena aplicação React para registrar **contas fictícias**, exercitar regras de negócio e demonstrar testes unitários, de componentes e E2E com integração contínua.

> **Origem acadêmica:** este repositório começou como o trabalho de conclusão da disciplina **Integração Contínua para Automação de Testes**, da pós-graduação em Automação de Testes de Software (PGATS). A evolução de portfólio preserva os cinco testes Mocha originais, as evidências acadêmicas e o histórico do Git. Não representa um sistema de produção, experiência profissional ou integração bancária.

## O que experimentar

1. Preencha uma referência, uma empresa fictícia e um valor.
2. Registre a simulação e confira a categoria.
3. Consulte o último registro e recarregue a página para verificar a persistência.
4. Tente um valor inválido e corrija-o sem perder os campos.

**Nenhum pagamento é feito.** O app não transmite os registros a um servidor. Use apenas dados sintéticos, nunca informações reais de contas ou clientes.

### Regras explícitas

- Referência: texto obrigatório, de 1 a 80 caracteres após remover espaços nas extremidades. O nome `codigoBarras` é mantido no domínio por compatibilidade com o exercício; **não é validado como boleto bancário**.
- Empresa: texto obrigatório, de 1 a 100 caracteres após remover espaços nas extremidades.
- Valor: número finito, positivo, de **R$ 0,01 a R$ 999.999,99**, representável em centavos, sem arredondamento silencioso de entradas com precisão extra.
- Formulário: aceita vírgula ou ponto decimal, até duas casas, sem separador de milhares; não aceita notação exponencial nem texto misturado.
- **R$ 99,99 → padrão; R$ 100,00 → padrão; R$ 100,01 → cara.** O limite de R$ 100 é inclusivo para a categoria padrão.
- A consulta retorna `undefined` quando não há registro. Entradas inválidas não alteram o último registro.

## Executar localmente

Requisitos: **Node.js 22.12+ (linha 22 LTS)** ou Node.js 24, npm e os [pré-requisitos de sistema do Cypress](https://docs.cypress.io/app/get-started/install-cypress#System-requirements). `.nvmrc` seleciona Node 22. A CI usa essa linha.

```bash
nvm use                 # opcional, se você utiliza nvm
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173`. Para conferir o build de produção:

```bash
npm run build
npm run preview
```

Abra `http://127.0.0.1:4173`. As portas são fixas; encerre outro processo que já as esteja utilizando. O Cypress baixa um executável na instalação, portanto requer acesso ao servidor de distribuição. Se o gerenciador bloquear scripts de instalação, execute `npx cypress install` conforme a [documentação oficial](https://docs.cypress.io/app/get-started/install-cypress).

## Estratégia de testes

A classificação de um teste depende do **escopo**, não do nome da ferramenta.

| Camada | O que verifica | Comando |
| --- | --- | --- |
| Unitários com Mocha | Domínio, fronteiras, inválidos, conversão e adaptador de armazenamento com fake em memória; inclui os cinco casos originais | `npm test` |
| Relatório Mocha | Mesma suíte, com HTML e JSON Mochawesome | `npm run test:report` |
| Unitários no Cypress | Importam funções/classes e as chamam diretamente, **sem `cy.visit` e sem `cy.mount`** | `npm run test:cypress:unit` |
| Componentes no Cypress | Montam React com `cy.mount`: mensagens de erro e atributos ARIA, foco, correção, teclado, envio repetido, falha ao salvar e recuperação de JSON corrompido | `npm run test:component` |
| E2E no Cypress | Dois fluxos no app completo servido localmente: registrar/consultar/recarregar; rejeitar valor inválido/corrigir para R$ 100 em viewport móvel | `npm run test:e2e` |
| Todos | Mocha com relatório, unitários Cypress, componentes e E2E com build | `npm run test:all` |

O script `test:cypress:unit` usa `--e2e` com `cypress.unit.config.js` para iniciar o runner sem servidor de componentes. Os testes continuam unitários: importam o domínio e não abrem a aplicação. Os casos de fronteira também aparecem no Mocha para exercitar a mesma regra no Node e no navegador.

`npm run test:e2e` constrói a aplicação, inicia o preview, aguarda a URL ficar disponível e encerra o servidor ao finalizar. Não é necessário iniciar o servidor manualmente. Para exploração interativa, use `npm run cypress:open`; para E2E, deixe `npm run preview` ativo após o build.

Não há espera fixa (`cy.wait(tempo)`), dependência de sites públicos, serviços bancários ou Cypress Cloud. Cada fluxo E2E começa limpando apenas a chave de armazenamento deste app. As tentativas automáticas estão desativadas para não esconder instabilidade.

## Organização e decisões

```text
src/
  servicoDePagamento.js          domínio puro e serviço com repositório opcional
  repositorioLocal.js            adaptador localStorage versionado
  valorDoFormulario.js           conversão explícita do texto monetário
  components/FormularioPagamento.jsx
  App.jsx                       composição da interface e do serviço
  styles.css
 test/                          suíte Mocha original e novos unitários
 cypress/unit/                  funções/classes sem UI
 cypress/component/             montagem React isolada
 cypress/e2e/                   fluxos reais no navegador local
 .github/workflows/ci.yml
```

- **Domínio separado de React:** as regras não dependem de DOM nem de armazenamento do navegador.
- **Persistência injetada:** testes unitários usam um fake, sem monkey patch global. Apenas o último registro é persistido em `pgats.pagamentos.ultimo.v1`.
- **Estado consistente:** a memória só é alterada depois que a escrita termina. Se `setItem` falhar, o app mantém o resultado anterior e os campos para nova tentativa.
- **Leitura defensiva:** o JSON salvo é revalidado e sua categoria é recalculada. Um registro ilegível não é apagado na abertura; a interface avisa que o próximo registro válido o substituirá.
- **Acessibilidade básica:** rótulos associados, erros com `aria-describedby`, alerta, foco no primeiro campo inválido e envio pelo teclado. Isso não equivale a uma auditoria completa de acessibilidade.
- **Execução local:** React + Vite, sem backend ou autenticação. Os testes Mocha não dependem de navegador; componentes e E2E precisam do Cypress.

## Integração contínua e evidências

O workflow roda em `pull_request` para `main`, push em `main`, acionamento manual e no agendamento acadêmico preservado (00:00 UTC, 21:00 em Brasília). Os jobs independentes são:

1. **Unitários Mocha e build**.
2. **Cypress / unitarios**.
3. **Cypress / componentes**.
4. **Cypress / e2e**.

Usa `npm ci`, lockfile versionado, cache do npm/binário Cypress, permissão de repositório somente leitura, timeout e cancelamento de execuções antigas da mesma referência. Não usa segredos nem faz deploy.

Mesmo após falhas, publica os artefatos disponíveis por sete dias:

- `mocha-<execução>`: relatório HTML/JSON do Mochawesome.
- `cypress-<camada>-<execução>`: resultados JUnit XML e, quando produzidos, vídeos e screenshots. O E2E captura o registro persistido e a correção em viewport móvel; falhas também geram screenshots.

Consulte [Actions](https://github.com/jeffmonteiroo/pgats-03-trabalho-conclusao-integracao-continua/actions) e os checks do PR para o **resultado real do commit que você está revisando**. Ter testes escritos não significa que passaram. Este README não declara percentual de cobertura, taxa de sucesso ou ganhos de produtividade não medidos.

### Evidências da versão acadêmica original

As imagens abaixo documentam a versão original com Mocha. **Não são evidências das novas suites Cypress.** Os arquivos foram preservados sem alteração.

- [Testes locais originais](evidencias/01-testes-locais.png)
- [Relatório Mochawesome original](evidencias/02-relatorio-mochawesome.png)
- [Pipeline por push e artefato](evidencias/03-pipeline-push-e-artefato.png)
- [Pipeline manual](evidencias/04-pipeline-manual.png)
- [Pipeline agendada](evidencias/05-pipeline-agendada.png)

## Limitações conhecidas

- Aplicação demonstrativa. Não processa pagamentos, não verifica boletos reais e não consulta APIs.
- `localStorage` não é um cofre. Limpar dados do navegador remove o registro; não há sincronização entre dispositivos, histórico persistente completo ou atualização em tempo real entre abas.
- Se o navegador negar acesso ao armazenamento, a interface informa a limitação. Uma escrita recusada não é apresentada como sucesso.
- Os valores são representados como números JavaScript validados em centavos. Este exercício não implementa cálculos financeiros, múltiplas moedas ou um ledger contábil.
- Não há matriz cross-browser, teste de desempenho, auditoria completa de acessibilidade nem instrumentação de cobertura. Viewport móvel não equivale a dispositivo real.
- Testes de componentes e E2E precisam do executável Cypress e das bibliotecas do sistema. A instalação/execução pode ser limitada em ambientes restritos; verifique os logs, sem inferir aprovação.

## Checklist de revisão humana

- [ ] Ler o domínio e explicar por que R$ 100,00 ainda é padrão.
- [ ] Executar os comandos de cada camada e localizar os relatórios.
- [ ] Confirmar que os cinco testes originais continuam preservados.
- [ ] Demonstrar um erro no formulário, corrigir e recarregar o registro.
- [ ] Explicar a diferença entre unitário no runner Cypress e montagem de componente.
- [ ] Inspecionar o diff e os checks do commit atual; registrar comentários reais no PR.
- [ ] Revisar responsividade e teclado; não declarar acessibilidade completa.
- [ ] Manter a origem acadêmica e os limites do projeto claros na apresentação.

Não há revisores, aprovações ou resultados simulados. O PR fica em rascunho até uma revisão real.
