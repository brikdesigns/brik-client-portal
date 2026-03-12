-- Rename 'real-estate' industry to 'commercial-real-estate' to reflect
-- the commercial brokerage / investment focus (not residential realty).
UPDATE companies
SET industry = 'commercial-real-estate'
WHERE industry = 'real-estate';
