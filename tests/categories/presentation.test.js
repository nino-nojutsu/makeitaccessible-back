// Filtre les anomalies de la thématique Présentation de l’information <=> RGAA-10.
const scanPresentation = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-10.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-10.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-10.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-10.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanPresentation;
