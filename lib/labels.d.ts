export interface Label {
    name: string;
    color: string;
    lines: number;
}
export type Labels = {
    [key in 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL']: Label;
};
export declare const defaultLabels: Labels;
export type ReturnLabel = [string, string];
/**
 * generateSizeLabel will return a string label that can be assigned to a
 * GitHub Pull Request. The label is determined by the lines of code
 * in the Pull Request.
 * @param lineCount The number of lines in the Pull Request.
 * @param l The labels object
 * @return [string, string] The label and the color of the label.
 */
export declare function generateSizeLabel(lineCount: number, l: Labels): ReturnLabel | [];
