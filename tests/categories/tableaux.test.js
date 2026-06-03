// Filtre les resultats (inapplicable, passes, incomplete et violiations "aka" anomalies) liées RGAA par thématique : thématique Images <=> RGAA-1.
const scanTableaux = (audit) => {
  let inapplicable = audit.inapplicable.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-5.")),
  );
  let passes = audit.passes.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-5.")),
  );
  let incomplete = audit.incomplete.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-5.")),
  );
  let violations = audit.violations.filter((item) =>
    item.tags.some((tag) => tag.includes("RGAA-5.")),
  );

  return {
    inapplicable,
    passes,
    incomplete,
    violations,
  };
};

module.exports = scanTableaux;
