# EVJF Game 2.0

Site statique mystérieux et automnal pour préparer un EVJF sur le thème du jeu.

## Pages

- `index.html` : manuel d'accueil avec effet terminal, scanline, engrenages et navigation.
- `profil.html` : questionnaire de collecte des souhaits avec formulaire compatible Netlify Forms, sauvegarde locale et export JSON.
- `partie.html` : chargement dramatique, erreur système et rotation de vidéos YouTube de divertissement.

## Réception des réponses

Le formulaire `profil-evjf` est prêt pour Netlify Forms grâce aux attributs `data-netlify="true"`, `netlify-honeypot` et au champ caché `form-name`. Une fois le site déployé sur Netlify, les réponses apparaîtront dans l'interface Forms du projet.

En local ou sur un hébergement sans backend, le site conserve aussi une copie dans `localStorage` et propose le téléchargement d'un fichier `profil-evjf.json` après l'envoi.

## Lancement local

```bash
python3 -m http.server 4173
```

Puis ouvrir <http://localhost:4173>.
