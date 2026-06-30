import supabase from '../config/supabase.js'

/**
 * Retourne tous les avatars disponibles
 */
export async function getAllAvatars() {
  const { data, error } = await supabase
    .from('avatars')
    .select('id, name, path')
    .order('name')

  if (error) throw new Error('Erreur lors de la récupération des avatars')
  return data
}