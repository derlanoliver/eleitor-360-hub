-- Set default values for aceita_reuniao and continua_projeto
ALTER TABLE office_visit_forms 
  ALTER COLUMN aceita_reuniao SET DEFAULT true,
  ALTER COLUMN continua_projeto SET DEFAULT true;