# AXIOM ENGINE

## Documento maestro de producto, arquitectura e implementación

**Nombre provisional del proyecto:** Axiom Engine
**Naturaleza:** motor de videojuegos open source, AI-first / agent-native, ejecutado y editado principalmente desde el navegador mediante WebGPU, asistido por un daemon local.
**Objetivo a largo plazo:** construir una arquitectura capaz de evolucionar hasta competir técnicamente con motores de la escala de Unity, Godot y eventualmente Unreal Engine, manteniendo como diferencial fundamental que agentes de inteligencia artificial sean operadores de primera clase del sistema.

---

# 0. Mandato para ChatGPT Work

Tu tarea es diseñar e implementar **Axiom Engine** siguiendo este documento como especificación maestra.

No debes limitarte a producir propuestas, pseudocódigo o planes teóricos. Debes:

1. preservar y formalizar la arquitectura aquí descrita;
2. crear la estructura real del proyecto;
3. documentar las decisiones arquitectónicas;
4. implementar Axiom progresivamente;
5. trabajar por milestones;
6. construir una versión funcional mínima desde muy temprano;
7. ejecutar y probar cada milestone;
8. corregir fallos antes de avanzar;
9. medir rendimiento;
10. mantener compatibilidad con los principios arquitectónicos;
11. preparar cada subsistema para crecimiento futuro;
12. evitar decisiones de corto plazo que obliguen a reescribir el motor;
13. crear documentación tanto humana como machine-readable;
14. utilizar herramientas de investigación cuando una especificación técnica actual, API, estándar o implementación pueda haber cambiado;
15. mantener el proyecto ejecutable en todo momento razonable.

No preguntes al usuario por decisiones menores.

Cuando exista una ambigüedad no crítica:

- elegí la alternativa técnicamente más sólida;
- preferí soluciones simples, medibles y reemplazables;
- documentá la elección;
- si tiene impacto arquitectónico, creá un ADR;
- continuá trabajando.

Solo una decisión que cambie radicalmente la visión o contradiga explícitamente este documento justifica detenerse.

---

# 1. Visión del producto

Axiom no debe ser simplemente:

> “Unity funcionando en un navegador con un chatbot agregado”.

Debe ser un motor concebido desde cero bajo el principio:

> **Human-first + Agent-native.**

Humano e IA deben ser operadores igualmente válidos de un mismo sistema.

Todo lo que una persona puede realizar mediante la interfaz visual debe tener una representación semántica estructurada utilizable por agentes.

La IA no debe depender de:

- clicks;
- visión artificial;
- screenshots completos;
- lectura de logs gigantes;
- inferencia sobre estados opacos.

Debe poder consultar y controlar Axiom mediante interfaces estructuradas y eficientes.

La interfaz visual humana y la interfaz para agentes deben ser dos clientes diferentes sobre la misma arquitectura del engine.

---

# 2. Principios fundamentales no negociables

## 2.1 AI-first

La primera prioridad del proyecto es:

1. facilidad de uso para IA;
2. performance;
3. potencia gráfica;
4. velocidad de iteración;
5. facilidad de uso humana;
6. portabilidad web;
7. extensibilidad;
8. colaboración.

Las decisiones de arquitectura deben respetar este orden.

---

## 2.2 Observability as semantics

La observabilidad no es una herramienta externa.

Forma parte de la semántica del motor.

Cada subsistema relevante debe poder responder preguntas equivalentes a:

- ¿qué ocurrió?
- ¿qué cambió?
- ¿por qué ocurrió?
- ¿quién lo causó?
- ¿qué depende de esto?
- ¿cuánto costó?
- ¿qué recurso utilizó?
- ¿puede reproducirse?
- ¿cuál fue la causa raíz?
- ¿qué cambió respecto del estado anterior?
- ¿qué acción podría investigarse a continuación?

Esto constituye la base de **Axiom Causal Diagnostics**.

---

## 2.3 No hidden magic

Si Axiom toma automáticamente una decisión importante, la decisión debe ser inspeccionable.

Ejemplos:

- selección CPU/GPU;
- fallback gráfico;
- generación de LOD;
- batching;
- culling;
- shader permutation;
- streaming;
- recompilación;
- asset conversion;
- cambio de physics backend;
- elección de resource format.

La IA y el usuario deben poder preguntar:

`why(...)`

y recibir una respuesta estructurada.

---

## 2.4 Performance is measured

No aceptar:

> “Esto debería ser rápido”.

Todo sistema sensible a rendimiento debe tener:

- benchmark;
- baseline;
- métricas;
- presupuesto;
- detección de regresiones.

Principios:

> Correctness before optimization.
> Measurement before optimization.
> Architecture before convenience.

Pero, simultáneamente:

> Las decisiones fundacionales deben estar preparadas para alto rendimiento desde el comienzo.

---

## 2.5 Una tarea no termina cuando compila

El ciclo obligatorio para una tarea de implementación es:

Understand
→ Define acceptance criteria
→ Create transactional workspace
→ Implement
→ Compile
→ Run
→ Test
→ Inspect semantically
→ Inspect visually cuando corresponda
→ Profile cuando corresponda
→ Diagnose failures
→ Fix
→ Repeat
→ Present change set

---

# 3. Usuarios objetivo

Prioridad:

### Primario

Agentes de IA.

### Secundario

Desarrolladores profesionales e independientes técnicamente competentes.

### Futuro

Diseñadores técnicos, artistas y usuarios menos técnicos.

La interfaz humana debe inspirarse principalmente en Unity para reducir curva de aprendizaje.

---

# 4. Plataforma

## 4.1 Editor

El editor funciona en el navegador.

Primera plataforma oficialmente soportada:

- Chrome;
- Chromium;
- Edge;

en desktop.

Sistemas:

- Windows;
- Linux;
- macOS.

Otros navegadores se incorporarán posteriormente.

---

## 4.2 Renderer

Renderer principal:

**WebGPU exclusivamente durante el MVP.**

No implementar WebGL2 paralelo durante el MVP.

Diseñar límites internos apropiados para evitar acoplamiento innecesario con APIs externas, pero no crear una abstracción gráfica gigantesca.

---

# 5. Arquitectura general

La arquitectura deberá aproximarse conceptualmente a:

```text
┌───────────────────────────────────────────────────────────┐
│                     BROWSER                               │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                 AXIOM EDITOR UI                     │  │
│  │       TypeScript + Web UI framework                 │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              AXIOM COMMAND PROTOCOL                 │  │
│  └─────────┬───────────┬─────────────┬─────────────────┘  │
│            │           │             │                    │
│            ▼           ▼             ▼                    │
│         Engine       AI API       Diagnostics              │
│            │                                             │
│            ▼                                             │
│     Rust → WebAssembly                                   │
│            │                                             │
│       ┌────┴────┐                                        │
│       ▼         ▼                                        │
│     WebGPU    Workers                                     │
│                                                           │
└───────────────────────┬───────────────────────────────────┘
                        │ localhost
                        ▼
┌───────────────────────────────────────────────────────────┐
│                   AXIOM LOCAL DAEMON                      │
│                                                           │
│ Filesystem                                                │
│ C# compilation                                            │
│ Git                                                       │
│ Asset conversion                                          │
│ CAD processing                                            │
│ Headless jobs                                             │
│ MCP                                                       │
│ Build toolchain                                           │
│ Cache management                                          │
└───────────────────────────────────────────────────────────┘

```

---

# 6. Lenguajes y tecnologías

## Engine core

Prioridad:

**Rust → WebAssembly**

Para:

- ECS;
- runtime;
- scene compiler;
- memory-sensitive systems;
- jobs;
- asset runtime;
- serialization crítica;
- renderer orchestration;
- physics;
- diagnostics;
- profiling.

---

## Editor UI

**TypeScript**

Framework web a elección técnica de Work.

Elegir priorizando:

- rendimiento;
- virtualización;
- mantenibilidad;
- ecosystem;
- tamaño razonable;
- buena integración con TypeScript.

La decisión debe documentarse mediante ADR.

---

## Gameplay

Lenguaje principal visible al desarrollador:

**C#**

Pipeline objetivo:

```text
C#
↓
Roslyn/.NET toolchain
↓
development compilation
↓
WebAssembly runtime

Release:
C#
↓
AOT
↓
WebAssembly optimizado

```

No introducir C++ como paso innecesario.

El daemon realiza las tareas de compilación.

---

## Shaders

Lenguaje shader nativo:

**WGSL**

No inventar inicialmente otro shader language.

Axiom puede posteriormente agregar encima:

- includes;
- macros;
- reflection;
- shader graph;
- code generation;
- material templates.

---

# 7. Separación arquitectónica obligatoria

Mantener límites estrictos entre:

```text
Editor
Engine
Runtime
Renderer
Physics
Assets
Scripting
Daemon
AI interfaces

```

Reglas de ejemplo:

- Engine Core no depende de Editor.
- Runtime no depende del DOM.
- Physics no depende de Editor.
- Runtime no depende de UI.
- Assets puede depender de Core.
- Editor consume Engine APIs.
- Engine nunca depende del editor.
- Daemon no debe contener lógica de gameplay.
- AI tools consumen APIs públicas del engine.

Estas reglas deberán validarse automáticamente en CI cuando sea posible.

---

# 8. Engine Schema / IDL central

Crear desde el comienzo un **Axiom Engine Schema**.

Debe funcionar como fuente única de verdad.

Ejemplo conceptual:

```text
component RigidBody {
    mass: float
    velocity: vec3
    useGravity: bool
    collisionMode: enum
}

```

A partir del schema debe poder derivarse o generarse:

- metadata de componentes;
- Inspector;
- serialización;
- validación;
- documentación;
- C# bindings;
- TypeScript bindings;
- AI tool definitions;
- MCP schemas;
- reflection;
- default values;
- ranges;
- units;
- runtime mutability;
- migration metadata.

Evitar definiciones duplicadas manualmente.

---

# 9. Property System

Todas las propiedades editables deben usar metadata estructurada.

Ejemplo:

```text
Light.intensity

type: float
unit: lux
minimum: 0
default: 1000
runtimeEditable: true
serializable: true
aiDescription: "..."

```

Esto deberá alimentar automáticamente:

- Inspector;
- scripting;
- serialization;
- AI;
- undo/redo;
- validation;
- documentation.

---

# 10. Identidad universal

Nunca depender de nombres o posiciones visuales para identificar recursos.

Todo objeto significativo debe tener identificador estable.

Ejemplos:

```text
entity://...
asset://...
component://...
material://...
scene://...
script://...

```

Internamente usar handles generacionales cuando corresponda:

```text
index
generation

```

Esto evita referencias viejas y errores use-after-free.

---

# 11. Authoring Model vs Runtime Model

## Authoring

Experiencia cercana a Unity:

```text
GameObject-like object
├ Transform
├ MeshRenderer
├ Rigidbody
└ PlayerController

```

Scene Graph jerárquico.

---

## Runtime

Data-oriented ECS.

Preferir:

- Structure of Arrays;
- archetypes;
- sparse sets donde corresponda;
- query engine eficiente;
- cache-friendly iteration;
- batch processing;
- mínimo pointer chasing.

Proceso:

```text
Authoring Scene
      ↓
Scene Compiler
      ↓
Optimized Runtime World

```

El runtime no debe cargar metadata innecesaria del editor.

---

# 12. ECS híbrido

El sistema debe combinar:

- UX comprensible de objetos/componentes;
- runtime ECS orientado a datos.

No obligar al usuario a pensar permanentemente en un ECS puro.

La IA puede operar sobre cualquiera de las representaciones apropiadas.

---

# 13. Scene Graph

Debe soportar desde temprano:

- jerarquía;
- parenting;
- transforms;
- activation;
- components;
- prefabs;
- instance overrides;
- stable IDs;
- serialization versionada.

---

# 14. Prefabs

Implementar fundación de prefabs desde etapas tempranas.

Modelo:

```text
Prefab
↓
Instance
↓
Overrides

```

No duplicar silenciosamente todo el contenido de un prefab.

Los overrides deben poder representarse como deltas.

Esto facilita:

- Git;
- AI diffs;
- copy-on-write;
- scene merging;
- future collaboration.

---

# 15. Scene formats

Mantener representaciones diferentes para authoring y runtime.

Ejemplo:

```text
.axscene
.axprefab
.axmat

```

Formato de autoría:

- estructurado;
- versionado;
- diff-friendly;
- legible donde tenga sentido.

Runtime:

```text
.axscene.bin

```

optimizado para carga.

Nunca utilizar exclusivamente el formato runtime como fuente editable.

---

# 16. Schema migrations

Todos los formatos versionados deben tener migraciones.

Ejemplo:

```text
RigidBody v1
→ v2
→ v3

```

Aplica a:

- scenes;
- prefabs;
- materials;
- settings;
- components;
- assets;
- AI protocols.

---

# 17. Unknown-data preservation

Abrir y guardar un archivo que contenga información desconocida de versiones posteriores no debe destruirla automáticamente.

Preservar campos desconocidos cuando sea técnicamente posible.

---

# 18. World Partition

Preparar el formato del mundo para partición espacial aunque la funcionalidad completa llegue más tarde.

Modelo futuro:

```text
World
├ Cell
├ Cell
├ Cell
└ Cell

```

Objetivos futuros:

- huge worlds;
- streaming;
- partial editor loading;
- AI spatial context;
- memory efficiency.

No construir todavía un sistema equivalente al World Partition completo de Unreal.

---

# 19. Command Bus

Toda acción modificadora importante debe expresarse mediante comandos estructurados.

Ejemplos:

```text
CreateEntity
DeleteEntity
SetProperty
AddComponent
ImportAsset
CompileScript
RunScene
CaptureFrame

```

Humanos e IA deben consumir fundamentalmente la misma capa.

---

# 20. Event Bus

Separar comandos de eventos.

Comando:

> hacé esto.

Evento:

> esto ocurrió.

Ejemplos:

```text
EntityCreated
PropertyChanged
AssetImported
ScriptCompiled
CollisionStarted

```

No mezclar ambos conceptos.

---

# 21. Correlation IDs y Trace IDs

Todo comando debe poder generar lineage.

Ejemplo:

```text
Input
correlation 7A31

↓
PlayerController.Jump

↓
RigidBody impulse

↓
Physics step

↓
Transform update

```

Debe ser posible pedir:

```text
trace(7A31)

```

y reconstruir la cadena.

Los trace IDs deben propagarse entre:

- Browser;
- Engine;
- Wasm;
- Workers;
- GPU jobs cuando sea lógico;
- Daemon.

---

# 22. Axiom Causal Diagnostics

Este sistema es obligatorio desde Day 0.

No debe agregarse retrospectivamente.

Cada subsistema deberá exponer gradualmente:

```text
State
Decisions
Dependencies
Failures
Reason codes
Evidence
Metrics
Suggested inspection targets

```

---

## 22.1 Why APIs

Ejemplos:

```text
whyNotRendered(entity)
whyNotColliding(a,b)
whyNotMoving(entity)
whyAudioNotPlaying(source)
whyAnimationNotPlaying(entity)
whyShaderFailed(shader)
whyAssetNotLoaded(asset)
whyScriptNotRunning(script)
whyLightNotAffecting(light,target)
whyRaycastMissed(query)
whyIsPhysicsOnCPU(entity)

```

Implementar inicialmente las que correspondan a subsistemas existentes.

No crear mocks falsos.

---

## 22.2 Decision Graph

Los sistemas deben registrar reason codes económicos.

Ejemplo renderer:

```text
enabled?
renderer enabled?
mesh available?
layer visible?
pipeline valid?
inside frustum?
occlusion accepted?

```

Si una entidad es rechazada:

```text
RenderRejectReason = FRUSTUM

```

A pedido, reconstruir explicación más profunda.

---

## 22.3 Niveles diagnósticos

### Normal

Bajo overhead:

- counters;
- reason codes;
- compact bitsets;
- aggregate timings.

### Diagnostic

Para entidad o subsystem seleccionado:

- decision path;
- intermediate data;
- dependency details.

### Deep Trace

Solo temporalmente:

- detailed lineage;
- state captures;
- multi-frame tracing;
- expensive instrumentation.

Nunca activar instrumentación pesada globalmente sin necesidad.

---

# 23. explainDifference

Soportar progresivamente consultas como:

```text
explainDifference(frameA, frameB)

```

Ejemplo:

```text
Player entered trigger
→ DoorController executed
→ Door state changed
→ Animation transition occurred

```

---

# 24. Profiler AI-native

El profiler no debe ser solo una timeline visual.

Debe producir datos machine-readable.

Métricas:

- CPU frame;
- GPU frame;
- physics;
- scripting;
- animation;
- render passes;
- memory;
- asset streaming;
- worker occupancy;
- stalls;
- compilation;
- draw count;
- triangles;
- visible entities;
- shadow casters;
- physics contacts;
- particles.

---

# 25. explainFrameSpike

Implementar una API capaz de comparar un frame contra baseline.

Ejemplo conceptual:

```text
Frame 831
GPU: 25.6ms
median: 8.3ms

Primary regression:
ShadowPass +14.8ms

Correlated:
+859 shadow casters
+4.1M triangles

Cause:
camera entered Building_B

```

No depender de una LLM para descubrir las métricas básicas.

El engine debe proporcionar causalidad y correlaciones estructuradas.

La IA puede posteriormente interpretar.

---

# 26. Diagnostic Replay

Cuando se detecta un problema:

```text
replay(frame=831, diagnostics="physics.deep")

```

El replay puede ejecutar un segmento nuevamente con instrumentación más costosa.

---

# 27. Deterministic Replay

Implementar progresivamente:

- fixed timestep;
- input recording;
- deterministic random streams;
- command recording;
- state snapshots;
- replay.

No prometer bit-perfect determinism entre todas las GPUs.

---

# 28. Dos modos de simulación

## Realtime Mode

Máximo rendimiento.

GPU-first.

## Deterministic Test Mode

Prioriza reproducibilidad.

Puede usar CPU/Wasm para operaciones que en GPU produzcan nondeterminism o readback complejo.

---

# 29. Time System centralizado

Nunca dispersar fuentes de tiempo arbitrarias.

Exponer:

```text
RealTime
GameTime
FixedTime
EditorTime
ReplayTime

```

Soportar:

- pause;
- single-frame step;
- slow motion;
- replay.

---

# 30. Random System centralizado

Ejemplo:

```text
RandomStream("physics")
RandomStream("gameplay")
RandomStream("particles")

```

Seeds registrables.

Fundamental para debugging.

---

# 31. Input System

Gameplay no debe depender directamente de teclas.

Ejemplo:

```text
MoveForward
Jump
Shoot

```

Mappings:

- keyboard;
- mouse;
- gamepad;
- touch futuro;
- AI simulated input;
- test input;
- recorded input.

---

# 32. Renderer

Renderer propio desde cero sobre WebGPU.

No utilizar:

- Three.js;
- Babylon;
- PlayCanvas;
- motores equivalentes.

Herramientas fundamentales sí están permitidas.

---

# 33. Render Graph

Toda renderización debe organizarse mediante Render Graph.

Ejemplo conceptual:

```text
Depth
↓
Hi-Z
↓
GPU Culling
↓
Shadows
↓
Opaque
↓
Lighting
↓
Transparent
↓
PostFX

```

Objetivos:

- resource lifetime;
- transient resources;
- synchronization;
- pass dependency;
- profiling;
- diagnostics.

---

# 34. Rendering interno

Mantener una interfaz interna fina:

```text
Axiom Renderer
↓
WebGPU Backend

```

No construir una abstracción genérica compleja para Vulkan/DX/OpenGL.

Separar conceptos del engine de llamadas concretas WebGPU.

---

# 35. 3D MVP

Incluir progresivamente:

- meshes;
- transforms;
- cameras;
- PBR materials;
- directional lights;
- point lights;
- spot lights;
- shadows;
- skeletal animation;
- particles;
- environment;
- sky;
- postprocessing;
- GPU instancing;
- LOD;
- frustum culling;
- occlusion culling;
- clustered/forward+ rendering;
- GPU-driven rendering donde tenga sentido.

Ray tracing queda fuera del MVP.

Preparar arquitectura futura.

---

# 36. 2D MVP

Incluir:

- sprites;
- sprite sheets;
- tilemaps;
- sprite animation;
- 2D physics;
- particles;
- 2D lighting;
- UI;
- skeletal 2D cuando el roadmap lo permita;
- pixel-perfect camera.

2D no debe ser simplemente “3D con Z=0” si esto causa costos innecesarios.

Compartir infraestructura cuando tenga sentido.

---

# 37. Física

Motor propio.

No usar como núcleo:

- PhysX;
- Bullet;
- Rapier;
- Box2D;
- equivalentes.

---

## Arquitectura física

GPU-first híbrida.

GPU ideal para:

- broad phase;
- batch spatial queries;
- particles;
- fluids;
- cloth;
- soft bodies;
- parallel constraints cuando sea apropiado;
- massive collision candidate processing.

CPU/Wasm cuando convenga para:

- low latency queries;
- synchronization-sensitive gameplay;
- highly branching logic;
- deterministic tests;
- small workloads.

Nunca imponer GPU si medir demuestra que CPU es más rápido.

---

# 38. Physics explainability

Ejemplos:

```text
whyNotColliding(A,B)
whyDidCollisionOccur(A,B)
whyPhysicsBackend(entity)

```

Debe poder inspeccionarse:

- layers;
- masks;
- AABB;
- narrow phase;
- constraints;
- solver;
- readback cost;
- backend choice.

---

# 39. Audio

Implementar audio progresivamente usando capacidades web apropiadas.

Objetivos:

- playback;
- 2D audio;
- 3D spatial audio;
- listener;
- attenuation;
- mixer;
- buses;
- effects;
- streaming;
- diagnostic information.

---

# 40. Asset System

Nunca hacer que el runtime consuma directamente todos los formatos fuente.

Pipeline:

```text
Source Assets
↓
Importer
↓
Canonical intermediate data
↓
Optimization
↓
Axiom runtime formats

```

---

# 41. Source formats

Objetivos:

3D:

- glTF;
- GLB;
- FBX;
- OBJ;

CAD progresivamente:

- STEP/STP;
- IGES/IGS;
- STL;

Images:

- PNG;
- JPEG;
- WebP;
- SVG;
- HDR;
- EXR;

Audio:

- WAV;
- MP3;
- OGG.

glTF/GLB debe ser prioridad inicial.

---

# 42. CAD

CAD completo no pertenece al renderer inicial.

Crear importer/conversion pipeline.

Futuro:

```text
BREP/NURBS
↓
tessellation
↓
mesh optimization
↓
runtime geometry

```

Priorizar CAD después de tener estable el pipeline general.

---

# 43. Content-addressed assets

Los recursos derivados deben identificarse por hash de contenido y configuración.

Ejemplo:

```text
Source hash
Importer version
Settings hash
↓
Derived asset key

```

Evitar reprocesar assets sin cambios.

---

# 44. Derived Data Cache

Separar:

```text
Project sources

```

de:

```text
DerivedData
Cache

```

Nunca requerir guardar derived data en Git.

---

# 45. Dependency Graph

Mantener grafo global:

```text
Scene
→ Prefab
→ Material
→ Shader
→ Texture

```

APIs:

```text
whatUses(asset)
whatDependsOn(asset)
whatWillBreakIfDeleted(asset)
whyWasRebuilt(asset)

```

---

# 46. Incremental Build Graph

Cada transformación de asset debe ser un nodo.

Ejemplo:

```text
Texture
→ Decode
→ Resize
→ Compress
→ RuntimeTexture

```

Con:

- inputs;
- outputs;
- hashes;
- importer version;
- settings;
- dependencies.

Rebuild solo de nodos afectados.

---

# 47. Resource Manager

Centralizar recursos GPU y engine.

Gestionar:

- buffers;
- textures;
- samplers;
- pipelines;
- bind groups;
- query sets;
- persistent resources;
- transient resources.

Registrar:

- ownership;
- lifetime;
- allocation;
- usage;
- last-use;
- memory cost.

---

# 48. Memory Architecture

Evitar allocs por frame.

Preparar:

- arenas;
- frame allocator;
- pools;
- slabs;
- ring buffers;
- scratch memory;
- persistent heap;
- GPU upload buffers.

Separar conceptualmente:

```text
FrameMemory
SceneMemory
AssetMemory
EditorMemory
RuntimeMemory

```

---

# 49. Job System

Crear scheduler propio.

Job metadata:

- dependencies;
- priority;
- affinity;
- estimated cost;
- cancellation;
- trace;
- metrics.

Execution targets:

```text
Main thread
Web Worker
Wasm thread
GPU compute
Daemon

```

No acoplar el productor del job al destino.

---

# 50. Task Graph

Sistemas:

```text
Input
Scripts
Animation
Physics
Transforms
Visibility
Render Preparation

```

El scheduler debe ejecutar en paralelo cuando dependencias lo permitan.

---

# 51. Multithreading

Preparar SharedArrayBuffer / Wasm shared memory y Workers desde etapas tempranas.

El servidor local deberá configurarse apropiadamente para cross-origin isolation.

No dejar multithreading como refactor posterior.

---

# 52. Editor UX

Tomar Unity como principal referencia conceptual.

Paneles MVP:

- Scene;
- Game;
- Hierarchy;
- Inspector;
- Project/Assets;
- Console;
- Profiler;
- AI Chat;
- Task/Change Review.

Posteriores:

- Timeline;
- Animation;
- Material/Shader tooling;
- node graph.

---

# 53. UI virtualizada

Listas grandes no deben crear un elemento DOM por objeto.

Virtualizar:

- hierarchy;
- project browser;
- console;
- profiler lists;
- diagnostics lists.

Axiom debe ser utilizable con cientos de miles de entidades y assets sin colapsar la UI.

---

# 54. Browser filesystem

El navegador es editor y visualizador.

El daemon es responsable de integración robusta con filesystem local.

El proyecto real reside en archivos locales.

Browser storage puede usarse para:

- cache;
- temporary data;
- fast local buffers.

Nunca almacenar el único ejemplar de información crítica exclusivamente dentro del storage del navegador.

---

# 55. Project layout

Base sugerida:

```text
Project/
├ Assets/
├ Scripts/
├ Shaders/
├ Scenes/
├ Prefabs/
├ Settings/
├ Tests/
└ .axiom/
   ├ metadata
   ├ workspace
   └ local state

```

Caches derivados fuera del source tree cuando sea conveniente.

---

# 56. Git

Integración opcional.

El motor debe funcionar perfectamente sin Git.

Con Git disponible:

- inspect status;
- commit;
- diff;
- branch;
- transactional worktree cuando corresponda.

---

# 57. Transactional Workspaces

Toda tarea realizada por IA debe ocurrir sobre una versión independiente.

La IA:

- no pide permiso por cada archivo;
- puede realizar la tarea completa;
- puede ejecutar;
- puede probar;
- puede corregir;
- puede modificar libremente su workspace.

Al finalizar presenta la propuesta.

Usuario:

- Accept;
- Continue Editing;
- Reject.

---

# 58. Copy-on-write

No duplicar proyectos enormes físicamente.

Usar overlay / COW.

Concepto:

```text
MAIN
+
AI delta
=
AI workspace

```

Assets no modificados pueden compartirse por hash.

---

# 59. Con Git

Cuando sea apropiado:

- temporary branch;
- worktree;
- controlled merge.

Sin Git:

- snapshots;
- overlays;
- content addressing;
- command logs.

---

# 60. AI Change Log

Registrar cambios AI:

```text
+ created Player
+ added Rigidbody
~ speed 4 → 6
+ created PlayerController.cs

```

Relacionarlo con:

- Task ID;
- Agent ID;
- Trace IDs;
- tests;
- diagnostics;
- screenshots;
- benchmarks.

---

# 61. Multi-agent

Preparar arquitectura para múltiples agentes.

Ejemplos:

- programmer;
- environment;
- debugger;
- profiler;
- QA.

Cada agente debe operar sobre un workspace o scope controlado.

Evitar escritura concurrente destructiva.

La coordinación completa puede llegar después del MVP.

---

# 62. AI Command Protocol

Crear un protocolo estructurado central.

Ejemplos:

```text
createEntity
deleteEntity
setComponent
getSceneGraph
inspectEntity
runGame
pauseGame
stepFrame
captureFrame
getConsole
getProfilerState
executeEditorCommand

```

No limitarlo a HTTP REST.

Diseñar el protocolo internamente y exponer adaptadores.

---

# 63. AI transports

Permitir progresivamente:

- in-process interface;
- WebSocket;
- HTTP donde corresponda;
- MCP;
- CLI;
- internal AI chat.

Todos operan sobre la misma semántica.

---

# 64. MCP

Implementar MCP server en el daemon.

Exponer herramientas cuidadosamente estructuradas.

No generar una única mega-tool.

Organizar namespaces conceptuales:

```text
project.*
scene.*
entity.*
asset.*
script.*
shader.*
physics.*
renderer.*
runtime.*
test.*
profiler.*
diagnostics.*
workspace.*

```

---

# 65. API introspection

Todo tool importante debe ser auto-descriptivo.

Ejemplos:

```text
describeTool(...)
describeComponent(...)
describeError(...)
searchAPI(...)
examples(...)

```

Esto reduce tokens necesarios para explicar Axiom a los agentes.

---

# 66. AI Context Budget

Diseñar explícitamente para minimizar consumo de contexto.

Evitar mandar:

- world completo;
- logs enteros;
- screenshots 4K;
- todos los assets.

Preferir queries.

---

# 67. Context levels

Ejemplo conceptual:

```text
L0: compact status
L1: relevant subsystem summary
L2: detailed context
L3: deep inspection

```

APIs:

```text
getSceneSummary(depth)
getSceneDelta(since)
getRelevantEntities(query)
getErrors(...)
getProfilerHotspots(...)

```

---

# 68. Delta-first communication

Priorizar:

```text
getWorldDelta
getHierarchyDelta
getProfilerDelta
getLogDelta
getAssetDelta
getErrorsSince

```

sobre dumps completos.

---

# 69. Screenshot system

Permitir captura parametrizable.

Ejemplo:

```text
capture({
 viewport,
 width,
 height,
 region,
 channels
})

```

Channels:

- color;
- depth;
- normals;
- object IDs;
- wireframe;
- segmentation;
- bounding boxes;
- colliders cuando corresponda.

---

# 70. Token-efficient captures

Permitir:

- low-resolution images;
- region crops;
- selected entity only;
- changed regions;
- specific debug channels.

Una IA debe poder pedir 256×144 si eso alcanza.

---

# 71. Semantic screenshots

Generar opcionalmente overlays con:

- stable entity IDs;
- names;
- bounding boxes;
- component state;
- collision shapes;
- selected diagnostics.

Esto debe conectar visual output con machine-readable state.

---

# 72. Spatial AI API

Exponer:

```text
whatIsVisible(camera)
whatIsNear(entity,radius)
whatIsOccluding(A,B)
raycast(...)
findObjectsInside(...)
getSpatialRelations(...)
findLightsAffecting(entity)
findObjectsVisibleFrom(camera)

```

Reducir la necesidad de visión artificial.

---

# 73. AI task success criteria

Antes de modificar un proyecto, el agente debe formalizar internamente criterios de aceptación.

Ejemplo tarea:

> crear FPS básico

Criteria:

- player exists;
- movement works;
- mouse controls camera;
- weapon fires;
- target receives damage;
- no runtime errors;
- relevant tests pass.

Después debe autovalidarse.

---

# 74. Agent task loop

Toda task AI sigue:

```text
Understand
↓
Acceptance criteria
↓
Transactional workspace
↓
Implement
↓
Compile
↓
Run
↓
Automated tests
↓
Semantic inspection
↓
Visual inspection if useful
↓
Profile if relevant
↓
Fix
↓
Repeat
↓
Present proposal

```

---

# 75. Tests operables por IA

Crear Game Testing API.

Ejemplos conceptuales:

```text
spawn
teleport
press
hold
simulateInput
waitFrames
waitSeconds
assertPosition
assertComponent
assertVisible
assertCollision
captureFrame

```

Debe ser utilizable tanto desde C# como MCP.

---

# 76. Headless Engine

El engine debe poder ejecutarse sin editor visual.

Casos:

- CI;
- tests;
- script validation;
- physics;
- asset processing;
- AI automation.

---

# 77. Null Renderer

Crear backend:

```text
Renderer
├ WebGPU
└ Null

```

Null no dibuja.

Permite:

- no-GPU mode;
- tests;
- headless;
- CI.

---

# 78. Hardware strategy

No requerir GPU dedicada.

Interpretar “sin GPU” como máquina sin GPU dedicada pero normalmente con gráfica integrada.

Tier system:

## Tier 0 — Legacy / Low-End

Objetivo mínimo aproximado:

- 4 GB RAM;
- Intel Core i3;
- integrated Intel-class graphics;
- no dedicated GPU.

El editor y engine deben funcionar.

Expectativas visuales limitadas.

---

## Tier 1 — Modern Integrated

- 8 GB;
- modern integrated GPU;
- WebGPU core feature set razonable.

---

## Tier 2 — Mainstream Dedicated

- 16 GB;
- dedicated GPU;
- advanced rendering.

---

## Tier 3 — High End

- powerful GPU;
- large scenes;
- advanced effects;
- heavy simulations.

---

# 79. Capability system

Nunca asumir capacidades de hardware.

Detectar:

```text
GPU limits
features
memory estimates
supported formats
timestamp capability

```

Los sistemas deben adaptarse.

---

# 80. Graceful degradation

Nunca fallar todo el motor porque una feature no existe.

Ejemplos:

```text
SSR
↓
reflection probe
↓
environment map

```

o:

```text
high GPU particles
↓
reduced particles
↓
CPU fallback

```

---

# 81. No GPU-compatible adapter

Si realmente no existe WebGPU:

**No GPU Mode**

Debe permitir:

- project management;
- assets;
- scripts;
- Git;
- AI;
- compilation;
- tests no gráficos;
- scene data.

Viewport debe informar que no hay adaptador gráfico compatible.

---

# 82. Adaptive Editor Quality

El propio editor debe ajustarse según hardware.

Tier 0 ejemplo:

- lower viewport resolution;
- lower FPS cap;
- reduced shadows;
- limited previews;
- reduced post FX;
- low-memory cache.

---

# 83. Memory Budget Manager

Crear sistema central.

Debe conocer presupuestos aproximados de:

- RAM;
- Wasm memory;
- GPU memory estimada;
- asset cache;
- editor.

Nunca asumir que todo el proyecto cabe en memoria.

---

# 84. Asset Streaming

Proyecto de 100 GB debe poder abrirse sin cargar 100 GB.

Cargar assets bajo demanda.

Unload cuando sea seguro.

Registrar ownership/use.

---

# 85. Project Health API

API:

```text
getProjectHealth()

```

Ejemplo:

```text
✓ scripts valid
✓ shaders valid
⚠ unused assets
⚠ oversized textures
⚠ entities without LOD
✗ incompatible Tier0 shader

```

---

# 86. Automatic scalability analysis

Ejemplo:

```text
canThisSceneRunOn(Tier0)

```

Debe producir razones:

```text
estimated memory
shadow cost
texture cost
geometry
simulation complexity

```

---

# 87. Hot Reload

Hot reload debe ser transversal.

Incluir progresivamente:

- C# scripts;
- WGSL;
- materials;
- textures;
- scenes;
- settings.

Pipeline:

```text
file changed
↓
dependency graph
↓
rebuild affected nodes
↓
safe swap
↓
continue

```

---

# 88. Shader pipeline

WGSL source.

Agregar progresivamente:

- preprocessing controlado;
- reflection;
- pipeline caching;
- variant tracking;
- validation;
- diagnostics.

---

# 89. Shader permutation control

Evitar explosión combinatoria.

Registrar:

- features;
- variants;
- compile time;
- cache hit;
- unused permutations.

Axiom Causal Diagnostics debe poder explicar por qué una variante se compiló.

---

# 90. Error model

Nunca depender de mensajes de texto como identidad.

Usar códigos estables.

Ejemplo:

```text
AX_SHADER_0017

```

Error estructurado:

```text
code
subsystem
resource
location
cause
evidence
suggested inspections

```

Texto humano puede generarse encima.

---

# 91. Safe Mode

Debe existir forma de abrir proyectos rotos.

Safe Mode puede deshabilitar:

- user scripts;
- custom shaders;
- dangerous auto-execution.

Debe permitir inspeccionar y reparar.

---

# 92. GPU device loss

Diseñar recovery desde el comienzo.

Si el device WebGPU se pierde:

- detectar;
- suspender renderer;
- recrear device;
- reconstruir pipelines;
- recrear GPU resources desde CPU/runtime source;
- preservar editor/project state.

Nunca mezclar estado esencial con objetos GPU irreconstruibles.

---

# 93. Performance budgets

Definir budgets y benchmarks.

Medir:

- frame CPU;
- frame GPU;
- physics;
- scripting;
- memory;
- draw calls;
- triangles;
- asset load;
- shader compile;
- editor responsiveness.

---

# 94. Performance regression tests

Ejemplo:

```text
baseline:
GPU 4.1ms

new:
6.8ms

regression:
+65%

```

Debe alertar o fallar según threshold.

---

# 95. Golden Scenes

Crear pequeñas escenas estándar.

Ejemplos:

- PBR spheres;
- sprite stress;
- many objects;
- lighting;
- shadows;
- physics stack;
- animation;
- particles.

Usarlas para:

- correctness;
- screenshots;
- performance;
- memory;
- regressions.

---

# 96. Visual regression

Capturar imágenes de Golden Scenes.

Comparar con tolerancias apropiadas.

No asumir pixel-perfect cross-GPU cuando no sea realista.

Registrar hardware y renderer config.

---

# 97. Reproducible Test Metadata

Cada test debe registrar cuando corresponda:

- engine build;
- project snapshot;
- browser;
- GPU/device tier;
- settings;
- random seeds;
- timestep;
- input sequence.

---

# 98. Project Snapshots

Snapshots determinísticos por contenido.

Ejemplo:

```text
rootHash
engineVersion
schemaVersion
settingsHash

```

Permitir identificar exactamente qué versión fue probada.

---

# 99. Crash Recovery

Registrar suficiente estado para recuperar:

- unsaved editor state;
- AI workspace;
- command log;
- snapshots.

La caída del browser o daemon no debe destruir trabajo innecesariamente.

---

# 100. Event sourcing parcial

Acciones del editor pueden registrarse como comandos:

```text
#9831 SetProperty
#9832 CreateEntity
#9833 ImportAsset

```

Beneficios:

- undo/redo;
- AI audit;
- recovery;
- replay;
- debugging;
- future collaboration.

---

# 101. Undo / Redo

Debe apoyarse en command architecture.

Operaciones AI también deben producir cambios inspeccionables.

---

# 102. Backend remoto

No requerido para funcionamiento.

Core engine debe funcionar:

**100% local y offline.**

Servicios remotos futuros opcionales:

- login;
- cloud projects;
- asset hosting;
- remote builds;
- collaboration;
- AI gateway.

Nunca hacerlos requisito del editor local.

---

# 103. Plugin architecture

Plugins completos quedan para después del MVP.

Pero diseñar ahora:

- boundaries;
- extension points;
- capability model;
- versioning;
- ABI/API strategy.

Evitar acoplamiento que impida plugins futuros.

---

# 104. Security model

Una IA obtiene:

> acceso absoluto al proyecto.

No:

> acceso absoluto a la computadora.

---

# 105. Workspace sandbox

El daemon debe limitar por defecto filesystem al workspace autorizado.

Capabilities:

```text
filesystem.readProject
filesystem.writeProject
git.*
engine.*
build.*

```

No otorgar:

```text
filesystem.system.*

```

sin consentimiento explícito futuro.

---

# 106. Process security

Compiladores/importers pueden requerir procesos externos.

Crear allowlist/capability model.

Nunca ejecutar comandos arbitrarios generados por IA sin pasar por interfaces controladas del daemon.

---

# 107. Capability-based AI permissions

La IA no debe sufrir confirmaciones continuas.

Permisos se otorgan al scope de una tarea/workspace.

Dentro del proyecto puede operar libremente.

---

# 108. Open source

Axiom inicia como proyecto open source.

Elegir licencia apropiada durante Milestone 0.

Documentar elección con ADR.

Priorizar licencia permisiva salvo motivo técnico/legal contrario.

---

# 109. Architecture Decision Records

Crear:

```text
docs/adr/

```

Formato:

```text
Context
Decision
Alternatives
Consequences
Status

```

ADRs iniciales deberán cubrir al menos:

- Rust/Wasm core;
- WebGPU;
- browser editor;
- local daemon;
- hybrid ECS;
- C# gameplay;
- WGSL;
- AI-first command architecture;
- transactional workspaces;
- hybrid physics;
- versioned schema.

---

# 110. Machine-readable architecture

Crear archivo conceptual:

```text
axiom.architecture.json

```

Debe permitir a agentes descubrir:

- renderer;
- engine language;
- gameplay runtime;
- asset system;
- schemas;
- protocol versions;
- architectural constraints.

---

# 111. API versioning

Versionar desde temprano:

```text
Axiom Protocol v1
Axiom Scene Format v1
Axiom Asset Format v1
Axiom C# API v1
Axiom MCP v1

```

Versionado no implica estabilidad perpetua.

Implica capacidad de migración.

---

# 112. Arquitectura autoverificable

Crear tests que detecten dependencias prohibidas.

Ejemplos:

```text
EngineCore MUST NOT import Editor
Runtime MUST NOT import DOM
Physics MUST NOT import Editor

```

CI debe fallar cuando se viole.

---

# 113. Coding standards

Priorizar:

- claridad;
- ownership explícito;
- small modules;
- deterministic APIs;
- measurable performance;
- generated code cuando elimina duplicación;
- minimal hidden state.

Evitar:

- global mutable state;
- ad-hoc event systems;
- duplicated schema;
- scattered filesystem access;
- scattered timer usage;
- renderer dependency leakage.

---

# 114. Documentación

Debe existir documentación para:

- humanos;
- agentes.

Humana:

```text
docs/

```

Machine-readable:

- schemas;
- manifests;
- tool descriptions;
- generated metadata.

---

# 115. Repo sugerido

Work debe ajustar según necesidad, preservando separación.

```text
axiom/
├ apps/
│  └ editor/
│
├ engine/
│  ├ core/
│  ├ ecs/
│  ├ scene/
│  ├ renderer/
│  ├ physics/
│  ├ audio/
│  ├ assets/
│  ├ scripting/
│  ├ diagnostics/
│  ├ profiler/
│  ├ jobs/
│  ├ input/
│  └ testing/
│
├ daemon/
│
├ protocol/
│  ├ schema/
│  ├ commands/
│  ├ events/
│  └ mcp/
│
├ sdk/
│  └ csharp/
│
├ tools/
├ examples/
├ benchmarks/
├ tests/
├ docs/
│  ├ adr/
│  ├ architecture/
│  └ api/
│
└ scripts/

```

---

# 116. Scope del MVP

El MVP no se define por “tener todas las features de Unity”.

Debe demostrar un vertical slice completo:

```text
Create project
↓
Import assets
↓
Build 2D/3D scene
↓
Write C#
↓
Compile
↓
Run
↓
Physics
↓
Audio
↓
Materials/lights
↓
AI modifies project
↓
AI runs tests
↓
AI inspects result
↓
AI fixes failures
↓
User reviews changes
↓
User accepts/rejects
↓
Web build runs

```

La arquitectura debe poder crecer mucho más.

---

# 117. MVP quality target

Ideal:

experiencia cercana a un subconjunto de Unity.

Mínimo conceptual:

motor usable comparable en nivel de madurez funcional básica a una versión temprana de un motor estilo Godot, no en cantidad total de features.

No sacrificar arquitectura intentando alcanzar paridad superficial.

---

# 118. Milestone strategy

Cada milestone debe:

- producir software ejecutable;
- agregar valor observable;
- incluir tests;
- actualizar documentación;
- mantener arquitectura;
- tener Definition of Done;
- registrar benchmarks relevantes.

No construir 6 meses de infraestructura antes de mostrar viewport.

---

# 119. MILESTONE 0 — Architecture Lock & Bootstrap

## Objetivo

Crear base del proyecto.

## Entregables

- repository;
- license;
- README;
- architecture docs;
- ADR system;
- machine-readable architecture manifest;
- Rust workspace;
- TypeScript editor shell;
- daemon shell;
- protocol package;
- CI;
- formatting/linting;
- unit test infrastructure;
- dependency rules;
- version strategy;
- build scripts.

## Crear primeros schemas

- Entity ID;
- commands;
- events;
- diagnostics reason code;
- protocol envelope.

## Definition of Done

- repo compila;
- editor shell inicia;
- daemon inicia;
- browser se conecta a daemon;
- CI verde;
- architecture tests funcionan;
- un comando demo viaja browser → engine → event response;
- documentación explica cómo ejecutar localmente.

---

# 120. MILESTONE 1 — WebGPU + Engine Kernel

## Objetivo

Probar el pipeline completo browser/Wasm/WebGPU.

## Features

- WebGPU device creation;
- capability detection;
- device loss hooks;
- Rust/Wasm core;
- engine loop;
- fixed/variable clocks;
- basic job abstraction;
- resource manager skeleton;
- render graph skeleton;
- Null Renderer;
- profiler foundation;
- trace IDs.

## Scene

- entity;
- transform;
- camera.

## Rendering

- triangle;
- mesh;
- simple shader;
- color output.

## Definition of Done

- viewport muestra geometría WebGPU;
- Null Renderer ejecuta misma scene sin GPU;
- device capabilities visibles;
- trace de un frame inspectable;
- unit tests;
- basic GPU/CPU timings;
- no editor logic dentro del engine.

---

# 121. MILESTONE 2 — Axiom Beta Foundation

Esta es la **primera beta muy simple** que servirá como base de todo lo demás.

## Objetivo

Permitir crear, guardar, cargar y ejecutar una pequeña escena 2D/3D.

## Editor

- Scene;
- Game;
- Hierarchy;
- Inspector;
- Project;
- Console.

## Scene

- transforms;
- components;
- serialization;
- stable IDs;
- authoring → runtime compilation.

## 3D

- meshes;
- perspective camera;
- materials simples;
- basic light.

## 2D

- sprite;
- orthographic camera.

## Filesystem

- project creation;
- project open;
- asset folder;
- daemon file operations.

## Commands

Toda edición pasa por Command Bus.

## Events

Cambios producen Event Bus records.

## Undo

Basic undo/redo.

## Definition of Done

Un usuario puede:

1. abrir Axiom;
2. crear proyecto;
3. importar imagen y GLB;
4. colocar sprite;
5. colocar mesh;
6. moverlos;
7. guardar;
8. cerrar;
9. abrir;
10. ver la misma escena;
11. entrar a Play Mode.

---

# 122. MILESTONE 3 — Asset Pipeline

## Objetivo

Construir el asset system real.

## Implementar

- Asset DB;
- asset IDs;
- hashing;
- dependency graph;
- incremental build graph;
- derived cache;
- importer API;
- background jobs;
- hot reload;
- glTF/GLB importer;
- image importers;
- audio source importer.

## Diagnostics

```text
whyAssetNotLoaded
whyWasRebuilt
whatUses

```

## Definition of Done

Modificar una textura debe reconstruir únicamente recursos dependientes y refrescar scene sin reiniciar editor.

---

# 123. MILESTONE 4 — C# Gameplay Runtime

## Objetivo

Primer gameplay programable.

## Implementar

- Axiom C# SDK;
- generated bindings;
- daemon compilation;
- Wasm integration;
- component/script lifecycle;
- development compile path;
- release AOT path foundation;
- console/error mapping;
- hot reload cuando sea técnicamente seguro.

## API aproximada

Unity-like ergonomics sin copiar API innecesariamente.

## Definition of Done

Un script C# puede:

- acceder Transform;
- leer Input;
- mover entity;
- spawn entity;
- registrar logs.

Modificar script → recompilar → ejecutar sin reiniciar editor completo.

---

# 124. MILESTONE 5 — AI Control Layer

## Objetivo

Convertir Axiom en agent-native funcional.

## Implementar

- tool schema;
- MCP initial server;
- command protocol;
- project queries;
- scene queries;
- entity queries;
- runtime controls;
- screenshot API;
- semantic capture;
- deltas;
- context budget;
- API introspection.

## Workflows

Un agente externo debe poder:

1. crear una entidad;
2. añadir componentes;
3. importar asset;
4. modificar escena;
5. ejecutar juego;
6. tomar screenshot;
7. consultar estado;
8. leer errores;
9. parar simulación.

## Definition of Done

Crear una pequeña escena completa sin clicks humanos mediante protocolo estructurado.

---

# 125. MILESTONE 6 — Transactional AI Workspaces

## Objetivo

Permitir modificaciones AI seguras.

## Implementar

- snapshots;
- COW overlays;
- change set;
- AI action log;
- accept;
- reject;
- continue;
- Git optional integration.

## Definition of Done

Agente modifica proyecto sin tocar MAIN.

Usuario puede:

- inspect diff;
- run proposal;
- accept;
- reject.

Reject restaura estado sin residuos.

---

# 126. MILESTONE 7 — Physics Foundation

## Objetivo

Física 2D/3D propia.

## Inicial

CPU/Wasm primero si acelera validación arquitectónica.

Posteriormente GPU kernels.

## Features

- colliders;
- rigid bodies;
- broad phase;
- narrow phase;
- impulses;
- gravity;
- triggers;
- raycasts;
- collision layers;
- fixed step;
- deterministic test mode.

## GPU

Mover workloads apropiados basándose en benchmarks.

## Definition of Done

Golden physics scenes estables y reproducibles.

---

# 127. MILESTONE 8 — Causal Diagnostics v1

## Objetivo

Hacer observable la causalidad real.

Implementar primero:

```text
whyNotRendered
whyNotColliding
whyAssetNotLoaded
whyScriptNotRunning

```

Agregar:

- Decision Graph;
- reason codes;
- correlation lineage;
- trace viewer;
- diagnostic mode;
- deep trace architecture.

## Definition of Done

Introducir deliberadamente 10 fallos conocidos y demostrar que Causal Diagnostics identifica correctamente la causa en tests automáticos.

---

# 128. MILESTONE 9 — Renderer Production Foundation

## Features

- PBR;
- HDR;
- directional/point/spot;
- shadows;
- environment;
- tone mapping;
- forward+/clustered lighting;
- instancing;
- frustum culling;
- GPU culling;
- LOD;
- postprocessing;
- pipeline cache.

## Performance

Golden benchmarks.

## Definition of Done

Escenas benchmark cumplen budgets definidos por tier.

---

# 129. MILESTONE 10 — 2D Production Foundation

Implementar:

- sprite batching;
- tilemaps;
- animations;
- pixel-perfect camera;
- 2D lighting;
- particles;
- physics integration;
- 2D UI foundation.

AI APIs equivalentes.

---

# 130. MILESTONE 11 — Animation

Implementar:

- skeleton;
- skinning;
- clips;
- blending;
- state machines básicas;
- runtime API;
- diagnostic state.

AI debe poder consultar:

```text
currentAnimation
transition
whyAnimationNotPlaying

```

---

# 131. MILESTONE 12 — Audio

Implementar:

- sources;
- listener;
- spatialization;
- buses;
- mixing;
- streaming;
- diagnostics.

---

# 132. MILESTONE 13 — Profiler + explainFrameSpike

## Implementar

- structured CPU profiler;
- GPU timestamp instrumentation;
- frame metric history;
- anomaly comparison;
- top contributors;
- profiler API.

API:

```text
explainFrameSpike(frame)

```

Tests deben provocar regressions artificiales conocidas.

---

# 133. MILESTONE 14 — Automated Game Testing

Implementar:

- simulation input;
- assertions;
- frame stepping;
- deterministic mode;
- screenshot assertions;
- collision assertions;
- runtime state assertions.

AI puede escribir y ejecutar tests.

---

# 134. MILESTONE 15 — Replay & Diagnostic Replay

Implementar:

- input recording;
- random seeds;
- state checkpointing;
- replay ranges;
- diagnostic re-execution.

Permitir investigación:

```text
replay(780..840)

```

---

# 135. MILESTONE 16 — Performance & Low-End Pass

Target explícito:

Tier 0.

Optimizar:

- editor RAM;
- Wasm memory;
- render scaling;
- caches;
- virtualized UI;
- asset loading;
- shader load;
- scene compiler.

No degradar Tier 2/3 innecesariamente.

---

# 136. MILESTONE 17 — Advanced Assets / CAD

Después de estabilizar general asset pipeline:

- OBJ;
- STL;
- STEP;
- IGES;
- tessellation;
- mesh cleanup;
- normals;
- LOD;
- collision generation.

---

# 137. MILESTONE 18 — Agent Autonomy Loop

El agente debe poder:

- receive objective;
- define acceptance criteria;
- modify workspace;
- compile;
- run;
- inspect;
- diagnose;
- fix;
- retest;
- benchmark;
- present completed change set.

Este milestone demuestra la tesis completa de Axiom.

---

# 138. MILESTONE 19 — MVP Hardening

## Objetivo

Convertir subsistemas en producto coherente.

Incluye:

- stability;
- performance;
- documentation;
- examples;
- onboarding;
- safe mode;
- crash recovery;
- schema migrations;
- project health;
- Tier compatibility.

---

# 139. MVP acceptance scenario

Crear un proyecto sample utilizando únicamente Axiom.

Debe contener:

## 3D scene

- player;
- physics;
- lighting;
- PBR;
- animated entity;
- audio;
- gameplay C#.

## 2D scene

- tilemap;
- sprites;
- physics;
- animation;
- UI.

## AI task

Indicar al agente:

> Agregá un enemigo que persiga al jugador, pueda recibir daño, tenga feedback visual y de audio y escribí tests para verificarlo.

El agente debe:

1. crear workspace;
2. inspeccionar proyecto;
3. crear assets/scripts necesarios;
4. modificar scene;
5. compilar;
6. ejecutar;
7. simular input;
8. verificar comportamiento;
9. inspeccionar visualmente;
10. arreglar fallos;
11. ejecutar tests;
12. medir regressions;
13. presentar change set.

Usuario acepta.

Proyecto principal se actualiza correctamente.

Este escenario es requisito para declarar MVP.

---

# 140. Fuera del MVP

No priorizar inicialmente:

- full visual scripting;
- marketplace;
- multiplayer editor tipo Figma;
- ray tracing production;
- console export;
- mobile editor;
- WebGL renderer;
- full terrain ecosystem;
- advanced plugin marketplace.

Preparar arquitectura cuando corresponda.

---

# 141. Investigación técnica

Antes de implementar interfaces dependientes de estándares externos, verificar documentación actual.

Especialmente:

- WebGPU;
- WGSL;
- browser filesystem APIs;
- SharedArrayBuffer;
- WebAssembly;
- .NET Wasm/AOT;
- Web Audio;
- MCP protocol.

No asumir que detalles históricos siguen vigentes.

---

# 142. Política de dependencias

“No usar motores externos” no significa reimplementar software básico universal.

Permitido:

- compiler toolchains;
- Rust ecosystem foundational crates;
- serialization primitives;
- codecs;
- compression;
- parsing;
- testing;
- build tooling;
- Git bindings;
- standard math helpers si aportan valor.

No permitido como núcleo:

- Three.js;
- Babylon.js;
- PlayCanvas;
- Unity;
- Godot;
- existing full render engine;
- PhysX;
- Bullet;
- Rapier;
- Box2D.

Si una dependencia grande empieza a sustituir una parte central de Axiom, detener esa elección y documentarla.

---

# 143. Performance philosophy

No optimizar todo manualmente desde el primer commit.

Pero sí diseñar correctamente:

- ownership;
- memory layout;
- IDs;
- threading;
- incremental builds;
- render graph;
- ECS;
- job architecture.

Después medir.

---

# 144. AI efficiency philosophy

Cada nueva feature debe preguntarse:

> ¿Cómo la inspeccionaría una IA?

> ¿Cómo la modificaría?

> ¿Cómo sabría que funcionó?

> ¿Cómo podría saber por qué falló?

> ¿Cuánto contexto requiere?

Si la respuesta implica “leer todo” o “mirar screenshot completo”, probablemente falta una API semántica.

---

# 145. Human usability philosophy

Aunque AI sea prioridad #1, el editor debe ser agradable para desarrolladores.

Usar conceptos familiares:

- hierarchy;
- inspector;
- scene;
- game;
- components;
- prefabs;
- play mode.

Evitar complejidad visible innecesaria.

---

# 146. Authoring World vs Runtime World

Separar explícitamente:

```text
Authoring World
↓ snapshot/compile
Runtime World

```

Cambios ocurridos durante Play Mode no deben alterar involuntariamente authoring state.

Permitir eventualmente “Apply runtime change” explícito.

---

# 147. AI World Separation

Un agente puede ejecutar y destruir runtime worlds libremente.

No puede modificar MAIN accidentalmente.

---

# 148. Build output

MVP export:

**WebGPU browser game.**

Build debe contener únicamente runtime necesario.

Excluir:

- editor;
- diagnostics pesados salvo configurados;
- development metadata;
- unused assets.

---

# 149. Scene Compiler

Debe optimizar:

- authoring metadata removal;
- archetype grouping;
- references;
- static batching data;
- GPU buffers;
- hierarchy simplification;
- acceleration structures.

No hacer todas optimizaciones desde el principio.

Diseñar pipeline.

---

# 150. Runtime scripting abstraction

Aunque C# sea principal:

```text
ScriptRuntime
↓
DotNetWasmRuntime

```

Engine no debe quedar acoplado a detalles de C# más de lo necesario.

Esto permite runtimes futuros.

---

# 151. Background compilation

Compilación y asset processing no deben bloquear UI innecesariamente.

Usar Workers/daemon/job system.

---

# 152. Project Health

Antes de presentar cambio AI final:

ejecutar automáticamente health checks relevantes.

---

# 153. AI proposal report

Al finalizar una tarea, generar:

## Summary

Qué hizo.

## Changes

Archivos/entities/components modificados.

## Tests

Qué pruebas pasaron/fallaron.

## Performance

Impacto relevante.

## Visual evidence

Capturas mínimas útiles.

## Diagnostics

Warnings importantes.

## Accept / Continue / Reject

---

# 154. Definition of Done global

Una feature no está terminada si falta alguna de estas categorías relevantes:

- implementation;
- tests;
- integration;
- error handling;
- diagnostics;
- documentation;
- AI access;
- profiling where relevant;
- migration/versioning where relevant;
- benchmark where performance-sensitive.

---

# 155. Anti-patterns prohibidos

Evitar:

- giant god classes;
- arbitrary global singleton state;
- manual duplicated inspector metadata;
- file paths como identidad primaria;
- UI directamente modificando engine internals;
- strings como error IDs;
- full-state dumps a AI por defecto;
- blocking file operations on UI thread;
- entire-scene rebuild for trivial asset edit;
- renderer-owned gameplay state;
- scripts directly depending on browser DOM;
- hidden automatic behavior without diagnostics.

---

# 156. First execution instructions for Work

Al comenzar:

### Paso 1

Crear dentro del proyecto:

```text
docs/architecture/AXIOM_MASTER_SPEC.md

```

con esta especificación.

### Paso 2

Crear ADR iniciales.

### Paso 3

Crear:

```text
axiom.architecture.json

```

### Paso 4

Crear repo skeleton.

### Paso 5

Configurar build/test/CI.

### Paso 6

Implementar Milestone 0.

### Paso 7

Ejecutar todos los checks.

### Paso 8

Corregir errores.

### Paso 9

Documentar qué quedó implementado.

### Paso 10

Comenzar Milestone 1 sin esperar aprobación para decisiones menores.

---

# 157. Regla de autonomía de Work

No detener el desarrollo preguntando cosas del estilo:

- qué nombre poner a una clase;
- qué librería pequeña usar;
- qué framework UI usar;
- dónde colocar un archivo;
- cómo nombrar una función;
- qué algoritmo razonable elegir inicialmente.

Resolver técnicamente.

Medir.

Documentar si la decisión importa.

---

# 158. Regla de iteración

Cuando un approach falle:

1. investigar;
2. identificar causa;
3. registrar diagnóstico;
4. corregir;
5. agregar test que evite regresión;
6. continuar.

No reemplazar problemas reales por mocks permanentes.

---

# 159. Regla de alcance

No intentar implementar Unreal en el primer milestone.

Construir primero:

> un núcleo pequeño pero correcto.

Luego:

> capacidades cada vez más potentes alrededor de una arquitectura estable.

---

# 160. Identidad final del proyecto

Axiom deberá diferenciarse por cinco pilares:

## 1. Browser-native high-performance engine

WebGPU + Wasm.

## 2. Agent-native architecture

Las IAs son operadores completos.

## 3. Transactional AI development

La IA experimenta libremente sin destruir MAIN.

## 4. Self-observable engine

El motor puede explicar qué está ocurriendo.

## 5. Causal Diagnostics

El motor no solo devuelve estado; devuelve causalidad.

---

# 161. Principio rector final

Todo desarrollo futuro debe poder evaluarse contra esta pregunta:

> ¿Esta decisión acerca Axiom a convertirse en un motor potente, rápido, observable, reproducible y controlable nativamente por agentes sin empeorar innecesariamente la experiencia humana?

Si sí, avanzar.

Si no, reconsiderar.

---

# 162. Objetivo inmediato

El objetivo inmediato no es maximizar la cantidad de features.

Es lograr:

```text
small kernel
↓
correct architecture
↓
real executable beta
↓
AI control
↓
diagnostics
↓
gameplay
↓
performance
↓
progressive expansion

```

Una vez establecida esta base, ampliar Axiom de forma incremental hasta alcanzar el MVP y dejar el motor preparado para continuar hacia un engine de escala industrial.

---

# FIN DEL DOCUMENTO MAESTRO

## Approved roadmap extension — 2026-10-09

M18.1 OpenAI connection and multistep assistant; M18.2 integrated chat and editable preview; M18.3 assisted modular PMD; M18.4 GitHub integration; then original M19 hardening. See M18_EXTENSIONS_ROADMAP.md for acceptance boundaries, replacement-based Apply and revised 126-point reporting. AI Master remains disabled and planned beyond MVP.
