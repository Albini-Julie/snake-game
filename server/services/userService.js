import supabase from '../config/supabase.js'

/**
 * Récupère le profil complet d'un utilisateur avec son avatar
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, username, email, registration_date, avatar_id,
      avatars ( id, name, path )
    `)
    .eq('id', userId)
    .single()

  if (error) throw new Error('Erreur lors de la récupération du profil')
  return data
}

/**
 * Vérifie qu'un avatar existe en base
 */
export async function avatarExists(avatarId) {
  const { data, error } = await supabase
    .from('avatars')
    .select('id')
    .eq('id', avatarId)
    .single()

  return !error && !!data
}

/**
 * Met à jour ou crée le profil utilisateur avec un nouvel avatar
 */
export async function updateUserAvatar({ userId, avatarId, email }) {
  // Vérifie si le profil existe déjà
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('users')
      .update({ avatar_id: avatarId })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error("Erreur lors de la mise à jour de l'avatar")
    return data
  }

  // Profil pas encore créé → insertion
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      username: email.split('@')[0],
      avatar_id: avatarId,
    })
    .select()
    .single()

  if (error) throw new Error("Erreur lors de la création du profil")
  return data
}