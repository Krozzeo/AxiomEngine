# P2 — Consumo de servicios comunes

2026-10-21. Rama feat/p2-platform-services, base P1 integrada 400fec0. Mantiene formato 1 y scripting SDK 8. No supone integración de P2 en main.

## Responsabilidades

GitHubClient, selector de carpetas y resolución de Documentos se extraen a Platform. Los archivos antiguos del motor son reexports de la dependencia axiom-platform fijada por commit mediante HTTPS e integridad en package-lock. npm ci no necesita un checkout vecino, un enlace local o una clave SSH. HubSettings nativo conserva su formato y aplicaciones; usa las funciones comunes.

En sesiones alojadas, el adaptador conecta SharedGitHubClient al broker IPC de Platform. El host retiene la credencial y envía identidad/época; el motor solicita el transporte y mantiene la validación de publicación. Una conexión desde el editor transfiere el token al host sin retenerlo en ese cliente. Cerrar el producto no desconecta la cuenta global. Disconnect y expiración sí se propagan a las demás sesiones; revisiones de publicación anteriores se invalidan.

GitHubPublication conserva destinos/ramas/defaults/journal/historial. Cada carpeta de proyecto tiene metadatos bajo el perfil de Platform, fuera de los documentos. La configuración nativa anterior se adopta una sola vez para el ID abierto, con listas blancas de campos y sin otras identidades/credenciales; su origen y sus valores explícitos permanecen intactos.

## Importación

project.import y project.github.list son capacidades adicionales de protocolo 1 / API 0.1. El producto reconoce UUID/schemaVersion y elige recursos; Platform controla la raíz/grant, catálogo y copia acotada. Copia local preserva original y rechaza enlaces. Remota reutiliza validación del producto y operaciones de lectura del transporte común. Abrir también acepta carpeta que contiene exactamente un proyecto. No se cambia a un modelo de documento universal.

## Ejecución y pruebas

Después de actualizar esta rama: npm ci, npm run build, npm run check. Detener el host anterior y utilizar Platform P2. [Guía de Platform](https://github.com/Krozzeo/AxiomPlatform/blob/feat/p2-shared-services/docs/P2_GUIDE.md).

P1 fue aceptada manualmente por el usuario y aprobó CI antes de integrar. P2 tiene pruebas conjuntas del motor real con GitHub/control del selector simulados; no se presenta como un PAT real o diálogo manual. Revisar su CI independiente. [Informe](../reports/PLATFORM_P2_REPORT.md).

## Conservado

Arranque nativo, validaciones de bundle y MAIN guardado, divergencia sin overwrite, publicación incierta con reconciliación, preferencias de agente y defaults previos. M19–M40, Unity, shaders, GPU, #47/#51, rendimiento denso y modelo conectado no reciben crédito funcional por esta extracción.
