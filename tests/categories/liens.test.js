// Filtre les anomalies de la thématique Images <=> RGAA-6.
const scanImages = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-6.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-6.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-6.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-6.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanImages;
