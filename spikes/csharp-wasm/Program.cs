namespace Axiom.ScriptSpike;

public readonly record struct Transform(float X, float Y, float Z);

public static class Program
{
    public static void Main()
    {
        var transform = Move(new Transform(0, 0, 0), 1.0f / 60.0f, 6.0f);
        Console.WriteLine($"AX_SCRIPT_0001 position={transform.X:F4},{transform.Y:F4},{transform.Z:F4}");
    }

    public static Transform Move(Transform value, float deltaSeconds, float speed) =>
        value with { X = value.X + (deltaSeconds * speed) };
}

