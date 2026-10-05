# Demos M12

Ejecuta npm.cmd ci, npm.cmd run demo, npm.cmd run dev y abre los proyectos M12
mediante Archivo → Proyectos. El comando crea dos proyectos nuevos y preserva
los existentes; repetirlo crea copias. Preserva .axiom/projects completo al actualizar.
Usa un volumen cómodo. Scene y Game sin Play son silenciosos.

## Spatial Sound Stage

Una esfera representa la fuente de un tono; Listener está en el origen y mira -Z.
En Game → Play deberías escuchar el tono principalmente a la izquierda. Selecciona
la esfera: AudioSource muestra volumen, bus, loop, rate, distancias y spatial.
Durante Play, los botones play/pause/resume/stop audio controlan esa fuente.
Runtime volume modifica el volumen sin guardar el proyecto. Stop del motor
restaura el estado y posición iniciales. El Inspector muestra playhead y motivos.
Con el controlador C# compilado: flechas izquierda/derecha mueven la esfera y el
sonido cambia de lado/distancia; 1 pausa, 2 reanuda, 3 detiene, 4 reinicia y 5
baja el volumen. El teclado se dirige a Game durante Play.
Compilar el controlador requiere .NET 10/wasm-tools; si falta, el Inspector funciona.

Para cambiar manualmente fuente/listener, detén Play, edita sus Transform y vuelve
a ejecutar. AudioListener toma la orientación de su entidad; sin listener explícito
se utiliza la cámara Game. El movimiento de la cámara Scene no cambia la escucha.

## Streaming Mixer Lab

Un tono estéreo de 90 segundos en Music se reproduce mediante fragmentos PCM;
no se decodifica el archivo completo en el navegador. Selecciona Streaming music
para pausar/reanudar/reiniciar y ver queuedFrames, capacityFrames y underruns.
La entidad One-shot empieza detenida: selecciona y pulsa play audio durante Play;
escucharás un tono agudo de un segundo y después figurará que terminó.

Ajustes → Audio mixer permite editar buses, sus volúmenes, mute y filtro lowpass
cuando Play está detenido. Durante Play, Runtime master volume y los botones
Set bus / Mute / Unmute modifican solamente la sesión. Silenciar Music permite
escuchar el efecto aislado; silenciar un bus no detiene su reloj. Para comprobar
el filtro, detén Play, baja lowpassHz de Music y vuelve a Play.

## Diagnósticos y activación

Diagnostics → Frame diagnostics → audio muestra el backend, contextState,
masterRms/stereoRms, memoria, listener, buses y fuentes. whyAudioNotPlaying indica
la causa: pausa, fin, Scene, mute, volumen cero, buffering o bloqueo del navegador.
Si pide activación, pulsa Enable browser audio en Ajustes → Audio mixer.
Con renderer=null no se produce sonido: el motivo lo indica explícitamente.
Los controles transitorios se descartan al hacer Stop; los cambios del Inspector
se guardan y admiten Ctrl+Z. Importa WAV PCM; fuentes largas requieren stream.
