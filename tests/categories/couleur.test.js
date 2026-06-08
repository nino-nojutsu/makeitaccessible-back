// Filtre les anomalies de la thématique Images <=> RGAA-3.
const scanImages = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-3.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-3.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-3.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-3.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanImages;
