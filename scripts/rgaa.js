/**
 * Script d'import des données RGAA 4.1.2 pour alimenter les collections topics et criterias (> test subdocument)
 * afin d'obtenir une structures de données exploitables et propre faute d'api :/
 */
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Appel des modèles topics et criterias
const Topic = require('../models/topics.js');
const Criteria = require('../models/criterias.js')

// Appel la doc de référence officielle (le criteres.json) du gouvernement qui nous sert de base pour reconstruire proprement les collections topics et criterias
const RGAA_URL = `https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/4.1/criteres.json`;

// Vide les collections
Topic.deleteMany().then(() => {
  console.log('All topics deleted');
});
Criteria.deleteMany().then(() => {
  console.log('All criterias deleted');
})








