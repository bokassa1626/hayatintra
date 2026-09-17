// ============================================================================
// Middleware d'upload — partage de fichiers / GED
// (simulation Samba/SMB-CIFS — voir chapitre 2.2.3 du rapport)
// ============================================================================
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads", "fichiers");
const HISTORIQUE_DIR = path.join(UPLOAD_DIR, "_historique");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(HISTORIQUE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const suffixe = crypto.randomBytes(8).toString("hex");
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${suffixe}${extension}`);
  },
});

const MAX_TAILLE_MO = 50;

const uploadFichier = multer({
  storage,
  limits: { fileSize: MAX_TAILLE_MO * 1024 * 1024 },
});

module.exports = { uploadFichier, UPLOAD_DIR, HISTORIQUE_DIR };
