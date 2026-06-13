const runAllTests = require("../tests/runAllTests.js");
const User = require('../models/users');
const Site = require("../models/sites.js");
const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");
const { checkBody } = require("../modules/checkBody.js");

// Fonction de création d'un audit
const createAudit = async (siteId, userId, url) => {
  const audit = new Audit({
    url,
    status: "running",
    createdAt: Date.now(),
    site: siteId,
    user: userId
  });

  // On enregistre le nouvel audit
  // save est asynchrone: on doit attente le retour de la promesse qui valide l'enregistrement d'un audit
  const newAudit = await audit.save();
  // console.log(`Audit ${newAudit} has been saved!`);

  return newAudit;
};

// Fonction de création des tests
const createTests = async (category, resultsByFilteredCategory, auditId) => {
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

// Fonction de création d'un audit + tests associés
const handleAuditCreation = async (siteId, userId, url, axeCoreResults) => {
  // On initialise un nouvel audit et on attend qu'il s'enregistre en bdd
  let newAudit;

  try {
    newAudit = await createAudit(siteId, userId, url);
  } catch (error) {
    console.error(error);
  }

  // Si un nouvel a été enregistré en bdd
  if (newAudit) {
    // On enregistre chaque test dans un tableau de promesses
    // => Pour l'instant on remonte tous les résultats (pas que les violations/anomalies)
    const promises = axeCoreResults.map(async (result) => {
      return await createTests(
        result.category,
        result.resultsByFilteredCategory,
        newAudit._id,
      );
    });

    // Si notre tableau de promesses contient des promesses de tests créées en bdd
    if (promises.length > 0) {
      // On attend que toutes les promesses soient résolues => Promise.all
      // => On attends que toutes les tests soient enregistrées en bdd
      // => On retourne le résultat Promise.all et Promise.all renvoie lui même une promesse où dedans on cacule les totaux et le score
      return Promise.all(promises).then(newTests => {
        // console.log("newTests", newTests);
        // console.log(`All ${newTests} have been saved!`);

        // Calcul des totaux pour l'audit en cours avec reduce :
        // On crée un nouvel objet summary qui a 4 propriétés (inapplicable, passes, incomplete, violations) initialisées à 0
        // Pour chaque catégorie testée, à chaque itération du tableau newTests, reduce permet de calculer la sommes des longueurs des tableaux par propriétés.
        // Pour acc = l'accumulateur (l'objet summary en cours de construction), pour chacune de ses propriétés, on additionne à chaque itération la longueur 
        // des tableaux du test en cours (du document test courant de la catégorie en cours d'itération)
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
        return Audit.updateOne(
          { _id: newAudit._id },
          {
            $set: {
              status: "completed",
              summary,
            },
          },
        ).then((updatedAudit) => {
          // Si l'audit initiale a été mis à jour
          if (updatedAudit.modifiedCount > 0) {
            // On va chercher cet audit par son id pour récupérer ses valeurs (inapplicable, passes, incomplete, violations) mises à jour
            return Audit.findById(newAudit._id).then(audit => {
              // On retourne un objet des résultats de l'audit et des tests associés à l'audit
              // Ces 2 propriétés results et tests, seront destructurées dans le retour de la réponse pour le Front (voir le res.json)
              return {
                results: audit,
                tests: newTests
              }
            })
          }
        });
      });
    }
  }
}

// Fonction de création d'un audit appelé par la route POST /audit
const auditController = async (req, res) => {
  const { url, name, domain, token } = req.body;
  
  // Regex pour vérifier si conforme : doit commencer par https:// + obligation d'avoir un point avec des caractères de chaque côté.
  const checkUrl = /^https:\/\/.+\..+/;

  // !url = true si url est undefined, null
  // !urlCheck.test(url) = true si l'url ne correspond pas au format
  // .test() = méthode native RegExp, prend une string et retourne true/false selon si la regex matche ou pas
  if (!checkBody(req.body, ['url', 'name', 'domain', 'token']) && !checkUrl.test(url)) {
    res.status(403).json({ result: false, error: "Incorrect url" });
    return;
  }

  // Lance le scan via runAllTests et on "attend" le retour des résultats de axe-core (filtrés par catégorie) avant d'enregistrer un site
  try {
    axeCoreResults = await runAllTests(url);
  } catch (error) {
    console.error(error);
    res.status(503).json({ result: false, error: "L'audit a échoué, veuillez réessayer." });
    return;
  }

  // Si on a des résultats (anomalies, etc...)
  if (axeCoreResults) {
    // res.status(200).json({ result: true, axeCoreResults });
    // return;
    const user = token ? await User.findOne({ token }) : null;

    // Vérifie si un site existe déjà
    const newSite = await Site.findOne({ domain }).then((site) => {
      // Si un site n'existe pas, on enregistre un nouveau site dans la collection "sites"
      if (site === null) {
        const website = new Site({
          name,
          domain,
          createdAt: Date.now(),
          user
        });

        // On attend que le site s'enregistre, puis on créé un nouvel audit et les tests
        return website.save().then(newSite => {
          console.log('Website created');
          return newSite;
        });
      } else {
        // Sinon un site existe, on update la date du site existant
        return Site.updateOne({ domain }, { updatedAt: Date.now() }).then(updatedSite => {
            if (updatedSite.modifiedCount > 0) {
              console.log('Website updated');
              return site;
            }
          }
        );
      }
    });

    // On crée un nouvel audit
    const newAudit = await handleAuditCreation(newSite._id, user?._id, url, axeCoreResults);
    console.log('newAudit', newAudit);

    // Si un Audit a bien été créé en bdd
    if (newAudit) {
      // Vérifie si l'utilisateur est connecté via son token
      if (!user) {
        // Non connecté : score global uniquement : results
        return res.status(200).json({
          result: true,
          website: newSite,
          audit: newAudit.results
        });
      } else {
        // Connecté : toutes les données disponibles à l'utilisateur : results + tests
        return res.status(200).json({
          result: true,
          website: newSite,
          audit: newAudit
        });
      }
    } else {
      res.status(403).json({ result: false, error: "Aucun résultat" });
    }
  } else {
    res.status(403).json({ result: false, error: "Aucun résultat" });
  }
}

module.exports = auditController;