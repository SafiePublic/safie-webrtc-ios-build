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
