// ============================================================================
// Tests d'intégration — Journal d'audit (admin)
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

describe("Journal d'audit", () => {
  let tokenAdmin, tokenFme;

  beforeAll(async () => {
    // Cette connexion elle-même génère une entrée LOGIN dans le journal.
    tokenAdmin = await login("admin@hayatcom.cd");
    tokenFme = await login("fme.airtel@hayatcom.cd");
  });

  test("l'ADMIN peut consulter le journal d'audit paginé", async () => {
    const res = await request(app)
      .get("/api/audit")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  test("un FME ne peut PAS consulter le journal d'audit (403)", async () => {
    const res = await request(app)
      .get("/api/audit")
      .set("Authorization", `Bearer ${tokenFme}`);

    expect(res.status).toBe(403);
  });

  test("le filtre par action fonctionne (ex: LOGIN)", async () => {
    const res = await request(app)
      .get("/api/audit?action=LOGIN")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.every((l) => l.action === "LOGIN")).toBe(true);
  });

  test("l'export CSV renvoie bien un fichier texte CSV", async () => {
    const res = await request(app)
      .get("/api/audit/export.csv")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("Date,Utilisateur,Email,Action");
  });
});
