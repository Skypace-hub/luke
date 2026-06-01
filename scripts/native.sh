#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NATIVE_DIR="$ROOT_DIR/apps/native"
JDK17_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
DEFAULT_ANDROID_HOME="$HOME/Library/Android/sdk"

print_usage() {
	cat <<'USAGE'
用法:
  ./scripts/native.sh dev
      启动 Expo dev server。

  ./scripts/native.sh ios
      本地运行 iOS。等同于在 apps/native 里执行 npm run ios。

  ./scripts/native.sh android
      本地运行 Android。会尽量自动设置 Homebrew JDK 17 和默认 Android SDK 路径。

  ./scripts/native.sh prebuild
      同步 ios/ 和 android/ 原生工程。

  ./scripts/native.sh check
      跑 TypeScript 类型检查，并解析 Expo config。不会构建。

  ./scripts/native.sh doctor
      跑 Expo Doctor。可能需要网络访问 npm registry。

  ./scripts/native.sh build ios [profile]
      用 EAS 构建 iOS。

  ./scripts/native.sh build android [profile]
      用 EAS 构建 Android。

  ./scripts/native.sh build all [profile]
      依次用 EAS 构建 iOS 和 Android。

  ./scripts/native.sh submit ios [profile]
      提交最新的 iOS EAS build。

  ./scripts/native.sh submit android [profile]
      提交最新的 Android EAS build。

  ./scripts/native.sh submit all [profile]
      依次提交最新的 iOS 和 Android EAS build。

Profile:
  development
      内部分发/开发构建。

  testflight
      iOS TestFlight 构建或提交。

  production
      正式发布构建或提交。build 和 submit 默认都用这个 profile。
USAGE
}

ensure_native_dir() {
	if [[ ! -d "$NATIVE_DIR" ]]; then
		echo "Native app directory not found: $NATIVE_DIR"
		exit 1
	fi
}

setup_android_env() {
	if [[ -z "${JAVA_HOME:-}" && -d "$JDK17_HOME" ]]; then
		export JAVA_HOME="$JDK17_HOME"
	fi

	if [[ -z "${ANDROID_HOME:-}" && -d "$DEFAULT_ANDROID_HOME" ]]; then
		export ANDROID_HOME="$DEFAULT_ANDROID_HOME"
	fi
}

warn_android_env() {
	if [[ -z "${JAVA_HOME:-}" ]]; then
		echo "Warning: JAVA_HOME is not set. Android builds should use JDK 17."
		echo "Install with: brew install openjdk@17"
	fi

	if [[ -z "${ANDROID_HOME:-}" ]]; then
		echo "Warning: ANDROID_HOME is not set. Local Android runs need the Android SDK."
		echo "Common path: $DEFAULT_ANDROID_HOME"
	fi
}

run_in_native() {
	(
		cd "$NATIVE_DIR"
		"$@"
	)
}

run_eas_build() {
	local platform="$1"
	local profile="$2"

	echo "Running EAS build: platform=${platform}, profile=${profile}"
	run_in_native npm exec -- eas-cli build --platform "$platform" --profile "$profile"
}

run_eas_submit() {
	local platform="$1"
	local profile="$2"

	echo "Submitting latest EAS build: platform=${platform}, profile=${profile}"
	run_in_native npm exec -- eas-cli submit --platform "$platform" --profile "$profile" --latest
}

main() {
	ensure_native_dir

	local command="${1:-help}"
	shift || true

	case "$command" in
		-h | --help | help)
			print_usage
			;;
		dev)
			run_in_native npm run dev
			;;
		ios)
			run_in_native npm run ios
			;;
		android)
			setup_android_env
			warn_android_env
			run_in_native npm run android
			;;
		prebuild)
			run_in_native npm run prebuild
			;;
		check)
			run_in_native npm run check-types
			run_in_native npm exec -- expo config --type public
			;;
		doctor)
			run_in_native npm exec -- expo-doctor
			;;
		build)
			local platform="${1:-all}"
			local profile="${2:-production}"

			case "$platform" in
				ios | android)
					run_eas_build "$platform" "$profile"
					;;
				all)
					run_eas_build ios "$profile"
					run_eas_build android "$profile"
					;;
				*)
					echo "Unknown build platform: $platform"
					print_usage
					exit 1
					;;
			esac
			;;
		submit)
			local platform="${1:-all}"
			local profile="${2:-production}"

			case "$platform" in
				ios | android)
					run_eas_submit "$platform" "$profile"
					;;
				all)
					run_eas_submit ios "$profile"
					run_eas_submit android "$profile"
					;;
				*)
					echo "Unknown submit platform: $platform"
					print_usage
					exit 1
					;;
			esac
			;;
		*)
			echo "Unknown command: $command"
			print_usage
			exit 1
			;;
	esac
}

main "$@"
