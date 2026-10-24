# Revisar correcciones de Inspector y escenas — 0.0.51

Generar proyectos nuevos con `npm run demo` y abrir el editor con `npm run dev`. El generador no reemplaza proyectos existentes. Los nombres de los laboratorios conservan M18.3.10; la versión del editor debe ser 0.0.51.

## References & Inspectors Lab

1. Abrir la demo. Hierarchy debe empezar por sus escenas, sin las dos líneas de ayuda/estado. El título ocupa su texto y el espacio libre queda a la derecha.
2. Activar Always active: el texto aparece antes del candado.
3. Elegir Reference Receiver. Panels → Inspector abre otro Inspector. Repetir: sigue habiendo una sola opción Inspector en Panels; Create no la incluye. Cerrar paneles permite crear otros, hasta ocho simultáneos.
4. Bloquear un Inspector en Reference Receiver y mantener otro con el mismo receptor. Empezar a arrastrar Reference Source: los campos compatibles de ambos paneles deben resaltar tenuemente. Al pasar por un destino compatible, ese campo resalta más. Soltar asigna la referencia y limpia todos los resaltados.
5. Repetir con Transform, el componente ReferenceMover y Assets/ReferenceSettings.json sobre sus campos correspondientes. Campos incompatibles, solo lectura y de otro proyecto no aceptan la referencia. Cancelar el arrastre limpia el resaltado.

## Scenes & Resources API Lab

1. Abrir la demo y, desde Project/Scenes, abrir Arena.scene por primera vez.
2. El cubo y el fondo deben usar el mismo renderizado que cuando se vuelve a Arena después de seleccionar Main Scene. No debe aparecer primero el cubo blanco/negro del renderizador legacy.
3. Cerrar y reabrir Arena; guardar y reabrir el proyecto. Debe conservar la configuración.

Automatización: `npm run test:browser:m18-3-11` cubre controles, menú y referencias; `npm run test:browser:m18-3-10` prueba los laboratorios reales; `npm run test:browser:m18-3-12` compara la primera apertura y la revisita. La comparación de píxeles requiere WebGPU: Null informa indisponibilidad, nunca aprobación visual GPU.
