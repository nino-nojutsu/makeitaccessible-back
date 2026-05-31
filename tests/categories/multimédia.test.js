// Filtre les anomalies de la thématique Images <=> RGAA-4.
const scanImages = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-4.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-4.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-4.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-4.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanImages;
