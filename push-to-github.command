#!/bin/bash
# Double-click this file to commit and push minilearn-teams-web to GitHub
cd "$(dirname "$0")"

echo "minilearn-teams-web — commit & push"
echo "====================================="

# Remove stale lock if present
rm -f .git/index.lock 2>/dev/null && echo "Lock eliminado"

# Stage ALL changes
git add -A 2>&1

# Check if there's anything to commit
if git diff --cached --quiet; then
    echo ""
    echo "Nada nuevo para commitear."
else
    echo ""
    echo "Commiteando cambios..."
    git commit -m "config: set real Google OAuth Client ID in main.js

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
fi

# Push
echo ""
echo "Pushing a GitHub..."
git push origin main

echo ""
if [ $? -eq 0 ]; then
    echo "Push exitoso!"
else
    echo "Error en el push. Revisa tus credenciales de GitHub."
fi

echo ""
echo "Presiona Enter para cerrar..."
read
