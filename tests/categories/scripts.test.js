// Filtre les anomalies de la thématique Scripts <=> RGAA-1.
const scanScripts = (audit) => {
  let inapplicable = audit.inapplicable.filter(item => item.tags.some(tag => tag.includes('RGAA-7.')));
  let passes = audit.passes.filter(item => item.tags.some(tag => tag.includes('RGAA-7.')));
  let incomplete = audit.incomplete.filter(item => item.tags.some(tag => tag.includes('RGAA-7.')));
  let violations = audit.violations.filter(item => item.tags.some(tag => tag.includes('RGAA-7.')));

  return {
    inapplicable,
    passes,
    incomplete,
    violations
  };
};

module.exports = scanScripts;
