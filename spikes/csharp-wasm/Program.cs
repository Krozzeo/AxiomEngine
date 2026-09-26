using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

[assembly: SupportedOSPlatform("browser")]

namespace Axiom.ScriptSpike;

public readonly record struct Transform(float X, float Y, float Z);

public static partial class Program
{
    public static void Main()
    {
        var transform = Move(new Transform(0, 0, 0), 1.0f / 60.0f, 6.0f);
        Console.WriteLine($"AX_SCRIPT_0001 position={transform.X:F4},{transform.Y:F4},{transform.Z:F4}");
    }

    [JSExport]
    public static double MoveX(double x, double delta, double speed) => x + delta * speed;

    public static Transform Move(Transform value, float deltaSeconds, float speed) =>
        value with { X = value.X + (deltaSeconds * speed) };
}

