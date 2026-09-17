-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `ressource` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `permissions_action_ressource_key`(`action`, `ressource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasseHash` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `direction` ENUM('DIRECTION_PAYS', 'REGIONALE', 'COMMERCIALE', 'FINANCE', 'RESSOURCES_HUMAINES', 'QUALITE', 'OPERATIONS_MS', 'ENTREPOT', 'TERRAIN_FME') NOT NULL,
    `operateur` ENUM('AIRTEL', 'VODACOM', 'ORANGE', 'RCS', 'FUEL', 'AUCUN') NOT NULL DEFAULT 'AUCUN',
    `managerId` INTEGER NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `derniereConnexion` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expireLe` DATETIME(3) NOT NULL,
    `revoque` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expediteurId` INTEGER NOT NULL,
    `sujet` VARCHAR(191) NOT NULL,
    `corps` TEXT NOT NULL,
    `dateEnvoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statut` ENUM('ENVOYE', 'REMIS', 'LU') NOT NULL DEFAULT 'ENVOYE',
    `supprimeExp` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_destinataires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `destinataireId` INTEGER NOT NULL,
    `lu` BOOLEAN NOT NULL DEFAULT false,
    `dateLecture` DATETIME(3) NULL,
    `supprimeDest` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `message_destinataires_messageId_destinataireId_key`(`messageId`, `destinataireId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dossiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `direction` ENUM('DIRECTION_PAYS', 'REGIONALE', 'COMMERCIALE', 'FINANCE', 'RESSOURCES_HUMAINES', 'QUALITE', 'OPERATIONS_MS', 'ENTREPOT', 'TERRAIN_FME') NULL,
    `operateur` ENUM('AIRTEL', 'VODACOM', 'ORANGE', 'RCS', 'FUEL', 'AUCUN') NOT NULL DEFAULT 'AUCUN',
    `proprietaireId` INTEGER NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fichiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dossierId` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `chemin` VARCHAR(191) NOT NULL,
    `taille` INTEGER NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `supprime` BOOLEAN NOT NULL DEFAULT false,
    `dateAjout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ajouteParId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pieces_jointes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NULL,
    `fichierId` INTEGER NULL,
    `nomFichier` VARCHAR(191) NOT NULL,
    `chemin` VARCHAR(191) NOT NULL,
    `taille` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapports_activite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `technicienId` INTEGER NOT NULL,
    `operateur` ENUM('AIRTEL', 'VODACOM', 'ORANGE', 'RCS', 'FUEL', 'AUCUN') NOT NULL,
    `zone` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `ressource` VARCHAR(191) NULL,
    `ressourceId` INTEGER NULL,
    `details` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `dateAction` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `noeuds_reseau` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `positionX` INTEGER NOT NULL DEFAULT 0,
    `positionY` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_expediteurId_fkey` FOREIGN KEY (`expediteurId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_destinataires` ADD CONSTRAINT `message_destinataires_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_destinataires` ADD CONSTRAINT `message_destinataires_destinataireId_fkey` FOREIGN KEY (`destinataireId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dossiers` ADD CONSTRAINT `dossiers_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `dossiers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dossiers` ADD CONSTRAINT `dossiers_proprietaireId_fkey` FOREIGN KEY (`proprietaireId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fichiers` ADD CONSTRAINT `fichiers_dossierId_fkey` FOREIGN KEY (`dossierId`) REFERENCES `dossiers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fichiers` ADD CONSTRAINT `fichiers_ajouteParId_fkey` FOREIGN KEY (`ajouteParId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_fichierId_fkey` FOREIGN KEY (`fichierId`) REFERENCES `fichiers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapports_activite` ADD CONSTRAINT `rapports_activite_technicienId_fkey` FOREIGN KEY (`technicienId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
