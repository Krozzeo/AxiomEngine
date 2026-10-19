# AudioSource and Animator

AudioSource supports play/pause/unpause/stop, live volume, loop, pitch (positive playback rate only) and attenuation distances. Existing authored audio assets are required; no runtime AudioClip construction or sample-accurate scheduling. Animator parameters can be read/written and existing states played/crossfaded; no Avatar/humanoid/IK facade. Changes during Play are discarded at Stop.


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

public sealed partial class Animator : Component {public bool enabled {get=>ComponentActivation.Read(Entity,"animator");set=>ComponentActivation.Write(Entity,"animator",value);}
 internal Animator(Entity entity){Entity=entity;}
 public void Play(string state)=>Entity.PlayAnimation(state,0);public void CrossFade(string state,double duration)=>Entity.PlayAnimation(state,duration);
 public void SetFloat(string name,double value)=>Entity.SetAnimationParameter(name,value);public void SetBool(string name,bool value)=>Entity.SetAnimationParameter(name,value?1:0);public void SetInteger(string name,int value)=>Entity.SetAnimationParameter(name,value);
}

public sealed partial class Animator {
 public double GetFloat(string name){var p=PresentationData.Read(Entity,"animator").GetProperty("parameters").EnumerateArray().FirstOrDefault(p=>p.GetProperty("name").GetString()==name);if(p.ValueKind==System.Text.Json.JsonValueKind.Undefined)throw new ArgumentException("Unknown Animator parameter");return p.GetProperty("value").GetDouble();}
 public bool GetBool(string name)=>GetFloat(name)!=0;public int GetInteger(string name)=>(int)GetFloat(name);
}
```
