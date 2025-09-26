#!/usr/bin/env zx

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

// Fetch release date for the next version

const next_build_version = latest_built_version + 1

const response_release = await fetch(`https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=${next_build_version}`)
if (!response_release.ok) {
  await $`echo '❗️ Failed to fetch release date of ${next_build_version}' 1>&2`
  process.exit(1)
}

const release = await response_release.json()
const stable_date = new Date(release["mstones"][0]["stable_date"])

// Output next build version if it was after the release date

const now = new Date()
if (stable_date < now) {
  echo`${next_build_version}`
}
