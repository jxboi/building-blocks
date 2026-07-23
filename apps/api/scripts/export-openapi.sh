#!/usr/bin/env bash
# Exports the API's OpenAPI document — the source of truth for the frontend typed
# client — to apps/web/openapi/v1.json. Run after changing any endpoint contract;
# CI runs it too and fails if the checked-in document drifts.
set -euo pipefail

API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${API_DIR}/../web/openapi/v1.json"
HOST_DLL="${API_DIR}/src/Host/bin/Debug/net8.0/BuildingBlocks.Host.dll"

cd "${API_DIR}"
dotnet build src/Host/Host.csproj -c Debug --nologo -v quiet
dotnet tool restore >/dev/null
dotnet swagger tofile --output "${OUT}" "${HOST_DLL}" v1

echo "OpenAPI document written to ${OUT}"
