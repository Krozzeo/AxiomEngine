> Historical integration snapshot. Current account/version/export ownership and acceptance are in [Engine0.0.56 product integration](PRODUCT_INTEGRATION_0_0_56.md) and its audit.

# Platform MVP integration

Engine0.0.55 / scripting SDK8 consumes public Platform0.1.5 source f2131275ffed2d132383322959631484e8fc8ad5 by HTTPS with lockfile integrity. Product identity, IPC1 and native game format1 remain unchanged. The CI script-boundaries job now installs locked dependencies before running tests that import the shared lease. This fixes the missing-package failure in CI338 rather than skipping the check.

Platform connection/model preferences are separate. Products keep project-specific model/reasoning/task/approval configuration; Platform supplies defaults to consumers that opt into inheritance. Engine's existing project model and reasoning controls remain authoritative. Shared OS services open folders through Windows Shell without hiding Explorer.

The standalone exported-game requirement is transferred from Platform P4 to Game Engine's build/export planning. It remains unimplemented and is not declared passed or removed. Platform's MVP gate covers lifecycle, storage/import, services, review, isolation, two consumers and prepared distribution. Engine Unity/shader/compute/GPU M19–M40 receives no additional implementation credit. Older Engine issues and product-wide CI failures remain owned here rather than being silently waived as Platform acceptance.
