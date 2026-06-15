// Calcul des totaux pour l'audit en cours avec reduce :
// On crée un nouvel objet summary qui a 4 propriétés (inapplicable, passes, incomplete, violations) initialisées à 0
// Pour chaque catégorie testée, à chaque itération du tableau newTests, reduce permet de calculer la sommes des longueurs des tableaux par propriétés.
// Pour acc = l'accumulateur (l'objet summary en cours de construction), pour chacune de ses propriétés, on additionne à chaque itération la longueur 
// des tableaux du test en cours (du document test courant de la catégorie en cours d'itération)
const calculateAuditSummary = (tests) => {
    // reduce parcourt le tableau tests et additionne la longueur des tableaux de chaque test pour obtenir les totaux globaux de l'audit
    const summary = tests.reduce(
        (acc, test) => {
            acc.inapplicable += test.inapplicable.length;
            acc.passes += test.passes.length;
            acc.incomplete += test.incomplete.length;
            acc.violations += test.violations.length;
            return acc;
        },
        { inapplicable: 0, passes: 0, incomplete: 0, violations: 0 }
    );

    // Total de toutes les règles évaluées, tous types confondus
    summary.total = summary.inapplicable + summary.passes + summary.incomplete + summary.violations;

    // Score = pourcentage de règles validées parmi les règles testables => incomplete et inapplicable sont exclus du calcul
    const rgaaScore = summary.passes + summary.violations;
    summary.score = rgaaScore > 0 ? Math.floor((summary.passes / rgaaScore) * 100) : null;

    return summary;
};

module.exports = { calculateAuditSummary };