import {defaultLabels, generateSizeLabel} from '../src/labels';

test('generate size label', async () => {
  expect(generateSizeLabel(0, defaultLabels)).toEqual(['3CBF00', 'size/XS']);
  expect(generateSizeLabel(12, defaultLabels)).toEqual(['5D9801', 'size/S']);
  expect(generateSizeLabel(30, defaultLabels)).toEqual(['7F7203', 'size/M']);
  expect(generateSizeLabel(100, defaultLabels)).toEqual(['A14C05', 'size/L']);
  expect(generateSizeLabel(500, defaultLabels)).toEqual(['C32607', 'size/XL']);
  expect(generateSizeLabel(1000, defaultLabels)).toEqual(['E50009', 'size/XXL']);
});

export {};
