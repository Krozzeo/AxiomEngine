# M18.4 — Pruebas conectadas en TestRepo

Resultado: **6/6 comprobaciones aprobadas** usando el servicio de publicación del motor y GitHub real a través del conector. Alcance preciso: transporte Git delegado; autenticación por contraseña/token y mutación GraphQL nativos de la aplicación no ejecutados.

- Repositorio autorizado: [Krozzeo/TestRepo](https://github.com/Krozzeo/TestRepo). **Solo pruebas; no contiene las demos de esta entrega.**
- Rama de la ejecución completa: `axiom-tests/m18-4-282b799a`.
- Fixture sintético: `project://ab4bc033-791c-4c01-a84a-2727af1e5c01`, sin cubo, cámara ni contenidos de las demos. Fuente JSON con iteraciones 1 y 2.
- [Primera publicación](https://github.com/Krozzeo/TestRepo/commit/9faf889796b396ae7d849e1a4b62a063514c70ec); [segunda publicación recuperada](https://github.com/Krozzeo/TestRepo/commit/49852a8726742fb2bfe96236a9a22eab5c771646).

Se descarga el contenido publicado y se compara byte a byte con el bundle canónico; `ProjectStore` lo reabre y recupera la iteración 1. La segunda publicación provoca intencionalmente una respuesta perdida después del commit remoto. Se reconstruye `GitHubPublication` desde su diario local y el reintento recupera el mismo identificador/commit: exactamente dos publicaciones en esa rama. Un commit externo posterior produce `AX_GITHUB_0004` al preparar otro envío, preservando el cambio remoto. El perfil no contiene el marcador de sesión del adaptador.

El repositorio estaba vacío. Fue necesario inicializar `main` con un README (b6f7f930c84eb5532c0bbcf1ec1c933feff76429); **después de esa preparación**, las operaciones de prueba se limitaron a ramas separadas. `main` y su README no cambiaron durante la ejecución completa. Dos ramas preparatorias conservan primeras publicaciones de intentos interrumpidos al adaptar el lector del conector: este devuelve texto decodificado en lugar del envelope REST de blobs. No se cuentan esos intentos como aprobados ni se borró/reemplazó su historial. La rama indicada arriba contiene la ejecución completa aprobada.

Los [recibos y hashes](m18-4-connected-test.json) identifican las seis comprobaciones. No se usó ningún token del usuario en estos archivos. La validación nativa pendiente queda aplazada por [ADR-0034](../adr/0034-m18-4-closure-and-deferred-native-account-check.md).
