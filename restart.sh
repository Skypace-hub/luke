#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_PORTS=(3001 8081 19000 19001 19002)

cd "$ROOT_DIR"

stop_processes_on_ports() {
	for port in "${DEV_PORTS[@]}"; do
		local pids
		pids="$(lsof -ti "tcp:${port}" || true)"

		if [[ -n "$pids" ]]; then
			echo "Stopping processes on port ${port}: ${pids}"
			kill $pids || true
		fi
	done
}

wait_for_ports_to_clear() {
	for port in "${DEV_PORTS[@]}"; do
		for _ in {1..10}; do
			if ! lsof -ti "tcp:${port}" >/dev/null; then
				break
			fi

			sleep 0.5
		done
	done
}

echo "Restarting luke..."

echo "Stopping database..."
npm run db:stop

echo "Clearing development ports..."
stop_processes_on_ports
wait_for_ports_to_clear

echo "Starting database..."
npm run db:start

echo "Starting development servers..."
npm run dev
