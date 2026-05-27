require("dotenv").config();

const mongoose = require("mongoose");
const fetch = require("node-fetch");
const connectionString = process.env.CONNECTION_STRING;

/**
 * Script d'import des données RGAA 4.1.2 à lancer sur seule fois pour alimenter les collections
 * topics et criterias (> test subdocument) afin d'obtenir une structures de données exploitables
 * et propre faute d'api :/
 */

// Appel des modèles topics et criterias
const Topic = require("../models/topics.js");
const Criteria = require("../models/criterias.js");

// Appel la doc de référence officielle (le criteres.json) du gouvernement qui nous sert de base pour reconstruire proprement les collections topics et criterias
const RGAA_URL = `https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/4.1/criteres.json`;

//
const importRGAA = async () => {
  try {
    // 0. Connection à la base de données
    // async/await ajouté car mongoose.connect est asynchrone et les actions qui
    // suivent sont appelées les unes après les autres (elles-même en asynchrone...)
    // donc on attend avant tout que la bdd réponde avant de faire quoique ce soit.
    await mongoose
      .connect(connectionString, { connectTimeoutMS: 2000 })
      .then(() => console.log("Database connected"))
      .catch((error) => console.error(error));

    // 1. Nettoyage des collections existantes
    await Topic.deleteMany();
    await Criteria.deleteMany();

    // 2. Récupération du JSON RGAA officiel
    const response = await fetch(RGAA_URL);
    const data = await response.json();

    // 3. Parcours des topics depuis le JSON RGAA officiel
    if (data) {
      for (const topicData of data.topics) {
        // 3.1 Crée un nouveau topic à partir du modèle Topic
        const topic = new Topic({
          name: topicData.topic,
          topicNumber: topicData.number,
        });

        // Enregistre un nouveau topic dans la collections topics
        await topic.save();
        console.log(`${topicData.topic} enregistré!`);

        // 3.2 Crée un nouveau criteria à partir du modèle Criteria
        for (const criteriaData of topicData.criteria) {
          console.log("demodemo", criteriaData.criterium.tests);
          // const wcagRefArray = criteriaData.criterium.references[0].wcag;

          // let wcagRef = "";
          // if (wcagRefArray.includes("AAA")) {
          //   wcagRef = "AAA";
          // } else if (wcagRefArray.includes("AA")) {
          //   wcagRef = "AA";
          // } else {
          //   wcagRef = "A";
          // }

          // const criteria = new Criteria({
          //   criteriaNumber: criteriaData.criterium.number,
          //   title: criteriaData.criterium.title,
          //   criticality: wcagRef,
          //   topic: topic._id,
          //   tests: criteriaData.criterium.tests,
          // });

          // await criteria.save();
          // console.log(
          //   `Critère ${criteriaData.criterium.number} enregistré (${criteriaData.criterium.criticality})`,
          // );
        }
      }
    }

    console.log("Import RGAA terminé avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'import RGAA :", error);
  } finally {
    // On se déconnecte de MongoDB
    await mongoose.disconnect();
  }
};

// Extraction du niveau A / AA / AAA depuis les refs WCAG
// const extractLevel = (wcagRef) => {
//   if (wcagRef.includes("AAA")) return "AAA";
//   if (wcagRef.includes("AA")) return "AA";
//   return "A";
// };

importRGAA().then(() => {
  console.log("Import des données RGAA terminé");
});
