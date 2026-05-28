#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_PORTS=(3001 8081 8082 19000 19001 19002)
MODE="${1:-dev}"

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

print_usage() {
	cat <<'USAGE'
Usage:
  ./restart.sh                      Build iOS dev client, then restart all dev servers
  ./restart.sh dev                  Same as default
  ./restart.sh native-dev-client    Start Expo dev client server for iPhone
  ./restart.sh ios-dev-client-build Build/install the iOS development client
  ./restart.sh testflight           Guided TestFlight build/sign/submit flow
  ./restart.sh testflight-build     Build an iOS TestFlight archive with EAS
  ./restart.sh testflight-submit    Submit the latest EAS iOS build to TestFlight

iPhone development build flow:
  1. Run: ./restart.sh
  2. Open the installed dev client app on the iPhone

Note: native-dev-client requires expo-dev-client in apps/native/package.json.
Note: TestFlight requires a paid Apple Developer account and an Expo account.
USAGE
}

ensure_native_dev_client_dependency() {
	if ! grep -q '"expo-dev-client"' "$ROOT_DIR/apps/native/package.json"; then
		echo "expo-dev-client is not installed for apps/native."
		echo "Install it first:"
		echo "  cd apps/native && npx expo install expo-dev-client"
		exit 1
	fi
}

warn_testflight_bundle_identifier() {
	local app_bundle_file="$ROOT_DIR/apps/native/app.json"
	local native_project_file="$ROOT_DIR/apps/native/ios/luke.xcodeproj/project.pbxproj"

	if [[ -f "$native_project_file" ]] && grep -q "PRODUCT_BUNDLE_IDENTIFIER = com.anonymous.luke;" "$native_project_file"; then
		echo "Warning: apps/native/ios still uses com.anonymous.luke."
		echo "For TestFlight, change PRODUCT_BUNDLE_IDENTIFIER in the native Xcode project to a unique Apple bundle identifier."
		echo "Because apps/native/ios exists, EAS ignores ios.bundleIdentifier in app.json."
		echo "Example: com.yourcompany.luke"
		echo
		return
	fi

	if grep -q '"bundleIdentifier": "com.anonymous.luke"' "$app_bundle_file"; then
		echo "Warning: apps/native/app.json still uses com.anonymous.luke."
		echo "For TestFlight, use a unique Apple bundle identifier that belongs to your Apple Developer account."
		echo "Example: com.yourcompany.luke"
		echo
	fi
}

start_database() {
	echo "Starting database..."
	npm run db:start
}

stop_database() {
	echo "Stopping database..."
	npm run db:stop
}

start_dev_servers() {
	echo "Starting all development servers..."
	npm run dev
}

start_native_dev_client_server() {
	ensure_native_dev_client_dependency
	echo "Starting Expo dev client server on port 8082..."
	(
		cd "$ROOT_DIR/apps/native"
		npx expo start --dev-client --clear --port 8082
	)
}

build_ios_dev_client() {
	ensure_native_dev_client_dependency
	echo "Building and installing iOS development client..."

	set +e
	(
		cd "$ROOT_DIR/apps/native"
		npx expo run:ios --device --no-bundler --port 8082
	)
	local build_status="$?"
	set -e

	if [[ "$build_status" -eq 0 ]]; then
		return
	fi

	echo
	echo "iOS development client command exited with status ${build_status}."
	echo "Continuing to start the dev servers. If the log above showed Complete 100%, unlock the iPhone and open luke manually."
}

run_testflight_flow() {
	warn_testflight_bundle_identifier
	echo "Starting guided TestFlight build/sign/submit flow..."
	(
		cd "$ROOT_DIR/apps/native"
		npx testflight
	)
}

build_testflight() {
	warn_testflight_bundle_identifier
	echo "Building iOS TestFlight archive with EAS..."
	(
		cd "$ROOT_DIR/apps/native"
		npx eas-cli build --platform ios --profile testflight
	)
}

submit_testflight_latest() {
	warn_testflight_bundle_identifier
	echo "Submitting latest EAS iOS build to TestFlight..."
	(
		cd "$ROOT_DIR/apps/native"
		npx eas-cli submit --platform ios --profile testflight --latest
	)
}

case "$MODE" in
	-h | --help | help)
		print_usage
		exit 0
		;;
	dev | native-dev-client | ios-dev-client-build | testflight | testflight-build | testflight-submit)
		;;
	*)
		echo "Unknown mode: $MODE"
		print_usage
		exit 1
		;;
esac

case "$MODE" in
	testflight)
		run_testflight_flow
		exit 0
		;;
	testflight-build)
		build_testflight
		exit 0
		;;
	testflight-submit)
		submit_testflight_latest
		exit 0
		;;
esac

echo "Restarting luke (${MODE})..."

stop_database

echo "Clearing development ports..."
stop_processes_on_ports
wait_for_ports_to_clear

start_database

case "$MODE" in
	dev)
		build_ios_dev_client
		start_dev_servers
		;;
	native-dev-client)
		start_native_dev_client_server
		;;
	ios-dev-client-build)
		build_ios_dev_client
		;;
esac
