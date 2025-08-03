/**
 * Parses a JSON string into an object or list of objects.
 * Throws a detailed error if parsing fails or if the structure is invalid.
 *
 * @param {string} jsonString - The input JSON string.
 * @returns {Object|Object[]} - The parsed object or array of objects.
 */
export function parse2Json(str) {
  try {
    // Use `eval` in a safe wrapper (assumes the string is trusted!)
    const wrapped = `(${str})`; // wrap in () to treat as expression
    const result = eval(wrapped);

    if (!Array.isArray(result)) {
      throw new Error("Parsed result is not an array.");
    }

    return result;
  } catch (err) {
    throw new Error("Failed to parse object array: " + err.message);
  }
}


 /**
 * Formats a list of flat JSON objects:
 * - Each object on one line
 * - Values aligned column-wise
 * - Output wrapped in [ ] like valid JSON array
 *
 * @param {Object[]} jsonArray - The array of JSON objects
 * @returns {string} - Formatted JSON array string
 */
export function parse2String(jsonArray) {
  if (!Array.isArray(jsonArray)) {
    throw new Error("Input must be an array of objects.");
  }

  // Get all unique keys across non-empty objects
  const allKeys = [...new Set(
    jsonArray.flatMap(obj =>
      obj && typeof obj === "object" && Object.keys(obj).length > 0
        ? Object.keys(obj)
        : []
    )
  )];

  // Determine max lengths for key and value alignment
  const keyWidths = {};
  const valueWidths = {};

  allKeys.forEach(key => {
    keyWidths[key] = key.length;
    valueWidths[key] = 0;
  });

  for (const obj of jsonArray) {
    if (typeof obj !== "object" || obj === null) continue;
    for (const key of allKeys) {
      const val = obj[key];
      const valStr = obj.hasOwnProperty(key)
        ? (typeof val === "string" ? `"${val}"` : String(val))
        : "";
      valueWidths[key] = Math.max(valueWidths[key], valStr.length);
    }
  }

  // Format each object
  const lines = jsonArray.map(obj => {
    if (!obj || Object.keys(obj).length === 0) return "  {}";

    const parts = allKeys.map(key => {
      const keyStr = key.padEnd(keyWidths[key]);
      const val = obj.hasOwnProperty(key)
        ? (typeof obj[key] === "string" ? `"${obj[key]}"` : String(obj[key]))
        : "";
      const valStr = val.padEnd(valueWidths[key]);
      return `${keyStr} : ${valStr}`;
    });

    return "  { " + parts.join(", ") + " }";
  });

  return "[\n" + lines.join(",\n") + "\n]";
}
