#!/bin/bash
# Writes env-config.js from .env, letting environment variables of the same
# name override the defaults in .env. Run at container start so one build can
# be pointed at any backend. Only public values belong here.
set -euo pipefail

out=./env-config.js
{
  echo "window._env_ = {"
  while read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]] || continue
    varname="${line%%=*}"
    varvalue="${line#*=}"
    value="${!varname:-$varvalue}"
    # escape for a double-quoted JS string
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    echo "  $varname: \"$value\","
  done < .env
  echo "}"
} > "$out"
