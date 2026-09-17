// ============================================================================
// Tests d'intégration — Messagerie interne
// Prérequis : base migrée + seedée (npm run prisma:migrate && npm run seed)
// ============================================================================
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const MOT_DE_PASSE = "Passer123!";

afterAll(async () => {
  await prisma.$disconnect();
});

async function login(email) {
  const res = await request(app).post("/api/auth/login").send({ email, motDePasse: MOT_DE_PASSE });
  return res.body.accessToken;
}

describe("Messagerie interne", () => {
  let tokenChefAirtel;
  let tokenFmeAirtel;
  let fmeAirtelId;

  beforeAll(async () => {
    tokenChefAirtel = await login("chef.airtel@hayatcom.cd");
    tokenFmeAirtel = await login("fme.airtel@hayatcom.cd");

    const annuaire = await request(app)
      .get("/api/messages/annuaire")
      .set("Authorization", `Bearer ${tokenChefAirtel}`);

    const fme = annuaire.body.find((u) => u.email === "fme.airtel@hayatcom.cd");
    fmeAirtelId = fme.id;
  });

  test("le chef de projet peut envoyer un message au FME", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${tokenChefAirtel}`)
      .field("sujet", "Rapport hebdomadaire attendu")
      .field("corps", "Merci de transmettre votre rapport avant vendredi.")
      .field("destinataireIds", JSON.stringify([fmeAirtelId]));

    expect(res.status).toBe(201);
    expect(res.body.statut).toBe("REMIS");
  });

  test("le FME reçoit bien le message dans sa boîte de réception", async () => {
    const res = await request(app)
      .get("/api/messages/reception")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].sujet).toBe("Rapport hebdomadaire attendu");
    expect(res.body[0].lu).toBe(false);
  });

  test("lire un message le marque comme lu", async () => {
    const inbox = await request(app)
      .get("/api/messages/reception")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);

    const messageId = inbox.body[0].id;

    const lecture = await request(app)
      .get(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);
    expect(lecture.status).toBe(200);

    const inboxApres = await request(app)
      .get("/api/messages/reception")
      .set("Authorization", `Bearer ${tokenFmeAirtel}`);
    const meme = inboxApres.body.find((m) => m.id === messageId);
    expect(meme.lu).toBe(true);
  });

  test("un utilisateur ne peut pas lire un message qui ne lui est pas destiné", async () => {
    const sent = await request(app)
      .get("/api/messages/envoyes")
      .set("Authorization", `Bearer ${tokenChefAirtel}`);

    const messageId = sent.body[0].id;

    const tokenVodacom = await login("chef.vodacom@hayatcom.cd");
    const res = await request(app)
      .get(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${tokenVodacom}`);

    expect(res.status).toBe(404);
  });
});
