# HAYATCOM Intranet — Prototype Web (Étape 1 : Base de données MySQL)

Plateforme Intranet sécurisée (messagerie interne, partage de fichiers, SSO, RBAC, journal
d'audit) — prototype 100% web, sans matériel réseau, conforme au prompt maître
`Prompt_Realisation_HAYATCOM_Web.md`.

## Où en est-on ?

✅ Étape 1 : arborescence du projet + schéma de base de données MySQL (Prisma) + seed de démonstration.
✅ Étape 2 : API d'authentification (SSO + JWT + RBAC) — Itération 1 du prompt maître.
✅ Étape 3 : Messagerie interne temps réel (Socket.IO) — Itération 2 du prompt maître.
✅ Étape 4 : Partage de fichiers / GED (simulation Samba) — Itération 3 du prompt maître.
✅ Étape 5 : Rapports d'activité FME + consolidation, journal d'audit détaillé — Itérations 4 et 6.
✅ Étape 6 : Frontend Vue.js — socle (authentification, mise en page, navigation par rôle).
✅ Étape 7 : Pages Messagerie, Fichiers, Rapports, Utilisateurs, Audit (frontend complet).
⏳ Étape 8 (bonus) : Simulateur de topologie réseau (Itération 5, remplace le diagramme de déploiement).

## Prérequis

- Node.js ≥ 18
- **MySQL** installé localement et démarré (gratuit) :
  - Windows/Mac : [XAMPP](https://www.apachefriends.org/) ou [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
  - Linux : `sudo apt install mysql-server`

## Installation (3 étapes)

### 1. Créer la base de données

Connectez-vous à MySQL et créez une base vide :

```sql
CREATE DATABASE hayatcom_intranet CHARACTER SET utf8mb4;
```

### 2. Configurer et installer le backend

```bash
cd backend
cp .env.example .env
# → éditez .env : mettez votre utilisateur/mot de passe MySQL dans DATABASE_URL
npm install
npm run prisma:migrate   # crée toutes les tables dans MySQL
npm run seed              # insère les comptes et données de démonstration
```

### 3. Lancer le serveur

```bash
npm run dev
```

Vous devez voir :
```
✅ Serveur HAYATCOM Intranet démarré sur http://localhost:4000
   Test rapide : http://localhost:4000/api/health
```

## Tester l'Étape 2 (authentification & RBAC)

### A. Test manuel rapide avec `curl`

```bash
# 1. Vérifier que le serveur répond
curl http://localhost:4000/api/health

# 2. Se connecter en tant qu'admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hayatcom.cd","motDePasse":"Passer123!"}'
# → copiez la valeur de "accessToken" dans la réponse

# 3. Appeler une route protégée avec le token
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"

# 4. Vérifier le RBAC : lister les utilisateurs (réservé à ADMIN)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"

# 5. Vérifier qu'un FME est bien refusé sur cette même route
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fme.airtel@hayatcom.cd","motDePasse":"Passer123!"}'
# → copiez ce nouveau accessToken puis :
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN_DU_FME"
# → doit renvoyer 403 Forbidden
```

Vous pouvez aussi importer ces requêtes dans **Postman** ou **Insomnia** (gratuits) si vous
préférez une interface graphique.

### B. Tests automatisés (recommandé)

```bash
# Toujours dans le dossier backend, base déjà migrée + seedée :
npm test
```

Ce script (`tests/auth.test.js`) vérifie automatiquement :
- le refus d'un mauvais mot de passe / email inconnu,
- la connexion réussie de l'admin et l'obtention d'un token,
- l'accès à `/api/auth/me` avec et sans token,
- que l'ADMIN peut lister les utilisateurs (RBAC autorisé),
- qu'un FME **ne peut pas** lister les utilisateurs (RBAC refusé, code 403).

Si les 7 tests passent (`PASS tests/auth.test.js`), l'authentification et le RBAC sont
validés et on peut enchaîner sur l'Itération 2.

### C. Tester l'Étape 3 (messagerie interne)

```cmd
npm test
```
→ ajoute les tests de `tests/message.test.js` : envoi d'un message du chef de projet Airtel vers
son FME, réception, marquage "lu", et vérification qu'un autre utilisateur (chef Vodacom) ne peut
pas lire un message qui ne lui est pas destiné.

Test manuel avec `curl` (remplacez les tokens par ceux obtenus via `/api/auth/login`) :
```cmd
curl http://localhost:4000/api/messages/annuaire -H "Authorization: Bearer TOKEN_CHEF_AIRTEL"

curl -X POST http://localhost:4000/api/messages ^
  -H "Authorization: Bearer TOKEN_CHEF_AIRTEL" ^
  -F "sujet=Test" -F "corps=Bonjour" -F "destinataireIds=[3]"

curl http://localhost:4000/api/messages/reception -H "Authorization: Bearer TOKEN_FME_AIRTEL"
```

**Notifications temps réel** : pour vérifier Socket.IO sans encore avoir de frontend, ouvrez la
console du navigateur sur n'importe quelle page (ou un petit script Node) et connectez-vous avec :
```js
const socket = io("http://localhost:4000", { auth: { token: "VOTRE_ACCESS_TOKEN" } });
socket.on("nouveau_message", (msg) => console.log("Nouveau message reçu :", msg));
```
Envoyez ensuite un message à cet utilisateur depuis un autre compte : l'événement doit s'afficher
instantanément dans la console, sans recharger la page.

### D. Tester l'Étape 4 (partage de fichiers / GED)

⚠️ Cette étape ajoute de nouvelles permissions (`DOSSIER`). Relancez le seed avant de tester
(il est idempotent, ça ne duplique rien) :
```cmd
npm run seed
```

```cmd
npm test
```
→ ajoute `tests/fichiers.test.js` : création de dossier (cloisonné par opérateur), upload,
**versionnage automatique** (uploader un fichier de même nom crée une v2 en conservant la v1 dans
l'historique), refus d'accès inter-opérateurs, corbeille + restauration, refus de suppression d'un
dossier non vide.

Test manuel avec `curl` :
```cmd
curl -X POST http://localhost:4000/api/dossiers -H "Authorization: Bearer TOKEN_CHEF_AIRTEL" -H "Content-Type: application/json" -d "{\"nom\":\"Interventions Janvier\"}"

curl http://localhost:4000/api/dossiers -H "Authorization: Bearer TOKEN_CHEF_AIRTEL"

curl -X POST http://localhost:4000/api/fichiers/dossier/1 -H "Authorization: Bearer TOKEN_CHEF_AIRTEL" -F "fichier=@C:\chemin\vers\rapport.pdf"

curl http://localhost:4000/api/fichiers/dossier/1 -H "Authorization: Bearer TOKEN_CHEF_AIRTEL"

curl http://localhost:4000/api/fichiers/1/telecharger -H "Authorization: Bearer TOKEN_CHEF_AIRTEL" -o telecharge.pdf
```

Rechargez le même fichier une deuxième fois (même nom, même dossier) : le serveur crée
automatiquement une **version 2** au lieu d'un doublon — vérifiable via
`GET /api/fichiers/1/historique`.

### E. Tester l'Étape 5 (rapports FME + audit détaillé)

```cmd
npm test
```
→ ajoute `tests/rapports.test.js` (création de rapport, cloisonnement par opérateur, tableau de
bord de consolidation) et `tests/audit.test.js` (consultation filtrée, export CSV, accès refusé à
un non-admin).

Test manuel avec `curl` :
```cmd
curl -X POST http://localhost:4000/api/rapports -H "Authorization: Bearer TOKEN_FME" -H "Content-Type: application/json" -d "{\"zone\":\"Lubumbashi\",\"date\":\"2026-09-14\",\"description\":\"Remplacement onduleur.\"}"

curl http://localhost:4000/api/rapports/consolidation -H "Authorization: Bearer TOKEN_CHEF_AIRTEL"

curl http://localhost:4000/api/audit -H "Authorization: Bearer TOKEN_ADMIN"

curl http://localhost:4000/api/audit/export.csv -H "Authorization: Bearer TOKEN_ADMIN" -o audit.csv
```

### F. Vérifier le journal d'audit

## Étape 6 — Lancer le frontend

Dans un **nouveau terminal** (le backend doit continuer à tourner) :

```cmd
cd hayatcom-intranet\frontend
copy .env.example .env
npm install
npm run dev
```

Ouvrez ensuite `http://localhost:5173` dans votre navigateur.

Connectez-vous avec l'un des comptes de démonstration, par exemple :
- `admin@hayatcom.cd` / `Passer123!` (voit tout, y compris Utilisateurs/Audit/Réseau)
- `chef.airtel@hayatcom.cd` / `Passer123!` (voit uniquement le menu standard)

Ce qui fonctionne déjà à cette étape :
- Connexion / déconnexion (avec rafraîchissement automatique du token en arrière-plan),
- Redirection automatique si vous accédez à une page protégée sans être connecté,
- Menu de navigation qui s'adapte au rôle (seul l'ADMIN voit "Utilisateurs", "Audit", "Réseau"),
- Le tableau de bord d'accueil.

Les pages Messagerie / Fichiers / Rapports / Utilisateurs / Audit / Réseau affichent pour
l'instant "En construction" — elles seront développées à l'Étape 7.

## Étape 7 — Pages complètes du frontend

Toutes les pages sont maintenant fonctionnelles et reliées à l'API. Redémarrez le frontend si
besoin (`npm run dev`) et testez ce scénario complet :

1. **Messagerie** : connectez-vous avec `chef.airtel@hayatcom.cd`, envoyez un message à
   `fme.airtel@hayatcom.cd` avec une pièce jointe. Ouvrez un **deuxième navigateur** (ou une
   fenêtre privée) connecté en `fme.airtel@hayatcom.cd` : le badge de notification sur
   « Messagerie » doit apparaître **sans recharger la page** (Socket.IO).
2. **Fichiers** : créez un dossier, uploadez un fichier, ré-uploadez-en un du même nom
   (versionnage automatique), consultez l'historique, mettez à la corbeille puis restaurez.
   Reconnectez-vous en `chef.vodacom@hayatcom.cd` : vous ne devez voir aucun dossier Airtel.
3. **Rapports** : en `fme.airtel@hayatcom.cd`, déclarez une intervention. Reconnectez-vous en
   `chef.airtel@hayatcom.cd` : le graphique de consolidation doit se mettre à jour.
4. **Utilisateurs** (`admin@hayatcom.cd`) : créez un nouvel utilisateur, changez le rôle d'un
   utilisateur existant, désactivez un compte.
5. **Audit** (`admin@hayatcom.cd`) : filtrez par action, exportez en CSV.

⚠️ Si vous rencontrez une erreur CORS ou "Network Error" dans la console du navigateur,
vérifiez que le backend tourne bien sur le port 4000 et que `FRONTEND_URL` dans son `.env`
correspond bien à `http://localhost:5173`.

Après avoir fait quelques tentatives de connexion (bonnes et mauvaises), ouvrez Prisma Studio :

```bash
npm run prisma:studio
```

→ table `audit_logs` : vous devez voir des lignes `LOGIN`, `LOGIN_FAILED`, `LOGOUT`.

## Comptes de démonstration (créés par `npm run seed`)

| Email | Rôle | Opérateur | Mot de passe |
|---|---|---|---|
| admin@hayatcom.cd | ADMIN | — | Passer123! |
| country.manager@hayatcom.cd | COUNTRY_MANAGER | — | Passer123! |
| chef.airtel@hayatcom.cd | CHEF_PROJET_MS | AIRTEL | Passer123! |
| chef.vodacom@hayatcom.cd | CHEF_PROJET_MS | VODACOM | Passer123! |
| fme.airtel@hayatcom.cd | FME | AIRTEL | Passer123! |

Ces comptes permettent de démontrer immédiatement le **cloisonnement par opérateur** dès que
les modules messagerie/fichiers seront développés (le chef de projet Airtel ne doit jamais voir
les données Vodacom).

## Explorer la base de données visuellement

```bash
npm run prisma:studio
```

Ouvre une interface web locale pour consulter/éditer les tables.

## Vérifier le schéma

Le fichier `backend/prisma/schema.prisma` contient tout le modèle de données (voir §5 du prompt
maître) : `User`, `Role`, `Permission`, `Message`, `Dossier`, `Fichier`, `RapportActivite`,
`AuditLog`, `NoeudReseau` (pour le simulateur réseau de l'itération 5).

---

**Prochaine étape** : dites-moi si le schéma vous convient (noms de champs, rôles, cloisonnement
par opérateur), sinon je l'ajuste. Une fois validé, on passe à l'**Itération 1 : API
d'authentification SSO + JWT + RBAC**.
