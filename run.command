#!/bin/bash

# Se placer dans le dossier du script
cd "$(dirname "$0")"

echo "=================================================="
echo "🚀 Lancement de HOPLA sur le port 3006..."
echo "=================================================="

# Cleanup: avoid Next.js dev lock issues if a previous dev server is still running
kill -9 $(lsof -tiTCP:3000 -sTCP:LISTEN) 2>/dev/null
kill -9 $(lsof -tiTCP:3006 -sTCP:LISTEN) 2>/dev/null
rm -f .next/dev/lock

# Ouvrir Safari après 3 secondes (en arrière-plan pour ne pas bloquer)
(sleep 3 && open -a Safari "http://localhost:3006") &

# Lancer le serveur Next.js sur le port 3006
npm run dev -- -p 3006
