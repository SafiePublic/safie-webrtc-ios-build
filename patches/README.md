Instruction for Patches
===

## disable_audio_input_interface.patch

WebRTC library for iOS has a problem managing microphone permission.\
https://issues.webrtc.org/issues/42230897

It asks for microphone access even when using WebRTC for listen-only video watches.

This patch adds the following interface.

```swift
RTCPeerConnectionFactory(disableAudioInput: Bool = false)
```

If you instantiate `RTCPeerConnection` using `RTCPeerConnectionFactorry(disableAutioInput: true)`, it will lock audio input in a disabled state and prevent microphone access.
