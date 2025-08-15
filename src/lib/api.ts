import { supabase } from './supabase';
import { Servidor, Noticia } from '../types';

// Funciones para servidores
export async function getServidores() {
  const { data, error } = await supabase
    .from('servidores')
    .select('*')
    .order('destacado', { ascending: false });
  
  if (error) throw error;
  return data as Servidor[];
}

export async function getServidorById(id: string) {
  const { data, error } = await supabase
    .from('servidores')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Servidor;
}

// Funciones para noticias
export async function getNoticias() {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .order('fecha_publicacion', { ascending: false });
  
  if (error) throw error;
  return data as Noticia[];
}

export async function getNoticiaById(id: string) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Noticia;
}

// Funciones para usuarios y autenticación
export async function createAdminUser(email: string, password: string, username: string) {
    const response = await fetch('/api/admin/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear usuario administrador')
    }
    
    return data.user
  }