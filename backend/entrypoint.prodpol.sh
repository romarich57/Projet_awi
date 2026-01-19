#!/bin/sh
# // Role : Script d'entrée pour le backend prodpol
# // Démarre le serveur puis exécute le seed après un délai

set -e

echo "🚀 Démarrage du serveur backend..."

# Démarrer le serveur en arrière-plan
node dist/server.js &
SERVER_PID=$!

# Attendre que le serveur soit prêt (les migrations s'exécutent au démarrage)
echo "⏳ Attente de 10 secondes pour les migrations..."
sleep 10

# Exécuter le seed
echo "🌱 Exécution du seed UC-R4..."
node dist/db/seed-uc-r4.js || echo "⚠️  Seed déjà exécuté ou erreur (non bloquant)"

# Ramener le serveur au premier plan
echo "✅ Seed terminé, serveur en cours d'exécution..."
wait $SERVER_PID
