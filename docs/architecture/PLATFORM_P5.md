> Historical integration snapshot. Current account/version/export ownership and acceptance are in [Engine0.0.56 product integration](PRODUCT_INTEGRATION_0_0_56.md) and its audit.

# Platform P5 integration

Engine0.0.54 / scripting SDK8 consumes public Platform provider099d0d4c6098f434428793ebbe38d696e61f55c9 through HTTPS/package-lock integrity. Platform0.1.4 and independent Math Lab0.1.0 are review candidates alongside this Engine branch. IPC1/native game format1 are unchanged.

The adapter negotiates an explicit loopback Platform origin. Hosted HTTP editor responses authorize only that origin for framing and retain COEP/cross-origin isolation. Standalone editor responses retain frame-ancestors none; authentication/origin checks are unchanged. Platform owns a stable shell per project, blocks a disconnected editor and loads a new domain process on reopen. Named windows, Web Locks and host leases prevent duplicate hosted editors. The existing folder lease is now consumed from the public SDK, not reimplemented. Engine folder selection automatically uses the SDK's modern Windows common dialog. Local imports support selecting the native project file as well as its directory and preserve original files.

Math Lab imports no Game Engine modules and owns its calculation format/evaluator/proposals. Its existence demonstrates a second consumer, not an Engine scripting/rendering/physics feature. Global AI settings cover transport only; Engine project model, task limits, PMD, semantic tools and human Apply remain domain owned.

Validation: local full Engine check447/447; Platform36 and Math6; joint browser P5 plus P1–P4 regressions with controlled HTTP/Null. Initial full Engine run observed a transient EPERM renaming AI settings; full repeat passed without claiming that filesystem risk is fixed. Interactive native Open/Save and real account/model/GPU behavior require their separate acceptance.

P4 standalone exported-game gate remains open because this Engine has no game export pipeline. Main/recovery refs, older #47/#51/#55 and dense performance issues remain separate. M19–M40 Unity/shader/compute/GPU planning is unchanged and receives no new API coverage credit. Current UI/docs are English, public source MIT.
