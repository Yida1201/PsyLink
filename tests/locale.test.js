import { expect, test } from "bun:test";
import { preferredLocale } from "../lib/psylink/i18n";
test("browser locale maps supported languages and respects preference order", () => {
  for (const [input, expected] of [["zh-TW","zh-CN"],["zh-CN","zh-CN"],["en-GB","en-US"],["es-MX","es"],["ja-JP","ja"],["ko-KR","ko"]]) expect(preferredLocale([input])).toBe(expected);
  expect(preferredLocale(["fr-FR","ja-JP","en-US"])).toBe("ja");
  expect(preferredLocale(["fr-FR"])).toBe("en-US");
  expect(preferredLocale([])).toBe("en-US");
});
