var { chromium } = require("playwright");
//var { readFileSync, readdirSync } = require("fs");

const runAllTests = require("../tests/runAllTests.js");
const User = require('../models/users');
const Site = require("../models/sites.js");
const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");
const { checkBody } = require("../modules/checkBody.js");
const { calculateAuditSummary } = require('../services/scoreAudit.service.js');

// CREATE
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
  // console.log('resultsByFilteredCategory', resultsByFilteredCategory);

  // Pour chaque document testDoc créé, extrait chaque règle Axe-core par type et ajoute en complément la key status "to_do" 
  // et la key comments (à chaîne vide) à chaque objet de règle en mappant chaque rules catégorisées
  // Attention! {...rule} spread tiut le contenu de l'objet rule
  const inapplicable = resultsByFilteredCategory.inapplicable.map(rule => ({ ...rule, status: 'to_do', comment: '' }));
  const passes = resultsByFilteredCategory.passes.map(rule => ({ ...rule, status: 'validated', comment: null }));
  const incomplete = resultsByFilteredCategory.incomplete.map(rule => ({ ...rule, status: 'to_do', comment: '' }));
  const violations = resultsByFilteredCategory.violations.map(rule => ({ ...rule, status: 'to_do', comment: '' }));

  const test = new Test({
    category,
    inapplicable,
    passes,
    incomplete,
    violations,
    audit: auditId,
  });

  // On enregistre le nouveau test
  // save est asynchrone: on doit attente le retour de la promesse qui valide l'enregistrement d'un test
  const newTest = await test.save();
  // console.log(`Test ${newTest} has been saved!`);

  return newTest;
};

// Fonction de création d'un audit + tests associés
const handleCreateAudit = async (siteId, userId, url, axeCoreResults) => {
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
        console.log('Tests created');
        // console.log("newTests", newTests);
        // console.log(`All ${newTests} have been saved!`);

        // On appelle le service qui gère le calcul du score global
        const summary = calculateAuditSummary(newTests);

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
            console.log('Audit updated');
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
const createAuditAction = async (req, res) => {
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
    // Pour afficher les données bruts ou filtrées par catégorie
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
    const newAudit = await handleCreateAudit(newSite._id, user?._id, url, axeCoreResults);
    // console.log('newAudit', newAudit);
    console.log('Audit created');

    // Si un Audit a bien été créé en bdd
    if (newAudit) {
      // Vérifie si l'utilisateur est connecté via son token
      if (!user) {
        // Non connecté : score global uniquement : results
        return res.status(200).json({
          result: true,
          website: newSite,
          results: newAudit.results,
        });
      } else {
        // Connecté : toutes les données disponibles à l'utilisateur : results + tests
        return res.status(200).json({
          result: true,
          website: newSite,
          results: newAudit.results,
          tests: newAudit.tests,
        });
      }
    } else {
      res.status(403).json({ result: false, error: "Aucun résultat" });
    }
  } else {
    res.status(403).json({ result: false, error: "Aucun résultat" });
  }
}

// READ
// Fonction qui récupère un audit via son id (indentication d'une ressource via le params envoyé dans l'url)
const getAuditAction = (req, res) => {
  Audit.findById(req.params.id).then((auditDoc) => {
    if (auditDoc !== null) {
      Test.find({ audit: auditDoc._id }).then(testsDoc => {
        res.status(200).json({
          result: true,
          results: auditDoc,
          tests: testsDoc
        });
      });
    } else {
      res.status(403).json({ result: false, error: 'Unable to find audit'})
    }
  });
}


// Tous les audits d'un utilisateur connecté, avec leur site (POST /audit/all)
const getAllAuditsAction = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(403).json({ result: false, error: "Token manquant" });
  }

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(403).json({ result: false, error: "Utilisateur non trouvé" });
  }

  const audits = await Audit.find({ user: user._id, status: "completed" })
    .populate('site')
    .sort({ createdAt: -1 });

  res.status(200).json({ result: true, audits });
};

// GET / dynamique par audit 
const getAuditViewAction = async (req, res) => {
  const { token, id } = req.params;

   const user = await User.findOne({ token });
  if (!user) {
    return res.status(403).json({ result: false, error: "Utilisateur non trouvé" });
  }

  const audit = await Audit.findById(id)
    .populate('site', 'name domain')

         if (!audit) {

    return res.status(404).json({ result: false, error: "Audit introuvable" });
  }

  const tests = await Test.find({audit: audit._id});

   res.json({ result: true, results: audit, tests: tests });

};

// rechercher un audit
const searchAuditAction = async (req, res) => {
	const { search } = req.query;
	const { token } = req.params;

	try {
		const user = await User.findOne({ token });
		if (!user) {
			return res.status(403).json({ result: false, error: "Utilisateur non trouvé" });
		}

		const filters = {};
		if (search) filters.url = { $regex: new RegExp(search, 'i') };

		const audits = await Audit.find(filters).populate('site');

		if (audits.length === 0) {
			return res.json({ result: false, error: 'Aucun audit trouvé' });
		}
		res.json({ result: true, search: audits });
	} catch (error) {
		res.status(500).json({ result: false, error: error.message });
	}
};

// DELETE
// supprimer un audit
const deleteAuditAction = async (req, res) => {
  const { auditId } = req.params;
  const { token } = req.body;

  // CheckBody vérifie que token est présent et non vide
  if (!checkBody(req.body, ['token'])) {
    return res.status(403).json({ result: false, error: "Token manquant" });
  }

  // Vérifier si un utilisateur existe et si un site existe aussi 
  const user = await User.findOne({ token });
  if (!user) {
    return res.status(403).json({ result: false, error: "Utilisateur non trouvé" });
  }
  const audit = await Audit.findById(auditId);
  if (!audit) {
    return res.status(403).json({ result: false, error: "Audit introuvable" });
  }

  // 1. vérifie que l'utilisateur est bien propriétaire de l'audit
  const hasAccess = await Audit.exists({ _id: auditId, user: user._id });
  if (!hasAccess) {
    return res.status(403).json({ result: false, error: "Accès non autorisé" });
  }

  // 2. Supprime tous les tests liés à ces audits
  await Test.deleteMany({ audit: auditId });

  // 3. Supprime l'audit
  await Audit.deleteOne({ _id: auditId });

  res.status(200).json({ result: true });
};

// GET: générer les résultats d'un audit au format PDF
const generatePDFAuditAction = async (req, res) => {
  //onst script = readFileSync(`./build/static/js/main.<hash>.js`) // reference to compiled react app
  //const css = readFileSync(`./build/static/css/main.<hash>.css`) // reference to compiled react css

  // inline script and styles into a html boilerplate
  const staticHtml = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
    </head>
    <body>
      <div>test</div>
    </body>
  </html>`

  // launch chromium and create a page
  const browser = await chromium.launch()
  const page = await browser.newPage();

  // set the content to be the react app
  await page.setContent(staticHtml)

  // save the page to a file using playwrights `.pdf` function
  await page.pdf({
    path: 'renderedwithplaywright.pdf',
    margin: { top: '0px', left: '0px', right: '0px', bottom: '0px' },
    format: 'A4',
  })

  await browser.close()
}

module.exports = { createAuditAction, getAuditAction, getAllAuditsAction, getAuditViewAction, searchAuditAction, deleteAuditAction, generatePDFAuditAction };
