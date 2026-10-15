# Audio and animation

Axiom.Gameplay API reference. Unity naming baseline: Unity 6.3 LTS.

Camera.main selects the active camera entity. It does not provide ScreenPointToRay or camera creation. AudioSource and Animator wrap existing imported resources and authored animation states/parameters; this batch does not add audio decoding, new media formats, root motion or Mecanim compatibility. Audio and animator actions are applied by the runtime bridge.