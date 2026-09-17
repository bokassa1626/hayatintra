// ============================================================================
// Tests d'intégration — Authentification & RBAC
// Prérequis : la base MySQL doit être migrée ET seedée avant de lancer ces
// tests (npm run prisma:migrate && npm run seed), car ils utilisent les
// comptes de démonstration créés par prisma/seed.js.
//
// Lancer avec : npm test
// ============================================================================
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const MOT_DE_PASSE = "Passer123!";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentification (SSO)", () => {
  test("refuse une connexion avec un mauvais mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hayatcom.cd", motDePasse: "mauvais-mdp" });

    expect(res.status).toBe(401);
  });

  test("refuse une connexion avec un email inconnu", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inconnu@hayatcom.cd", motDePasse: MOT_DE_PASSE });

    expect(res.status).toBe(401);
  });

  test("connecte l'admin avec les bons identifiants et renvoie un accessToken", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hayatcom.cd", motDePasse: MOT_DE_PASSE });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.role).toBe("ADMIN");
  });

  test("/api/auth/me renvoie le profil avec un token valide", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hayatcom.cd", motDePasse: MOT_DE_PASSE });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("admin@hayatcom.cd");
  });

  test("/api/auth/me refuse sans token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("RBAC — gestion des utilisateurs", () => {
  test("l'ADMIN peut lister les utilisateurs", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hayatcom.cd", motDePasse: MOT_DE_PASSE });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("un FME (rôle non-admin) ne peut PAS lister les utilisateurs", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "fme.airtel@hayatcom.cd", motDePasse: MOT_DE_PASSE });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(403);
  });
});
