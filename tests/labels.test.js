const labels = require('../src/labels');

test('generate size label', async () => {
  expect(labels.generateSizeLabel(0, labels.labels)).toEqual(['3CBF00', 'size/XS']);
  expect(labels.generateSizeLabel(12, labels.labels)).toEqual(['5D9801', 'size/S']);
  expect(labels.generateSizeLabel(30, labels.labels)).toEqual(['7F7203', 'size/M']);
  expect(labels.generateSizeLabel(100, labels.labels)).toEqual(['A14C05', 'size/L']);
  expect(labels.generateSizeLabel(500, labels.labels)).toEqual(['C32607', 'size/XL']);
  expect(labels.generateSizeLabel(1000, labels.labels)).toEqual(['E50009', 'size/XXL']);
});
