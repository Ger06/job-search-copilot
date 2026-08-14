#!/bin/bash
# Lee el input del hook (JSON) desde stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"[^,]*' | head -1)

# Solo actuar si el comando es un git commit
if echo "$COMMAND" | grep -q "git commit"; then
  echo "Verificando que los tests pasen antes de commitear..." >&2
  npm run test --silent
  if [ $? -ne 0 ]; then
    echo "BLOQUEADO: hay tests fallando. No se puede commitear así." >&2
    exit 2
  fi
fi

exit 0