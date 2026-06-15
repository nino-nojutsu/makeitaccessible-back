var { chromium } = require("playwright");
var frLocale = require("axe-core/locales/fr.json"); // locale FR officielle
var scanImages = require("./categories/images.test.js"); // 1. Images
var scanCadres = require("./categories/cadres.test.js"); // 2. Cadres
var scanCouleurs = require("./categories/couleurs.test.js"); // 3. Couleurs
var scanMultimedia = require("./categories/multimedia.test.js"); // 4. Multimédia
var scanTableaux = require("./categories/tableaux.test.js"); // 5. Tableaux
var scanLiens = require("./categories/liens.test.js"); // 6. Liens
var scanScripts = require("./categories/scripts.test.js"); // 7. Scripts
var scanElements = require("./categories/elements.test.js"); // 8. Elements obligatoires
var scanStructuration = require("./categories/structuration.test.js"); // 9. Structuration de l'information
var scanPresentation = require("./categories/presentation.test.js"); // 10. Présentation de l'information
var scanFormulaires = require("./categories/formulaires.test.js"); // 11. Formulaires
var scanNavigation = require("./categories/navigation.test.js"); // 12. Navigation
var scanConsultation = require("./categories/consultation.test.js"); // 13. Consultation

// 0. On crée un tableau de catégories servant à filtrer les résultats par thématique
// cf. https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/

/**
 * categoryies: Array of objects
 ** category : object
 *** name: String // Nom de la catégorie
 *** scan: Function // Fonction de scan lancée par thématique
 */
const categories = [
  { name: "Images", scan: scanImages },
  { name: "Cadres", scan: scanCadres },
  { name: "Couleurs", scan: scanCouleurs },
  { name: "Multimédia", scan: scanMultimedia },
  { name: "Tableaux", scan: scanTableaux },
  { name: "Liens", scan: scanLiens },
  { name: "Scripts", scan: scanScripts },
  { name: "Éléments obligatoires", scan: scanElements },
  { name: "Structuration de l'information", scan: scanStructuration },
  { name: "Présentation de l'information", scan: scanPresentation },
  { name: "Formulaires", scan: scanFormulaires },
  { name: "Navigation", scan: scanNavigation },
  { name: "Consultation", scan: scanConsultation },
];

async function runAllTests(url) {
  // 1. Playwright charge le HTML dynamique (JS exécuté, CSS appliqué, DOM complet)
  // Quand on passe une page (url) à Playwright, il va ouvrir une vraie page dans Chromium.
  // Le navigateur "virtuel" télécharge la page, exécute le JavaScript, applique le CSS, et
  // construit un vrai DOM complet en mémoire.
  // note: si vous ne pouvez pas installer Playwright via yarn, faîtes "npx playwright install"
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);

  // 2. Injection du script axe-core + audit
  await page.addScriptTag({ path: "./node_modules/axe-core/axe.min.js" });

  // 3. On configure axe-core pour avoir des résultats en français
  const audit = await page.evaluate(async (locale) => {
    axe.configure({
      locale, // retourne les résultats en français, dans le contexte du navigateur virtuel
      //reporter: "no-passes", // retourne uniquement les violations, ne retourne pas les règles qui passent (on s'en fiche !)
    });

    // 4. Lance axe-run pour récupérer tous les résultats de l'audit
    return await axe.run({
      runOnly: {
        type: "tag",
        values: ["RGAAv4", "best-practice"],
      },
    });
  }, frLocale); // Passe les traductions fr

  const results = [];

  // 5. Parcours toutes les categories (thématiques) que l'on souhaite filter
  for (const category of categories) {
    // On filtre par thématique (on récupère les tests non applicables, non testables, les validés et les violations) dans l'objet resultsByImageTag
    const resultsByFilteredCategory = category.scan(audit);
    // Peuple le tableau results par categorie
    results.push({ category: category.name, resultsByFilteredCategory });
  }

  // 6. On ferme le navigateur virtuel
  await browser.close();

  // 7. On retourne le tableau listant chaque résultat de chaque thématique (13 au total : 1. Images... 2. Cadres... 3. Couleurs... 4. Multimédia, etc...)
  // return audit
  return results;
}

module.exports = runAllTests;
