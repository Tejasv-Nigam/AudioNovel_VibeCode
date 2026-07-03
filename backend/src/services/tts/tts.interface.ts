export interface ITTSService {
  /**
   * Synthesizes text into audio.
   * @param text The text to synthesize.
   * @param voice The requested voice (e.g., 'male', 'female', 'default').
   * @returns A Buffer containing the audio data (e.g., MP3).
   */
  synthesize(text: string, voice?: string): Promise<Buffer>;
}
