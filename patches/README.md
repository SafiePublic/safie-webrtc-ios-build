Instruction for Patches
===

## disable_audio_input_interface.patch

The WebRTC library for iOS has a problem with microphone permission handling
(https://issues.webrtc.org/issues/42230897): it asks for microphone access
even when WebRTC is used only for watching video streams (receive-only).

This patch adds the following initializer.

```swift
RTCPeerConnectionFactory(disableAudioInput: Bool)
```

Peer connections created from a factory initialized with
`disableAudioInput: true` keep audio input locked in a disabled state, so the
microphone is never accessed and no permission dialog is shown. With `false`
(or the plain `init()`), the behavior is identical to upstream.

## support_h265_decode.patch

Upstream libwebrtc contains full H265 receive support (SDP negotiation, RTP
packetization) behind the `rtc_use_h265` GN flag, but ships no H265 codec
implementation for the iOS SDK. This patch adds a receive-only H265
implementation:

- `RTCVideoDecoderH265`: VideoToolbox (hardware) H265 decoder. Supports the
  Main (`profile-id=1`) and Main10 (`profile-id=2`) profiles.
- `RTCVideoDecoderFactoryH264H265`: decoder factory combining the H264 and
  H265 decoders, used by the default `RTCPeerConnectionFactory.init` so that
  H265 shows up in the SDP offer/answer without any app side changes. The
  encoder side stays H264 only.

All changes are no-ops unless WebRTC is built with `rtc_use_h265=true`.

Licensing note: only the device built-in hardware decoder (VideoToolbox) is
used. No software H265 codec is compiled into the binary.
