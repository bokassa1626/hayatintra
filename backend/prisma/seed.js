// ============================================================================
// Seed — jeu de données de démonstration HAYATCOM
// À exécuter avec : npm run seed
// ============================================================================
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ROLES = [
  { nom: "ADMIN", description: "Administrateur réseau" },
  { nom: "COUNTRY_MANAGER", description: "Direction Pays" },
  { nom: "MANAGER_METIER", description: "Manager régional / métier (Sales, Finance, RH, Qualité)" },
  { nom: "CHEF_PROJET_MS", description: "Chef de projet Managed Services (par opérateur)" },
  { nom: "FME", description: "Technicien de terrain" },
  { nom: "WAREHOUSE", description: "Responsable d'entrepôt / logistique" },
];

// Actions/ressources reprises du §3 et §7 du prompt maître
const PERMISSIONS = [
  { action: "MANAGE", ressource: "USER" },
  { action: "MANAGE", ressource: "ROLE" },
  { action: "READ", ressource: "AUDIT_LOG" },
  { action: "MANAGE", ressource: "NOEUD_RESEAU" },
  { action: "READ", ressource: "RAPPORT" },
  { action: "CREATE", ressource: "RAPPORT" },
  { action: "READ", ressource: "MESSAGE" },
  { action: "CREATE", ressource: "MESSAGE" },
  { action: "READ", ressource: "FICHIER" },
  { action: "CREATE", ressource: "FICHIER" },
  { action: "DELETE", ressource: "FICHIER" },
  { action: "READ", ressource: "DOSSIER" },
  { action: "CREATE", ressource: "DOSSIER" },
  { action: "DELETE", ressource: "DOSSIER" },
];

// Association rôle -> permissions (simplifiée ; affinable ensuite dans l'itération 1)
const ROLE_PERMISSIONS = {
  ADMIN: PERMISSIONS.map((p) => `${p.action}:${p.ressource}`),
  COUNTRY_MANAGER: [
    "READ:RAPPORT", "READ:MESSAGE", "CREATE:MESSAGE",
    "READ:FICHIER", "CREATE:FICHIER", "DELETE:FICHIER",
    "READ:DOSSIER", "CREATE:DOSSIER", "DELETE:DOSSIER",
  ],
  MANAGER_METIER: [
    "READ:RAPPORT", "READ:MESSAGE", "CREATE:MESSAGE",
    "READ:FICHIER", "CREATE:FICHIER",
    "READ:DOSSIER", "CREATE:DOSSIER",
  ],
  CHEF_PROJET_MS: [
    "READ:RAPPORT", "CREATE:RAPPORT", "READ:MESSAGE", "CREATE:MESSAGE",
    "READ:FICHIER", "CREATE:FICHIER", "DELETE:FICHIER",
    "READ:DOSSIER", "CREATE:DOSSIER", "DELETE:DOSSIER",
  ],
  FME: [
    "CREATE:RAPPORT", "READ:MESSAGE", "CREATE:MESSAGE",
    "READ:FICHIER", "CREATE:FICHIER",
    "READ:DOSSIER",
  ],
  WAREHOUSE: [
    "READ:MESSAGE", "CREATE:MESSAGE",
    "READ:FICHIER", "CREATE:FICHIER",
    "READ:DOSSIER",
  ],
};

async function main() {
  console.log("→ Création des permissions...");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action_ressource: { action: p.action, ressource: p.ressource } },
      update: {},
      create: p,
    });
  }

  console.log("→ Création des rôles...");
  const rolesMap = {};
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { nom: r.nom },
      update: {},
      create: r,
    });
    rolesMap[r.nom] = role;
  }

  console.log("→ Association rôles ↔ permissions...");
  const allPerms = await prisma.permission.findMany();
  for (const [roleNom, permsList] of Object.entries(ROLE_PERMISSIONS)) {
    for (const key of permsList) {
      const [action, ressource] = key.split(":");
      const perm = allPerms.find((p) => p.action === action && p.ressource === ressource);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: rolesMap[roleNom].id, permissionId: perm.id } },
          update: {},
          create: { roleId: rolesMap[roleNom].id, permissionId: perm.id },
        });
      }
    }
  }

  console.log("→ Création des utilisateurs de démonstration...");
  const motDePasseHash = await bcrypt.hash("Passer123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hayatcom.cd" },
    update: {},
    create: {
      nom: "Admin",
      prenom: "Système",
      email: "admin@hayatcom.cd",
      motDePasseHash,
      roleId: rolesMap.ADMIN.id,
      direction: "OPERATIONS_MS",
      operateur: "AUCUN",
    },
  });

  const countryManager = await prisma.user.upsert({
    where: { email: "country.manager@hayatcom.cd" },
    update: {},
    create: {
      nom: "Mwamba",
      prenom: "Country",
      email: "country.manager@hayatcom.cd",
      motDePasseHash,
      roleId: rolesMap.COUNTRY_MANAGER.id,
      direction: "DIRECTION_PAYS",
      operateur: "AUCUN",
    },
  });

  const chefProjetAirtel = await prisma.user.upsert({
    where: { email: "chef.airtel@hayatcom.cd" },
    update: {},
    create: {
      nom: "Kalonji",
      prenom: "Chef",
      email: "chef.airtel@hayatcom.cd",
      motDePasseHash,
      roleId: rolesMap.CHEF_PROJET_MS.id,
      direction: "OPERATIONS_MS",
      operateur: "AIRTEL",
      managerId: countryManager.id,
    },
  });

  const chefProjetVodacom = await prisma.user.upsert({
    where: { email: "chef.vodacom@hayatcom.cd" },
    update: {},
    create: {
      nom: "Mbayo",
      prenom: "Chef",
      email: "chef.vodacom@hayatcom.cd",
      motDePasseHash,
      roleId: rolesMap.CHEF_PROJET_MS.id,
      direction: "OPERATIONS_MS",
      operateur: "VODACOM",
      managerId: countryManager.id,
    },
  });

  const fmeAirtel = await prisma.user.upsert({
    where: { email: "fme.airtel@hayatcom.cd" },
    update: {},
    create: {
      nom: "Kabila",
      prenom: "Technicien",
      email: "fme.airtel@hayatcom.cd",
      motDePasseHash,
      roleId: rolesMap.FME.id,
      direction: "TERRAIN_FME",
      operateur: "AIRTEL",
      managerId: chefProjetAirtel.id,
    },
  });

  console.log("→ Création des dossiers cloisonnés par opérateur...");
  await prisma.dossier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nom: "Airtel - Rapports",
      operateur: "AIRTEL",
      proprietaireId: chefProjetAirtel.id,
    },
  });
  await prisma.dossier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nom: "Vodacom - Rapports",
      operateur: "VODACOM",
      proprietaireId: chefProjetVodacom.id,
    },
  });

  console.log("→ Création des nœuds du simulateur réseau (diagramme de déploiement)...");
  const noeuds = [
    { nom: "Client Web", type: "CLIENT", positionX: 50, positionY: 200 },
    { nom: "Serveur Applicatif (Node.js/Express)", type: "APP_SERVER", positionX: 250, positionY: 200 },
    { nom: "Serveur Mail (simulé — remplace Postfix/Dovecot)", type: "MAIL_SERVER", positionX: 450, positionY: 100 },
    { nom: "Serveur Fichiers (simulé — remplace Samba)", type: "FILE_SERVER", positionX: 450, positionY: 200 },
    { nom: "Serveur Base de données (MySQL)", type: "DB_SERVER", positionX: 450, positionY: 300 },
  ];
  for (const n of noeuds) {
    await prisma.noeudReseau.create({ data: n }).catch(() => {});
  }

  console.log("\n✅ Seed terminé.");
  console.log("Comptes de démonstration (mot de passe pour tous : Passer123!) :");
  console.log("  - admin@hayatcom.cd            (ADMIN)");
  console.log("  - country.manager@hayatcom.cd  (COUNTRY_MANAGER)");
  console.log("  - chef.airtel@hayatcom.cd      (CHEF_PROJET_MS / AIRTEL)");
  console.log("  - chef.vodacom@hayatcom.cd     (CHEF_PROJET_MS / VODACOM)");
  console.log("  - fme.airtel@hayatcom.cd       (FME / AIRTEL)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
