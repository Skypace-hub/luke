#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_PORTS=(27099 3001 8081 8082 19000 19001 19002)
MODE="dev"
DETACHED=false
NATIVE_PROFILE=""

cd "$ROOT_DIR"

parse_args() {
	local mode_set=false

	for arg in "$@"; do
		case "$arg" in
			-d | --detach | --detached)
				DETACHED=true
				;;
			-h | --help | help)
				MODE="help"
				mode_set=true
				;;
			dev | web | native-dev-client | ios-dev-client-build | native-check | native-doctor | native-prebuild | native-build | native-build-ios | native-build-android | native-submit | native-submit-ios | native-submit-android | testflight | testflight-build | testflight-submit)
				if [[ "$mode_set" == true && "$arg" == "testflight" ]]; then
					NATIVE_PROFILE="$arg"
				elif [[ "$mode_set" == true ]]; then
					echo "Unexpected extra mode argument: $arg"
					print_usage
					exit 1
				else
					MODE="$arg"
					mode_set=true
				fi
				;;
			development | production)
				if [[ "$mode_set" == false ]]; then
					echo "Profile requires a native mode: $arg"
					print_usage
					exit 1
				fi

				NATIVE_PROFILE="$arg"
				;;
			*)
				echo "Unknown argument: $arg"
				print_usage
				exit 1
				;;
		esac
	done
}

run_detached() {
	local log_dir="$ROOT_DIR/logs"
	local pid_dir="$ROOT_DIR/tmp"
	local log_file="$log_dir/restart-${MODE}.log"
	local pid_file="$pid_dir/restart-${MODE}.pid"

	mkdir -p "$log_dir" "$pid_dir"

	echo "Starting luke (${MODE}) in background..."
	echo "Log: $log_file"
	echo "PID: $pid_file"

	if [[ -n "$NATIVE_PROFILE" ]]; then
		nohup "$0" "$MODE" "$NATIVE_PROFILE" >"$log_file" 2>&1 &
	else
		nohup "$0" "$MODE" >"$log_file" 2>&1 &
	fi

	echo "$!" >"$pid_file"
}

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

list_listening_pids_on_port() {
	local port="$1"
	local pids=""

	if command_exists lsof; then
		pids="$(lsof -nP -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
	fi

	if [[ -z "$pids" ]] && command_exists fuser; then
		pids="$(fuser "${port}/tcp" 2>/dev/null || true)"
	fi

	if [[ -n "$pids" ]]; then
		printf "%s\n" $pids | sort -u
	fi
}

port_is_listening() {
	local port="$1"

	if [[ -n "$(list_listening_pids_on_port "$port")" ]]; then
		return 0
	fi

	if command_exists ss && [[ -n "$(ss -H -ltn "sport = :${port}" 2>/dev/null || true)" ]]; then
		return 0
	fi

	if command_exists lsof && [[ -n "$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)" ]]; then
		return 0
	fi

	return 1
}

stop_processes_on_ports() {
	for port in "${DEV_PORTS[@]}"; do
		local pids
		pids="$(list_listening_pids_on_port "$port")"

		if [[ -n "$pids" ]]; then
			echo "Stopping processes on port ${port}: ${pids}"
			kill $pids || true
		fi
	done
}

wait_for_ports_to_clear() {
	for port in "${DEV_PORTS[@]}"; do
		for _ in {1..10}; do
			if ! port_is_listening "$port"; then
				break
			fi

			sleep 0.5
		done
	done
}

force_stop_processes_on_ports() {
	for port in "${DEV_PORTS[@]}"; do
		local pids
		pids="$(list_listening_pids_on_port "$port")"

		if [[ -n "$pids" ]]; then
			echo "Force stopping processes on port ${port}: ${pids}"
			kill -9 $pids || true
		fi
	done
}

ensure_ports_are_clear() {
	for port in "${DEV_PORTS[@]}"; do
		if port_is_listening "$port"; then
			local pids
			pids="$(list_listening_pids_on_port "$port")"

			echo "Port ${port} is still in use after cleanup."

			if [[ -n "$pids" ]]; then
				echo "Remaining listening process IDs: ${pids}"
			fi

			echo "Run these on the server to inspect and clear it:"
			echo "  sudo lsof -nP -iTCP:${port} -sTCP:LISTEN"
			echo "  sudo fuser -k ${port}/tcp"
			exit 1
		fi
	done
}

clear_dev_ports() {
	echo "Clearing development ports..."
	stop_processes_on_ports
	wait_for_ports_to_clear
	force_stop_processes_on_ports
	wait_for_ports_to_clear
	ensure_ports_are_clear
}

is_macos() {
	[[ "$(uname -s)" == "Darwin" ]]
}

print_usage() {
	cat <<'USAGE'
用法:
  ./restart.sh
      默认开发流程。先尝试构建/安装 iOS development client，然后重启数据库和所有开发服务。

  ./restart.sh -d
      默认开发流程的后台模式。日志写入 logs/restart-dev.log，PID 写入 tmp/restart-dev.pid。

  ./restart.sh dev
      和默认命令一样。适合日常开发时一键重启全部服务。

  ./restart.sh dev -d
      后台运行 dev 模式。

本地开发:
  ./restart.sh web
      只重启数据库和 Web 开发服务，端口 27099。适合云服务器上只预览网页时使用。

  ./restart.sh web -d
      后台运行 Web 开发服务。日志写入 logs/restart-web.log，PID 写入 tmp/restart-web.pid。

  ./restart.sh native-dev-client
      只启动 Expo dev client server，端口 8082。适合手机上已经安装 development client，只需要连接 Metro 时使用。

  ./restart.sh ios-dev-client-build
      只构建并安装 iOS development client，不启动全部 Web/DB 开发服务。

检查与同步:
  ./restart.sh native-check
      本地检查 Native 项目。会跑 TypeScript 类型检查，并解析 Expo config。不会访问 EAS，不会真正构建。

  ./restart.sh native-doctor
      跑 Expo Doctor。用于检查 Expo 依赖版本和配置问题。这个命令可能需要访问 npm registry。

  ./restart.sh native-prebuild
      重新同步 ios/ 和 android/ 原生工程。改过 app.json 里的 ios/android/plugin 原生字段后，需要跑这个。

EAS 云构建:
  ./restart.sh native-build-ios
      用 EAS 构建 iOS，默认 profile 是 production。

  ./restart.sh native-build-android
      用 EAS 构建 Android，默认 profile 是 production。

  ./restart.sh native-build
      依次构建 iOS 和 Android，默认 profile 是 production。

EAS 提交商店:
  ./restart.sh native-submit-ios
      提交最新的 iOS EAS build。默认 profile 是 production。

  ./restart.sh native-submit-android
      提交最新的 Android EAS build。默认 profile 是 production。

  ./restart.sh native-submit
      依次提交最新的 iOS 和 Android EAS build。默认 profile 是 production。

指定 EAS profile:
  ./restart.sh native-build-ios testflight
      用 testflight profile 构建 iOS。

  ./restart.sh native-build-android production
      用 production profile 构建 Android。

  ./restart.sh native-submit-ios testflight
      用 testflight profile 提交最新 iOS build。

旧 TestFlight 快捷命令:
  ./restart.sh testflight
      旧的引导式 TestFlight 构建/签名/提交流程。

  ./restart.sh testflight-build
      只用 EAS 构建 iOS TestFlight 包。

  ./restart.sh testflight-submit
      只提交最新的 EAS iOS build 到 TestFlight。

注意:
  - EAS 构建/提交需要先登录 Expo 账号。
  - iOS 提交 TestFlight 需要 Apple Developer 账号。
  - Android 本地运行需要 JDK 17 和 Android SDK；EAS 云构建不依赖本机 Android SDK。
  - 当前包名还是 com.anonymous.luke，正式上架前建议换成你的真实 Bundle ID / Android package。
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

run_native_script() {
	"$ROOT_DIR/scripts/native.sh" "$@"
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

start_web_dev_server() {
	echo "Starting web development server..."
	npm run dev:web
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

	if ! is_macos; then
		echo "Skipping iOS development client build because local iOS builds require macOS."
		echo "Use ./restart.sh native-build-ios to build iOS with EAS cloud builds."
		return
	fi

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

parse_args "$@"

if [[ "$DETACHED" == true ]]; then
	run_detached
	exit 0
fi

case "$MODE" in
	-h | --help | help)
		print_usage
		exit 0
		;;
	dev | web | native-dev-client | ios-dev-client-build | native-check | native-doctor | native-prebuild | native-build | native-build-ios | native-build-android | native-submit | native-submit-ios | native-submit-android | testflight | testflight-build | testflight-submit)
		;;
	*)
		echo "Unknown mode: $MODE"
		print_usage
		exit 1
		;;
esac

case "$MODE" in
	native-check)
		run_native_script check
		exit 0
		;;
	native-doctor)
		run_native_script doctor
		exit 0
		;;
	native-prebuild)
		run_native_script prebuild
		exit 0
		;;
	native-build)
		run_native_script build all "${NATIVE_PROFILE:-production}"
		exit 0
		;;
	native-build-ios)
		run_native_script build ios "${NATIVE_PROFILE:-production}"
		exit 0
		;;
	native-build-android)
		run_native_script build android "${NATIVE_PROFILE:-production}"
		exit 0
		;;
	native-submit)
		run_native_script submit all "${NATIVE_PROFILE:-production}"
		exit 0
		;;
	native-submit-ios)
		run_native_script submit ios "${NATIVE_PROFILE:-production}"
		exit 0
		;;
	native-submit-android)
		run_native_script submit android "${NATIVE_PROFILE:-production}"
		exit 0
		;;
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

clear_dev_ports

start_database

case "$MODE" in
	dev)
		build_ios_dev_client
		start_dev_servers
		;;
	web)
		start_web_dev_server
		;;
	native-dev-client)
		start_native_dev_client_server
		;;
	ios-dev-client-build)
		build_ios_dev_client
		;;
esac
