-- Vincular o usuário existente ao formulário
UPDATE formulario_profissionais 
SET user_id = 'f8218119-dd04-42e3-addf-221a9eaa79d0' 
WHERE email = 'apvo1907@gmail.com' AND user_id IS NULL;