#!/usr/bin/env zx

// Fetch remote released versions
const response_releases = await fetch(`https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=iOS`)
if (!response_releases.ok) {
  await $`echo '❗️ Failed to fetch releases' 1>&2`
  process.exit(1)
}

const releases = await response_releases.json()
const released_versions = [...new Set(releases.map((release) => release["milestone"]))]

// Detect latest built WebRTC version

await $`git fetch --all`
const branches = await $`git for-each-ref --format='%(refname)' refs/remotes/origin`
const tags = await $`git for-each-ref --format='%(refname)' refs/tags`
const refs = [...branches.lines(), ...tags.lines()]

let latest_built_version = null
for (const ref of refs) {
  const version = await $`git cat-file -p ${ref}:version.json | jq -r ".version.webrtc_version"`
  latest_built_version = latest_built_version != null ? Math.max(latest_built_version, version) : version
}
if (latest_built_version == null) {
  await $`echo '❗️ Failed to detect latest built version' 1>&2`
  process.exit(1)
}

// Look for the next WebRTC build version

const next_build_version = released_versions.reduce((acc, cur) => {
  if (cur > latest_built_version) {
    return acc != null ? Math.min(acc, cur) : cur
  } else {
    return acc
  }
}, null)

if (next_build_version != null) {
  echo`${next_build_version}`
}
