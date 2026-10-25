import { describe, expect, test } from "bun:test";
import { gravityMetrics, gravitySpecs } from "./gravity-model";

describe("gravity learning model", () => {
  test("mass does not affect vacuum fall time", () => {
    expect(gravityMetrics(9.81, 10, 200).fallTime).toBe(gravityMetrics(9.81, 120, 200).fallTime);
  });
  test("Moon gravity is 1.62 m/s² and increases jump height over Earth", () => {
    expect(gravitySpecs("float")[0].suggested).toBe(1.62);
    expect(gravityMetrics(1.62, 40, 200).jumpHeight / gravityMetrics(9.81, 40, 200).jumpHeight).toBeCloseTo(9.81 / 1.62);
  });
  test("doubling impulse quadruples height", () => {
    expect(gravityMetrics(9.81, 40, 400).jumpHeight).toBe(4 * gravityMetrics(9.81, 40, 200).jumpHeight);
  });
  test("pendulum period uses the displayed 1.2 metre length", () => {
    expect(gravityMetrics(9.81, 40, 200).period).toBeCloseTo(2 * Math.PI * Math.sqrt(1.2 / 9.81));
  });
  test("recommendations change with the selected mission", () => {
    expect(gravitySpecs("earth")[0].suggested).toBe(9.81);
    expect(gravitySpecs("strength")[0].suggested).toBe(24.79);
  });
});