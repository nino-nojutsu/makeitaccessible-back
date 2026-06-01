// Filtre les anomalies de la thématique Structuration de l’information <=> RGAA-1.
const scanStructuration = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-9.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-9.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-9.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-9.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanStructuration;
