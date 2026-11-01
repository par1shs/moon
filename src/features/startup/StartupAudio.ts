import { audioManager } from '../audio/audioManager'

/**
 * Startup audio trigger tailored for the JUNCTION+ cinematic intro sequence.
 */
export const playStartupSonicIdentity = async (force = false): Promise<boolean> => {
  return audioManager.playStartupSound(force)
}

export const getStartupAudioState = (): boolean => {
  return audioManager.getSoundEnabled()
}
