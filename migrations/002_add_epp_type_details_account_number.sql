-- Migration 002: Add epp_type, details to epps; account_number to institutions
-- Run this against the production database before deploying the code changes.

-- EPPs: campo Tipo de EPP
ALTER TABLE epps
  ADD COLUMN epp_type VARCHAR(100) NULL AFTER service;

-- EPPs: campo Detalles (texto libre: color, marca, etc.)
ALTER TABLE epps
  ADD COLUMN details TEXT NULL AFTER epp_type;

-- Instituciones: campo Cuenta (número de cliente, mín 19 dígitos → VARCHAR 25)
ALTER TABLE institutions
  ADD COLUMN account_number VARCHAR(25) NULL;
