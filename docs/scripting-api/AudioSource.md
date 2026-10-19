# AudioSource

Namespace: `Axiom.Gameplay`

## Description

Playback/volume adapter for an existing imported audio source. Play, Pause, UnPause and Stop go through the runtime audio bridge.

## Use cases

Start an authored sound or change its volume.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var source = GetComponent<AudioSource>();
if (source != null) { source.volume = 0.5; source.Play(); }
```

## Compatibility and limitations

Camera.main selects the active camera entity. It does not provide ScreenPointToRay or camera creation. AudioSource and Animator wrap existing imported resources and authored animation states/parameters; this batch does not add audio decoding, new media formats, root motion or Mecanim compatibility. Audio and animator actions are applied by the runtime bridge.


SDK 8: `.enabled` and the Inspector component checkbox control this component in Edit and Play. Runtime changes do not modify authored data.

## Implemented declarations

```csharp
public sealed partial class AudioSource : Component {public bool enabled {get=>ComponentActivation.Read(Entity,"audioSource");set=>ComponentActivation.Write(Entity,"audioSource",value);}
 internal AudioSource(Entity entity){Entity=entity;}
 public void Play()=>Entity.PlayAudio();public void Pause()=>Entity.PauseAudio();public void UnPause()=>Entity.ResumeAudio();public void Stop()=>Entity.StopAudio();
 public double volume {get=>Context.EntityData[Entity.Id].GetProperty("audioSource").GetProperty("volume").GetDouble();set=>Entity.SetAudioVolume(value);}
}

public sealed partial class AudioSource {
 public bool loop {get=>PresentationData.Read(Entity,"audioSource").GetProperty("loop").GetBoolean();set=>PresentationData.Set(Entity,"audioSource","loop",JsonValue.Create(value)!);}
 public double pitch {get=>PresentationData.Read(Entity,"audioSource").GetProperty("playbackRate").GetDouble();set=>PresentationData.Set(Entity,"audioSource","playbackRate",JsonValue.Create(value)!);}
 public double minDistance {get=>PresentationData.Read(Entity,"audioSource").GetProperty("minDistance").GetDouble();set=>PresentationData.Set(Entity,"audioSource","minDistance",JsonValue.Create(value)!);}
 public double maxDistance {get=>PresentationData.Read(Entity,"audioSource").GetProperty("maxDistance").GetDouble();set=>PresentationData.Set(Entity,"audioSource","maxDistance",JsonValue.Create(value)!);}
}
```
