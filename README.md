WebRTC iOS Build
===

Unofficial distribution of `WebRTC.xcframework` for iOS target.

This build depends on [the official WebRTC source code](https://webrtc.googlesource.com/src/) and applies some patches.

## Requirements

- iOS 12.0+
- Installed manually or using Swift Package Manager

## Patches

see [patches/README.md](./patches/README.md)

## Versioning

```
(WebRTC Version).(Commit Position).(Build Number)
```

- WebRTC Version
  - WebRTC version used in build
  - Remove leading `M` and use it as a number
- Commit Position
  - [Cr-Commit-Position: refs/branch-heads/6834@{Here is commit position}](https://webrtc.googlesource.com/src/+/afaf497805cbb502da89991c2dcd783201efdd08)
- Build Number
  - Number of releases within the same of WebRTC version and Commit Position

## Installation
### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/SafiePublic/safie-webrtc-ios-build.git", branch: "main")
]
```

### Manual

1. Clone this repository
1. Checkout a tag for release version you needed
1. Copy `WebRTC.xcframework` and embed it in your project

## Alternatives

- [WebRTC Binaries for iOS and macOS (stasel/WebRTC)](https://github.com/stasel/WebRTC)
- [WebRTC-Build (shiguredo-webrtc-build/webrtc-build)](https://github.com/shiguredo-webrtc-build/webrtc-build)
- [webrtc-build(webrtc-sdk/webrtc-build)](https://github.com/webrtc-sdk/webrtc-build)
    - Builds are [here](https://github.com/webrtc-sdk/Specs)
