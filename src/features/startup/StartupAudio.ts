import { audioManager } from '../audio/audioManager'

/**
 * Startup audio trigger tailored for the cinematic intro sequence.
 * Startup intro sound effect has been removed.
 */
export const playStartupSonicIdentity = async (_force = false): Promise<boolean> => {
  return false
}

export const getStartupAudioState = (): boolean => {
  return audioManager.getSoundEnabled()
}
