/**
 * Script d'import des données RGAA 4.1.2
 */
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Appel des modèles Topic et Criteria
const Topic = require('../models/topics.js');
const Criteria = require('../models/criterias.js')

// Appel la doc de référence officielle (le json) du gouvernement qui nous sert de base pour reconstruire proprement les collections Topics et Criterias
const RGAA_URL = `https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/4.1/criteres.json`;





