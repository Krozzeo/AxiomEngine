# Estado de Scripting API — 0.0.49 / SDK 8

La ampliación M19–M39 sigue planificada. Este corte añade activación compartida por Inspector/C#, propiedad GameObject.scene y persistencia de escenas completas mediante Always active, además de correcciones de referencias y rendimiento. No representa paridad completa con Unity ni cierra ninguna de las nueve áreas históricas, que siguen parciales.

```csharp
var managers = SceneManager.GetSceneByName("Managers");
SceneManager.SetSceneAlwaysActive(managers, true); // extensión de Axiom
GetComponent<Light>()!.enabled = false;
enabled = false; // desactiva este script; puede reactivarse desde otro script/Inspector
```

Los cambios de Play se descartan en Stop. Se ejecuta la escena activa más las marcadas; LoadScene Single conserva Managers. El candado se guarda y es deshacible en Edit. No sustituye a DontDestroyOnLoad para objetos individuales. Scene.alwaysActive/SetSceneAlwaysActive/IsSceneAlwaysActive son extensiones propias, no miembros de Unity.

Capacidad: 65.536 entidades/cuerpos/draws, combinada con presupuestos de geometría, proyecto, mensajes y tiempo. 32 scripts y 128 operaciones por respuesta se conservan. Implementar y comprobar por tandas: M19 debe fijar el denominador y las pruebas de conformidad antes de publicar porcentajes precisos.

[Informe y evidencia](../reports/M18_3_11_CURRENT_REPORT.md). Referencias oficiales: [Behaviour.enabled](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Behaviour-enabled.html) y [LoadScene](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/SceneManagement.SceneManager.LoadScene.html). El modo Always active es deliberadamente específico de Axiom.
