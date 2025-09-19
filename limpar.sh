#!/bin/bash

# Este script limpa processos e arquivos de lock de servidores Xorg/Xvfb.

echo "🧹 Encerrando todos os processos Xorg e Xvfb..."

# Encerra qualquer processo Xorg ou Xvfb que esteja rodando.
# O '2>/dev/null' esconde mensagens de erro caso nenhum processo seja encontrado.
sudo killall Xorg 2>/dev/null
sudo killall Xvfb 2>/dev/null

echo "🗑️ Removendo arquivos de lock antigos..."

# Remove os arquivos de lock de qualquer display (ex: .X1-lock, .X2-lock, etc.)
sudo rm -f /tmp/.X*-lock

# Remove e recria o diretório de sockets com as permissões corretas
sudo rm -rf /tmp/.X11-unix
sudo mkdir /tmp/.X11-unix
sudo chmod 1777 /tmp/.X11-unix

echo "✅ Ambiente limpo!"
