import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { gravityMetrics, gravitySpecs } from "./gravity-model";

describe("gravity learning model", () => {
  test("mass does not affect vacuum fall time", () => {
    assert.equal(gravityMetrics(9.81, 10, 200).fallTime, gravityMetrics(9.81, 120, 200).fallTime);
  });
  test("Moon gravity is 1.62 m/s² and increases jump height over Earth", () => {
    assert.equal(gravitySpecs("float")[0]?.suggested, 1.62);
    assert.ok(Math.abs(gravityMetrics(1.62, 40, 200).jumpHeight / gravityMetrics(9.81, 40, 200).jumpHeight - 9.81 / 1.62) < 0.001);
  });
  test("doubling impulse quadruples height", () => {
    assert.equal(gravityMetrics(9.81, 40, 400).jumpHeight, 4 * gravityMetrics(9.81, 40, 200).jumpHeight);
  });
  test("pendulum period uses the displayed 1.2 metre length", () => {
    assert.ok(Math.abs(gravityMetrics(9.81, 40, 200).period - 2 * Math.PI * Math.sqrt(1.2 / 9.81)) < 0.001);
  });
  test("recommendations change with the selected mission", () => {
    assert.equal(gravitySpecs("earth")[0]?.suggested, 9.81);
    assert.equal(gravitySpecs("strength")[0]?.suggested, 24.79);
  });
});