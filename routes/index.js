var express = require("express");
var router = express.Router();
const runAllTests = require("../tests/runAllTests.js");
const Site = require("../models/sites.js");
const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");
let auditResults;

const createAudit = async (url, siteId) => {
  const audit = new Audit({
    url,
    status: "pending",
    createdAt: Date.now(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      inapplicable: 0,
      incomplete: 0,
      score: 0,
    },
    site: siteId,
  });

  // On enregistre le nouvel audit
  // save est asynchrone: on doit attente le retour de la promesse qui valide l'enregistrement d'un audit
  const newAudit = await audit.save();
  // console.log(`Audit ${newAudit} has been saved!`);

  return newAudit;
};

const createTests = async (category, resultsByFilteredCategory, auditId) => {
  // Le modèle devrait s'appeller "Test"
  const test = new Test({
    category,
    inapplicable: resultsByFilteredCategory.inapplicable,
    passes: resultsByFilteredCategory.passes,
    incomplete: resultsByFilteredCategory.incomplete,
    violations: resultsByFilteredCategory.violations,
    audit: auditId,
  });

  // On enregistre le nouveau test
  // save est asynchrone: on doit attente le retour de la promesse qui valide l'enregistrement d'un test
  const newTest = await test.save();
  // console.log(`Test ${newTest} has been saved!`);

  return newTest;
};

// Route POST qui lance un audit et récupère la key url dans le corps de la requête
router.post("/audit", async (req, res) => {
  const { url, name, domain } = req.body;
  
  // Regex pour vérifier si conforme : doit commencer par https:// + obligation d'avoir un point avec des caractères de chaque côté.
  const urlCheck = /^https:\/\/.+\..+/;

  // !url = true si url est undefined, null
  // !urlCheck.test(url) = true si l'url ne correspond pas au format
  // .test() = méthode native RegExp, prend une string et retourne true/false selon si la regex matche ou pas
  if (!url || !urlCheck.test(url)) {
    res.status(403).json({ result: false, error: "Missing or empty url" });
    return;
  }

  // Lance le scan via runAllTests et on "attend" le retour des résultats avant d'enregistrer un site
  try {
    auditResults = await runAllTests(url);
  } catch (error) {
    console.error(error);
  }

  // Si on a des résultats (anomalies, etc...)
  if (auditResults) {
    // res.status(200).json({ result: true, auditResults });
    // return;

    // Vérifie si un site existe déjà
    Site.findOne({ domain }).then((site) => {
      // Si un site existe déjà, on enregistre un nouveau site dans la collection "sites"
      if (site === null) {
        const website = new Site({
          name,
          domain,
          createdAt: Date.now(),
        });

        // On attend que le site s'enregistre, puis on créé un nouvel audit
        website.save().then(async (newSite) => {
          // On attend que le nouvel audit s'enregistre
          try {
            const newAudit = await createAudit(url, newSite._id);
          } catch (error) {
            console.error(error);
          }

          // Si un nouvel a été enregisté en bdd
          if (newAudit) {
            // On enregistre chaque test (devrait s'appeller test) dans un tableau de promesses
            // => Pour l'instant on remonte tous les résultats (pas que les violations/anomalies)
            const promises = auditResults.map(async (result) => {
              return await createTests(
                result.category,
                result.resultsByFilteredCategory,
                newAudit._id,
              );
            });

            // On attend que toutes les promesses soient résolues => on attends que toutes les tests soient enregistrées en bdd
            // Promise.all renvoie lui même une promesse...
            Promise.all(promises).then((newTests) => {
              // console.log("newTests", newTests);
              // console.log(`All ${newTests} have been saved!`);

              // Calcul des totaux pour l'audit en cours

              // reduce :
              // On crée un nouvel objet summary qui a 4 propriétés (inapplicable, passes, incomplete, violations) initialisées à 0
              // Pour chaque catégorie testée, à chaque itération, reduce permet de calculer la sommes des longeurs des tableaux par propriétés :
              // pour acc = l'accumulateur (l'objet summary en cours de construction), pour chacune de ses propriétés,
              // on additionne à chaque itération la longueur des tableaux du test courant (du document test courant de la catégorie en cours d'itération)
              const summary = newTests.reduce(
                (acc, test) => {
                  acc.inapplicable += test.inapplicable.length;
                  acc.passes += test.passes.length;
                  acc.incomplete += test.incomplete.length;
                  acc.violations += test.violations.length;
                  return acc;
                },
                { inapplicable: 0, passes: 0, incomplete: 0, violations: 0 },
              );

              summary.total = summary.inapplicable + summary.passes + summary.incomplete + summary.violations;
              summary.score = (summary.passes / (summary.passes + summary.incomplete + summary.violations)) * 100;
              summary.score = Math.floor(summary.score);

              // On met à jour les propriétés du nouvel audit
              Audit.updateOne(
                { _id: newAudit._id },
                {
                  $set: {
                    status: "completed",
                    summary,
                  },
                },
              ).then((audit) => {
                if (audit.modifiedCount > 0) {
                  res.status(200).json({
                    result: true,
                    website: newSite,
                    audit: newAudit,
                    tests: newTests,
                  });
                }
              });
            });
          }
        });
      } else {
        // Sinon un site existe déjà et on update la date du site existant
        Site.updateOne({ domain }, { updatedAt: Date.now() }).then(
          async (updatedSite) => {
            // On attend que le site soit mis à jour, puis on créé un nouvel audit pour ce même site
            const newAudit = await createAudit(url, site._id);

            if (newAudit) {
              // On enregistre le nouvel audit
              newAudit.save().then((newAudit) => {
                // On enregistre chaque test (devrait s'appeller test) dans un tableau de promesses
                // => Pour l'instant on remonte tous les résultats (pas que les violations/anomalies)
                const promises = auditResults.map(async (result) => {
                  return await createTests(
                    result.category,
                    result.resultsByFilteredCategory,
                    newAudit._id,
                  );
                });

                // On attend que toutes les promesses soient résolues => on attends que toutes les tests soient enregistrées en bdd
                // Promise.all renvoie lui même une promesse...
                Promise.all(promises).then((newTests) => {
                  res.status(200).json({
                    result: true,
                    website: updatedSite,
                    audit: newAudit,
                    tests: newTests,
                  });
                });
              });
            }
          },
        );
      }
    });
  } else {
    res.status(403).json({ result: false, error: "Axe-core has failed" });
  }
});

module.exports = router;
