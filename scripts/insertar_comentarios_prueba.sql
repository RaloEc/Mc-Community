-- Script para insertar comentarios de prueba
-- Reemplaza los valores de ID de noticia y autor según tu base de datos

-- Obtener un ID de usuario administrador para usar como autor
DO $$
DECLARE
    admin_user_id UUID;
    noticia_id_1 TEXT;
    noticia_id_2 TEXT;
BEGIN
    -- Obtener un ID de usuario administrador
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    -- Obtener dos IDs de noticias
    SELECT id::TEXT INTO noticia_id_1 FROM noticias LIMIT 1;
    SELECT id::TEXT INTO noticia_id_2 FROM noticias OFFSET 1 LIMIT 1;
    
    -- Insertar comentarios para la primera noticia
    IF noticia_id_1 IS NOT NULL AND admin_user_id IS NOT NULL THEN
        INSERT INTO comentarios (content_type, content_id, author_id, text)
        VALUES 
            ('noticia', noticia_id_1, admin_user_id, 'Este es un comentario de prueba para la primera noticia'),
            ('noticia', noticia_id_1, admin_user_id, 'Este es otro comentario para la misma noticia');
            
        RAISE NOTICE 'Insertados 2 comentarios para la noticia %', noticia_id_1;
    END IF;
    
    -- Insertar un comentario para la segunda noticia
    IF noticia_id_2 IS NOT NULL AND admin_user_id IS NOT NULL THEN
        INSERT INTO comentarios (content_type, content_id, author_id, text)
        VALUES ('noticia', noticia_id_2, admin_user_id, 'Este es un comentario para la segunda noticia');
        
        RAISE NOTICE 'Insertado 1 comentario para la noticia %', noticia_id_2;
    END IF;
    
    -- Mostrar el conteo actual de comentarios
    RAISE NOTICE 'Conteo actual de comentarios por noticia:';
    PERFORM c.content_id, COUNT(c.id)
    FROM comentarios c
    WHERE c.content_type = 'noticia'
    GROUP BY c.content_id;
    
END $$;
