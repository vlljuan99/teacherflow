import { describe, it, expect } from "vitest";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

// El setup global fija WHATSAPP_DEFAULT_COUNTRY_CODE = "34".
describe("normalizeWhatsAppNumber", () => {
  it("elimina espacios, guiones y paréntesis", () => {
    expect(normalizeWhatsAppNumber("+34 612 345 678")).toBe("34612345678");
  });

  it("quita el prefijo '+' internacional", () => {
    expect(normalizeWhatsAppNumber("+447911123456")).toBe("447911123456");
  });

  it("convierte el prefijo '00' en internacional", () => {
    expect(normalizeWhatsAppNumber("0034612345678")).toBe("34612345678");
  });

  it("antepone el código de país por defecto a números locales", () => {
    expect(normalizeWhatsAppNumber("612345678")).toBe("34612345678");
  });

  it("elimina el cero inicial local antes de anteponer el país", () => {
    expect(normalizeWhatsAppNumber("0612345678")).toBe("34612345678");
  });

  it("no duplica el país si ya viene incluido", () => {
    expect(normalizeWhatsAppNumber("34612345678")).toBe("34612345678");
  });

  it("devuelve null si no quedan dígitos", () => {
    expect(normalizeWhatsAppNumber("abc")).toBeNull();
  });

  it("devuelve null si tras anteponer el país sigue siendo demasiado corto (<8 dígitos)", () => {
    // "12345" -> "3412345" (7 dígitos) < 8 -> null
    expect(normalizeWhatsAppNumber("12345")).toBeNull();
    expect(normalizeWhatsAppNumber("123")).toBeNull();
  });
});
