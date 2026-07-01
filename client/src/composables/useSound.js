/**
 * Composable pour générer des sons pixel art via Web Audio API
 * Pas de fichiers audio externes — tout est généré programmatiquement
 */

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

/**
 * Joue un bip simple style 8-bit
 * @param {number} frequency - Fréquence en Hz
 * @param {number} duration - Durée en secondes
 * @param {string} type - Type d'onde ('square' | 'sawtooth' | 'triangle' | 'sine')
 * @param {number} volume - Volume entre 0 et 1
 */
function playBeep(frequency = 440, duration = 0.1, type = 'square', volume = 0.3) {
  try {
    const ctx        = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode   = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type      = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    // Envelope : attaque immédiate, decay rapide style pixel art
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Silencieux si Web Audio non supporté
  }
}

export function useSound() {
  /**
   * Son de clic bouton primary — bip court montant
   */
  function playClick() {
    playBeep(440, 0.08, 'square', 0.2)
    setTimeout(() => playBeep(660, 0.06, 'square', 0.15), 40)
  }

  /**
   * Son de clic bouton secondary — bip court simple
   */
  function playClickSecondary() {
    playBeep(330, 0.07, 'square', 0.15)
  }

  /**
   * Son de succès / achievement débloqué
   */
  function playSuccess() {
    playBeep(523, 0.1, 'square', 0.2)
    setTimeout(() => playBeep(659, 0.1, 'square', 0.2), 100)
    setTimeout(() => playBeep(784, 0.15, 'square', 0.2), 200)
  }

  /**
   * Son d'erreur
   */
  function playError() {
    playBeep(200, 0.1, 'square', 0.2)
    setTimeout(() => playBeep(150, 0.15, 'square', 0.2), 80)
  }

  /**
   * Son de navigation (changement de page)
   */
  function playNav() {
    playBeep(392, 0.06, 'square', 0.12)
  }

  return { playClick, playClickSecondary, playSuccess, playError, playNav }
}