// ============================================================================
// Tests d'intégration — Partage de fichiers (GED)
// Prérequis : base migrée + seedée (npm run seed) AVEC les permissions
// DOSSIER/FICHIER mises à jour (relancez "npm run seed" après avoir récupéré
// cette étape, le script est idempotent).
// ============================================================================
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const MOT_DE_PASSE = "Passer123!";

async function login(email) {
  const res = await request(app).post("/api/auth/login").send({ email, motDePasse: MOT_DE_PASSE });
  return res.body.accessToken;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Partage de fichiers (GED)", () => {
  let tokenChefAirtel, tokenFmeAirtel, tokenChefVodacom;
  let dossierId, fichierId;

  beforeAll(async () => {
    tokenChefAirtel = await login("chef.airtel@hayatcom.cd");
    tokenFmeAirtel = await login("fme.airtel@hayatcom.cd");
    tokenChefVodacom = await login("chef.vodacom@hayatcom.cd");
  });

  test("le chef de projet Airtel peut créer un dossier (opérateur forcé à AIRTEL)", async () => {
    const res = await request(app)
      .post("/api/dossiers")
      .set("Authorization", `Bearer ${tokenChefAirtel}`)
      .send({ nom: "Rapports Test Automatisé" });

    expect(res.status).toBe(201);
    expect(res.body.operateur).toBe("AIRTEL");
    dossierId = res.body.id;
  });

  test("le chef de projet Vodacom NE voit PAS ce dossier dans la liste", async () => {
    const res = await request(app)
      .get("/api/dossiers")
      .set("Authorization", `Bearer ${tokenChefVodacom}`);

    expect(res.status).toBe(200);
    const trouve = res.body.find((d) => d.id === dossierId);
    expect(trouve).toBeUndefined();
  });

  test("le FME Airtel peut uploader un fichier dans ce dossier", async () => {
    const res = await request(app)
      .post(`/api/fichiers/dossier/${dossierId}`)
      .set("Authorization", `Bearer ${tokenFmeAirtel}`)
      .attach("fichier", Buffer.from("Contenu du rapport v1"), "rapport.txt");

    expect(res.status).toBe(201);
    expect(res.body.version).toBe(1);
    fichierId = res.body.id;
  });

  test("uploader un fichier de même nom crée une version 2 (versionnage)", async () => {
    const res = await request(app)
      .post(`/api/fichiers/dossier/${dossierId}`)
      .set("Authorization", `Bearer ${tokenFmeAirtel}`)
      .attach("fichier", Buffer.from("Contenu du rapport v2"), "rapport.txt");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
    expect(res.body.id).toBe(fichierId); // même fichier logique, pas un doublon
  });

  test("l'historique des versions est consultable", async () => {
    const res = await request(app)
      .get(`/api/fichiers/${fichierId}/historique`)
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);

    expect(res.status).toBe(200);
    expect(res.body.versionCourante).toBe(2);
    expect(res.body.versionsPrecedentes.length).toBe(1);
    expect(res.body.versionsPrecedentes[0].version).toBe(1);
  });

  test("le chef de projet Vodacom ne peut pas accéder à ce fichier (403)", async () => {
    const res = await request(app)
      .get(`/api/fichiers/${fichierId}/telecharger`)
      .set("Authorization", `Bearer ${tokenChefVodacom}`);

    expect(res.status).toBe(403);
  });

  test("mettre à la corbeille puis restaurer un fichier", async () => {
    const suppression = await request(app)
      .delete(`/api/fichiers/${fichierId}`)
      .set("Authorization", `Bearer ${tokenChefAirtel}`);
    expect(suppression.status).toBe(204);

    const corbeille = await request(app)
      .get("/api/fichiers/corbeille")
      .set("Authorization", `Bearer ${tokenChefAirtel}`);
    expect(corbeille.body.some((f) => f.id === fichierId)).toBe(true);

    const restauration = await request(app)
      .post(`/api/fichiers/${fichierId}/restaurer`)
      .set("Authorization", `Bearer ${tokenChefAirtel}`);
    expect(restauration.status).toBe(204);
  });

  test("impossible de supprimer un dossier non vide", async () => {
    const res = await request(app)
      .delete(`/api/dossiers/${dossierId}`)
      .set("Authorization", `Bearer ${tokenChefAirtel}`);

    expect(res.status).toBe(409);
  });
});
