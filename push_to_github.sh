#!/bin/bash
# Envia as mudancas para o GitHub automaticamente
git add -A
git diff --cached --quiet && echo "Nada novo para enviar." && exit 0
git commit -m "${1:-Atualizacao automatica}"
git push https://dezinhotraveso-png:${GITHUB_TOKEN}@github.com/dezinhotraveso-png/site.git main
echo "Enviado para o GitHub com sucesso!"
