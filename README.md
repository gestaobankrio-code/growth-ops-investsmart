# Growth Ops InvestSmart

Painel operacional em GitHub Pages para gestão de plataformas, licenças, acessos, tracking, landing pages, 2FA, pendências e documentação.

## Página inicial

Depois de ativar o GitHub Pages:

```txt
https://gestaobankrio-code.github.io/growth-ops-investsmart/
```

## Fonte oficial

A fonte oficial dos registros é:

```txt
data/registros.json
```

O painel não salva alterações diretamente no navegador como fonte oficial. Toda criação, atualização, validação, reprovação, arquivamento ou exclusão abre uma Issue estruturada no GitHub. O workflow `Processar Growth Ops` lê a Issue, atualiza os JSONs, gera documentação, exportações e fecha a Issue.

## Segurança

Não registre senhas, tokens, chaves de API, códigos 2FA, recovery codes, número completo de telefone, prints de código, dados pessoais de leads ou informações financeiras sensíveis.

## Fluxo

1. Abrir o painel.
2. Clicar em `Novo registro` ou em uma ação da tabela.
3. Confirmar a Issue no GitHub.
4. Aguardar o GitHub Actions processar.
5. Atualizar o painel.

