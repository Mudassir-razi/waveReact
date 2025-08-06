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
export function parse2String(tree) {
  const keySet = new Set();

  // First pass: collect all keys from all objects in the tree
  function collectKeys(node) {
    if (Array.isArray(node)) {
      const start = typeof node[0] === "string" ? 1 : 0;
      for (let i = start; i < node.length; i++) {
        collectKeys(node[i]);
      }
    } else if (typeof node === "object" && node !== null) {
      for (const key of Object.keys(node)) {
        keySet.add(key);
      }
    }
  }

  collectKeys(tree);
  const allKeys = [...keySet];

  // Compute key and value widths
  const keyWidths = {};
  const valueWidths = {};

  allKeys.forEach(key => {
    keyWidths[key] = key.length;
    valueWidths[key] = 0;
  });

  function scanValues(node) {
    if (Array.isArray(node)) {
      const start = typeof node[0] === "string" ? 1 : 0;
      for (let i = start; i < node.length; i++) {
        scanValues(node[i]);
      }
    } else if (typeof node === "object" && node !== null) {
      for (const key of allKeys) {
        const val = node.hasOwnProperty(key)
          ? (typeof node[key] === "string" ? `"${node[key]}"` : String(node[key]))
          : "";
        valueWidths[key] = Math.max(valueWidths[key], val.length);
      }
    }
  }

  scanValues(tree);

  // Format one object with aligned keys
  function formatObject(obj, indent) {
    if (!obj || Object.keys(obj).length === 0) return indent + "{}";

    const parts = allKeys.map(key => {
      const keyStr = key.padEnd(keyWidths[key]);
      let val;
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === "string") {
          val = `"${value}"`;
        } else {
          val = String(value);
        }
      } else {
        val = `" "`; // Explicitly add a blank string in quotes
      }

      const valStr = val.padEnd(valueWidths[key]);
      return `${keyStr} : ${valStr}`;
    });

    return indent + "{ " + parts.join(", ") + " }";
  }

  // Recursively format any node
  function formatNode(node, indent = "  ") {
    if (Array.isArray(node)) {
      const groupName = node[0];
      const children = node.slice(1);
      const lines = [`${indent}["${groupName}",`];

      for (let i = 0; i < children.length; i++) {
        const line = formatNode(children[i], indent + "  ");
        lines.push(line + (i < children.length - 1 ? "," : ""));
      }

      lines.push(`${indent}]`);
      return lines.join("\n");
    } else if (typeof node === "object" && node !== null) {
      return formatObject(node, indent);
    } else {
      return indent + JSON.stringify(node);
    }
  }

  // Top level list
  const outputLines = ["["];
  for (let i = 0; i < tree.length; i++) {
    const formatted = formatNode(tree[i], "  ");
    outputLines.push(formatted + (i < tree.length - 1 ? "," : ""));
  }
  outputLines.push("]");

  return outputLines.join("\n");
}



/**
 * Recursively flattens a tree-like JSON list into a flat list of signal objects.
 * Only objects with "name" and "data" keys are included.
 * Empty objects `{}` are preserved in the result.
 * 
 * @param {Array} tree - The nested JSON tree
 * @returns {Array<Object>} - A flat list of signal and empty objects
 */
export function flattenJson(tree) {
  const result = [];

  function dfs(node) {
    if (Array.isArray(node)) {
      const startIdx = typeof node[0] === "string" ? 1 : 0;
      for (let i = startIdx; i < node.length; i++) {
        dfs(node[i]);
      }
    } else if (typeof node === "object" && node !== null) {
      if (Object.keys(node).length === 0) {
        result.push({}); // preserve empty objects
      } else if ('name' in node && 'wave' in node) {
        result.push(node);
      }
      // else: ignore partial/invalid objects
    }
  }

  dfs(tree);
  return result;
}
