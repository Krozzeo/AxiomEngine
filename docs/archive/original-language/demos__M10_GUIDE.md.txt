# Demos M10

En PowerShell, desde AxiomEngine-m10:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

El comando crea dos proyectos nuevos y conserva los anteriores. No se ejecuta
automáticamente al abrir el editor. Repetirlo crea copias nuevas. Preserva todo
`.axiom/projects` (incluidos assets y scripts) al cambiar de versión.

## M10 Pixel Adventure

Abre Saved projects desde Archivo → Proyectos y elige esta demo.
Game muestra la cámara del juego incluso sin Play: tiles, personaje y cajas,
iluminación cálida/fría y un botón celeste arriba a la derecha. Todo permanece
quieto. Play inicia animación, caída de cajas y una fuente de partículas.

Si la compilación C# termina correctamente, usa A/D o flechas para moverte y
Espacio para saltar. El comando demo indica scriptStatus=completed; si falta .NET
10/wasm-tools conserva la escena y avisa que el controlador no está adjunto.
Las demás funciones siguen disponibles. Un clic en el botón celeste pausa todo;
se vuelve naranja. Otro clic reanuda. Stop restaura la escena inicial.

Para editar, detén Play. Selecciona Tilemap en Hierarchy: en Inspector escribe
el índice del tile en Brush y pulsa una celda. -1 borra; 0 suelo; 1 caja; 2 azul;
3 violeta; 4–7 cuadros del personaje. Cada celda permite Ctrl+Z / Ctrl+Y.
Los colliders Ground/Step son independientes: pintar tiles no crea físicas.

Selecciona Hero: cambia tamaño, frame, tint, order, flipX/Y y lista/fps/loop de
SpriteAnimation. En Scene, mueve Warm light con el gizmo para ver iluminación
instantánea. Cambia seed, velocidad, color y lifetime de Fountain; Play reinicia
la emisión reproducible. Guarda y reabre para conservar los cambios.

Ajustes → 2D Scene / Camera controla ambiente, fondo, pixelPerfect,
pixelsPerUnit y referenceHeight. Game usa muestreo nearest y escala entera;
Scene tiene cámara libre independiente. Cambiar Game no inicia Play.

## M10 Sprite Batching Lab

160 sprites comparten un atlas, con dos sprites transparentes superpuestos y
un personaje animado. En Game, detenido, Diagnostics → Frame diagnostics muestra
rendering.mode=2d, 164 quads y 2 batches/submitted (atlas y UI blanca).

Selecciona Alpha front y cambia order de 2 a 0: el azul pasa detrás del ámbar.
Ctrl+Z restaura el orden. Cambia tint alfa y flip; el batching conserva el orden.
Play anima el personaje; el botón celeste pausa/reanuda. renderer=null mantiene
los contadores y decisiones, con submitted=0 y pixels=unavailable.

Estas demos también sirven para inspeccionar tamaños visuales versus Collider,
componentes modulares, edición, Undo, persistencia y las APIs equivalentes.
