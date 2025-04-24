#!/usr/bin/env zx

// Disable depot_tools auto update.
// see: https://chromium.googlesource.com/chromium/tools/depot_tools
$.env.DEPOT_TOOLS_UPDATE = 0

const cwd = await $`echo -n $(pwd)`

// Parse Arguments

const argv = minimist(process.argv.slice(2), {
  alias: {
    v: 'version',
    n: 'number',
  }
})

const webrtc_version = argv.version
const build_number = argv.number

if (!Number.isInteger(webrtc_version)) {
  echo`❗️ Invalid WebRTC version (${webrtc_version}). use --version option.`
  process.exit(1)
}
if (!Number.isInteger(build_number)) {
  echo`❗️ Invalid build number (${build_number}). use --number option.`
  process.exit(1)
}

// Get the branch_head number from WebRTC version

echo`⏳ Checking branch_head number...`

const response_milestones = await fetch(`https://chromiumdash.appspot.com/fetch_milestones?mstone=${webrtc_version}`)
if (!response_milestones.ok) {
  echo`❗️ Failed to fetch milestone (${webrtc_version})`
  process.exit(1)
}

const milestone = await response_milestones.json()
const branch_head_number = Number(milestone[0].webrtc_branch)

echo`✅ Use branch_head/${branch_head_number}.`

// Prepare source code

if (fs.existsSync('src') && fs.lstatSync('src').isDirectory()) {
  // Execute git reset
  echo `⏳ Executing git reset command...`

  cd('src')
  $`git reset --hard`
  $`git clean -df`
  cd('..')

  echo`✅ Use existing src/ directory.`
} else {
  // Execute fetch command
  echo `⏳ Executing fetch command...`

  await spinner(() => $`fetch --nohooks webrtc_ios`)

  echo`✅ Complete fetch command.`
}

// Checkout branch_head

echo`⏳ Checkout branch_heads/${branch_head_number}...`

cd('src')

await $`git fetch --all`
await $`git checkout branch-heads/${branch_head_number}`

cd('..')

echo`✅ Checkout branch_heads/${branch_head_number} succeeded.`

// Apply patches

echo`⏳ Applying patches...`

const patch_dir = `${__dirname}/../patches`
const patch_paths = [
  `${patch_dir}/disable_audio_input_interface.patch`
]

for (const patch_path of patch_paths) {
  await $`patch -p1 --no-backup-if-mismatch -i ${patch_path} -d src`
}

echo`✅ Patch application finished.`

// Execute gclient command

echo`⏳ Executing gclient sync command...`

await spinner(() => $`gclient sync`)

echo`✅ Complete gclient sync command.`

// Make output directories

const output_dir = `${cwd}/build`

fs.ensureDirSync(output_dir)
fs.ensureDirSync(`${output_dir}/x64_simulator`)
fs.ensureDirSync(`${output_dir}/arm64_simulator`)
fs.ensureDirSync(`${output_dir}/arm64_x64_simulator`)
fs.ensureDirSync(`${output_dir}/arm64_device`)

// Build Frameworks

cd('src')

const base_args = [
  'is_debug=false',
  'rtc_libvpx_build_vp9=false',
  'is_component_build=false',
  'rtc_include_tests=false',
  'rtc_enable_objc_symbol_export=true',
  'enable_stripping=true',
  'enable_dsyms=false',
  'use_lld=true',
  'rtc_ios_use_opengl_rendering=true',
  'target_os="ios"',
  'ios_deployment_target="12.0"',
  'ios_enable_code_signing=false',
]

echo`⏳ Building x64 simulator...`
const x64_simulator_args = [
  ...base_args,
  'target_cpu="x64"',
  'target_environment="simulator"',
]
await $`gn gen ${output_dir}/x64_simulator --args=${x64_simulator_args.join(' ')}`
await $`ninja -C ${output_dir}/x64_simulator framework_objc`

echo`⏳ Building arm64 simulator...`
const arm64_simulator_args = [
  ...base_args,
  'target_cpu="arm64"',
  'target_environment="simulator"',
]
await $`gn gen ${output_dir}/arm64_simulator --args=${arm64_simulator_args.join(' ')}`
await $`ninja -C ${output_dir}/arm64_simulator framework_objc`

echo`⏳ Building arm64 device...`
const arm64_device_args = [
  ...base_args,
  'target_cpu="arm64"',
  'target_environment="device"',
]
await $`gn gen ${output_dir}/arm64_device --args=${arm64_device_args.join(' ')}`
await $`ninja -C ${output_dir}/arm64_device framework_objc`

cd('..')

echo`✅ Build finished.`

// Assemble xcframework file

echo`⏳ Creating a universal binary for simulator...`

await $`cp -R ${output_dir}/arm64_simulator/WebRTC.framework ${output_dir}/arm64_x64_simulator/`

const simulator_binary_paths = [
  `${output_dir}/arm64_simulator/WebRTC.framework/WebRTC`,
  `${output_dir}/x64_simulator/WebRTC.framework/WebRTC`,
]
await $`lipo -create ${simulator_binary_paths} -output ${output_dir}/arm64_x64_simulator/WebRTC.framework/WebRTC`

echo`⏳ Creating a xcframework...`

const device_framework_path = `${output_dir}/arm64_device/WebRTC.framework`
const simulator_framework_path = `${output_dir}/arm64_x64_simulator/WebRTC.framework`
const xcframework_path = `${output_dir}/WebRTC.xcframework`

await $`rm -rf ${xcframework_path}`
await $`xcodebuild -create-xcframework -framework ${device_framework_path} -framework ${simulator_framework_path} -output ${xcframework_path}`

echo`⏳ Bundle LICENSE files...`

await $`cp src/LICENSE ${output_dir}/WebRTC.xcframework/ios-arm64/WebRTC.framework/`
await $`cp src/LICENSE ${output_dir}/WebRTC.xcframework/ios-arm64_x86_64-simulator/WebRTC.framework/`

echo`✅ WebRTC.xcframework generated.`

echo`⏳ Generating version.json file...`

cd('src')

const webrtc_commit_hash = (await $`git rev-parse HEAD`).stdout.trim()

const git_log = await $`git log -n 1 --pretty=fuller`
const regex =new RegExp(`Cr-Commit-Position: refs/branch-heads/${branch_head_number}@{#(?<commit_position>\\d+)}`)
const commit_position = Number(regex.exec(git_log)?.groups?.commit_position)

cd('..')

const version_json = {
  "version": {
    "full": `${webrtc_version}.${commit_position}.${build_number}`,
    "webrtc_version": webrtc_version,
    "branch_head_number": branch_head_number,
    "commit_position": commit_position,
    "build_number": build_number
  },
  "webrtc_commit_hash": webrtc_commit_hash,
  "patches": [
    "disable_audio_input_interface.patch"
  ]
}

fs.writeFileSync(`${output_dir}/version.json`, JSON.stringify(version_json, null, 2))

echo`✅ Generated version.json.`