#!/bin/bash
set -e

# Start the Node.js MCP server with TypeScript compiled code
exec node dist/index.js "$@"