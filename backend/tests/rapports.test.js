// ============================================================================
// Tests d'intégration — Rapports d'activité FME & consolidation
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

describe("Rapports d'activité FME", () => {
  let tokenFmeAirtel, tokenChefAirtel, tokenChefVodacom;

  beforeAll(async () => {
    tokenFmeAirtel = await login("fme.airtel@hayatcom.cd");
    tokenChefAirtel = await login("chef.airtel@hayatcom.cd");
    tokenChefVodacom = await login("chef.vodacom@hayatcom.cd");
  });

  test("le FME peut créer un rapport d'intervention (opérateur forcé à AIRTEL)", async () => {
    const res = await request(app)
      .post("/api/rapports")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`)
      .send({ zone: "Kinshasa - Gombe", date: new Date().toISOString(), description: "Maintenance antenne relais." });

    expect(res.status).toBe(201);
    expect(res.body.operateur).toBe("AIRTEL");
  });

  test("le FME retrouve son rapport dans /mes-rapports", async () => {
    const res = await request(app)
      .get("/api/rapports/mes-rapports")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("le chef de projet Airtel voit ce rapport dans la vue consolidée", async () => {
    const res = await request(app)
      .get("/api/rapports")
      .set("Authorization", `Bearer ${tokenChefAirtel}`);

    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.operateur === "AIRTEL")).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("le chef de projet Vodacom NE voit PAS les rapports Airtel (cloisonnement)", async () => {
    const res = await request(app)
      .get("/api/rapports")
      .set("Authorization", `Bearer ${tokenChefVodacom}`);

    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.operateur === "VODACOM")).toBe(true);
  });

  test("le FME ne peut pas accéder à la vue consolidée globale (403)", async () => {
    const res = await request(app)
      .get("/api/rapports")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);

    expect(res.status).toBe(403);
  });

  test("le tableau de bord de consolidation renvoie des statistiques par opérateur/zone", async () => {
    const res = await request(app)
      .get("/api/rapports/consolidation")
      .set("Authorization", `Bearer ${tokenChefAirtel}`);

    expect(res.status).toBe(200);
    expect(res.body.totalRapports).toBeGreaterThan(0);
    expect(res.body.parOperateur.AIRTEL).toBeGreaterThan(0);
    expect(res.body.parZone["Kinshasa - Gombe"]).toBeGreaterThan(0);
  });
});
