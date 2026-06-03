// lib/conversions.ts
// All unit conversion utilities - pure functions, no side effects

export type Dimension = "weight" | "volume" | "count";
export type Unit = "g" | "kg" | "mL" | "L" | "ea";

// Each unit maps to its base unit and the factor to multiply to get base units
// e.g. 1 kg = 1000 g  →  factor = 1000
export const UNIT_CONFIG: Record<
  Unit,
  { dimension: Dimension; baseUnit: Unit; factor: number; label: string }
> = {
  g:  { dimension: "weight", baseUnit: "g",  factor: 1,    label: "grams (g)" },
  kg: { dimension: "weight", baseUnit: "g",  factor: 1000, label: "kilograms (kg)" },
  mL: { dimension: "volume", baseUnit: "mL", factor: 1,    label: "milliliters (mL)" },
  L:  { dimension: "volume", baseUnit: "mL", factor: 1000, label: "liters (L)" },
  ea: { dimension: "count",  baseUnit: "ea", factor: 1,    label: "units (ea)" },
};

export const DIMENSION_BASE_UNIT: Record<Dimension, Unit> = {
  weight: "g",
  volume: "mL",
  count:  "ea",
};

export const DIMENSION_UNITS: Record<Dimension, Unit[]> = {
  weight: ["g", "kg"],
  volume: ["mL", "L"],
  count:  ["ea"],
};

/**
 * Convert a quantity from a given unit to the base unit of that dimension.
 * e.g. toBaseUnit(2, "kg") = 2000 (grams)
 */
export function toBaseUnit(quantity: number, unit: Unit): number {
  return quantity * UNIT_CONFIG[unit].factor;
}

/**
 * Convert a quantity from the base unit to a target display unit.
 * e.g. fromBaseUnit(2000, "kg") = 2
 */
export function fromBaseUnit(baseQty: number, targetUnit: Unit): number {
  return baseQty / UNIT_CONFIG[targetUnit].factor;
}

/**
 * Get conversion factor between two units of the same dimension.
 * Useful when going from one display unit to another.
 */
export function getConversionFactor(fromUnit: Unit, toUnit: Unit): number {
  return UNIT_CONFIG[fromUnit].factor / UNIT_CONFIG[toUnit].factor;
}

/**
 * Calculate the price per the given display unit, given a price per base unit.
 * e.g. pricePerBaseUnit = 500 INR/g → pricePerUnit("kg") = 500000 INR/kg
 */
export function pricePerDisplayUnit(
  pricePerBaseUnit: number,
  displayUnit: Unit
): number {
  return pricePerBaseUnit * UNIT_CONFIG[displayUnit].factor;
}

/**
 * Calculate total price for an order line.
 * quantity is in displayUnit.
 */
export function calculateLineTotal(
  quantity: number,
  displayUnit: Unit,
  pricePerBaseUnit: number
): number {
  const baseQty = toBaseUnit(quantity, displayUnit);
  return baseQty * pricePerBaseUnit;
}

/**
 * Format a number as Indian Rupees.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a quantity with its unit label, using sensible precision.
 */
export function formatQuantity(qty: number, unit: Unit): string {
  const precision = qty % 1 === 0 ? 0 : 4;
  return `${qty.toFixed(precision)} ${unit}`;
}
