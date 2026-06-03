// Filtre les resultats (inapplicable, passes, incomplete et violiations "aka" anomalies) liées RGAA par thématique : thématique Images <=> RGAA-1.
const scanCouleurs = (audit) => {
  let inapplicable = audit.inapplicable.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-3.")),
  );
  let passes = audit.passes.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-3.")),
  );
  let incomplete = audit.incomplete.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-3.")),
  );
  let violations = audit.violations.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-3.")),
  );

  return {
    inapplicable,
    passes,
    incomplete,
    violations,
  };
};

module.exports = scanCouleurs;
