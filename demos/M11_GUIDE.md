# Demos M11

Desde la carpeta extraída: `npm.cmd ci`, `npm.cmd run demo`, `npm.cmd run dev`.
Archivo → Proyectos → abre las que comienzan con M11. El comando conserva todos
los proyectos anteriores y crea tres nuevos; repetirlo crea copias. Preserva
`.axiom/projects` completo al actualizar. Estas demos no requieren compilar C#.

## Skinned Robot Studio

Dos modelos turquesa con tres articulaciones. Game sin Play muestra la pose base.
Play anima el de la izquierda; el derecho está configurado con autoplay apagado.
Selecciona el de la izquierda en Hierarchy y mira Animator en Inspector.
Runtime controls → Pause Animator / Resume Animator congela/reanuda solo ese modelo.
Set energy = 1 hace la transición suave de Idle a Wave; 0 regresa a Idle.
Runtime state → Bounce, Crossfade seconds = 0.5, Transition now: mezcla hacia
un salto, termina y vuelve a Idle (si energy es 1 luego vuelve a Wave).
Stop restaura la pose inicial y descarta estos controles transitorios.

Sin Play puedes editar estados, clips Idle/Wave/Bounce, speed, loop, parámetros y
transiciones, aplicar Animator y deshacer con Ctrl+Z. Los cambios se guardan;
los controles de Runtime no cambian el proyecto. Puedes agregar/quitar Animator
en modelos GLB animados importados. Los clips deben existir en el recurso.

## Clip and State Lab

Dos bloques con animación de nodo rígido, sin esqueleto. Los controles son iguales.
Comprueba que el izquierdo gira en Play; Resume Animator activa el derecho.
Bounce muestra traslación y Wave una rotación más amplia. No controla físicas.

## Pixel Scene Clarity

Un personaje pixelado para comparar Scene y Game. Ambos mantienen colores y
bordes nítidos. Scene sigue permitiendo zoom, órbita y movimiento; Game mantiene
escala entera y cámara pixel-perfect. Con zoom no entero o rotación puede cambiar
la distribución de píxeles, pero no se mezcla la textura con sus vecinos.

Diagnostics → Frame diagnostics → animation muestra currentAnimation, state,
time, transition, paused y whyAnimationNotPlaying. Inspector también muestra esos
datos con frame/generation. renderer=null procesa animación y diagnóstico sin GPU.
La API animation.query devuelve evidencia observada o unavailable si no hay un
editor actualizado. animation.control ofrece los mismos controles transitorios.

Soporte GLB: skins, TRS, LINEAR/STEP; no morphs, CUBICSPLINE, IK, retargeting,
root motion o eventos. Hasta 16 Animator y 65536 vértices animados por escena.
