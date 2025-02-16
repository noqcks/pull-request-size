interface Label {
  name: string;
  lines: number;
  color: string;
  comment?: string;
  description?: string;
}

export interface Labels {
  XS: Label;
  S: Label;
  M: Label;
  L: Label;
  XL: Label;
  XXL: Label;
  [key: string]: Label;
}

export interface CustomLabels {
  [key: string]: Label;
}

const labels: Labels = {
  XS: {
    name: "size/XS",
    lines: 0,
    color: "3CBF00", // Bright green
  },
  S: {
    name: "size/S",
    lines: 10,
    color: "5D9801", // Green
  },
  M: {
    name: "size/M",
    lines: 30,
    color: "7F7203", // Yellow-green
  },
  L: {
    name: "size/L",
    lines: 100,
    color: "A14C05", // Orange
  },
  XL: {
    name: "size/XL",
    lines: 500,
    color: "C32607", // Red-orange
  },
  XXL: {
    name: "size/XXL",
    lines: 1000,
    color: "E50009", // Red
  },
};

/**
 * Generates a size label and color for a GitHub Pull Request based on the total number of lines changed.
 * Returns a tuple containing the color and name of the appropriate size label.
 *
 * The size thresholds are defined in the Labels object, with each size (XS, S, M, L, XL, XXL)
 * having a specific line count threshold, color, and name.
 *
 * @param lineCount - Total number of lines added and deleted in the PR
 * @param l - Labels object containing the size thresholds and label properties
 * @returns [color, name] - Tuple containing the hex color code and label name
 */
function generateSizeLabel(lineCount: number, l: Labels): [string, string] {
  if (lineCount < l.S.lines) {
    return [l.XS.color, l.XS.name];
  }
  if (lineCount < l.M.lines) {
    return [l.S.color, l.S.name];
  }
  if (lineCount < l.L.lines) {
    return [l.M.color, l.M.name];
  }
  if (lineCount < l.XL.lines) {
    return [l.L.color, l.L.name];
  }
  if (lineCount < l.XXL.lines) {
    return [l.XL.color, l.XL.name];
  }
  return [l.XXL.color, l.XXL.name];
}

export default {
  labels,
  generateSizeLabel,
};
