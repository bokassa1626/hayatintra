// ============================================================================
// Middleware d'upload — pièces jointes des messages
// (simulation du stockage de fichiers, remplace un vrai serveur mail/SMB)
// ============================================================================
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads", "messages");

// Crée le dossier s'il n'existe pas encore
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // On préfixe par un identifiant aléatoire pour éviter les collisions et
    // les path traversal via le nom de fichier d'origine.
    const suffixe = crypto.randomBytes(8).toString("hex");
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${suffixe}${extension}`);
  },
});

const MAX_TAILLE_MO = 20;

const uploadMessage = multer({
  storage,
  limits: { fileSize: MAX_TAILLE_MO * 1024 * 1024 },
});

module.exports = { uploadMessage, UPLOAD_DIR };
