// ============================================================================
// Client Prisma unique — importé partout ailleurs dans le backend
// ============================================================================
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
