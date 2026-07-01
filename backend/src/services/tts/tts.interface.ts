export interface ITTSService {
  /**
   * Synthesizes text into audio.
   * @param text The text to synthesize.
   * @returns A Buffer containing the audio data (e.g., MP3).
   */
  synthesize(text: string): Promise<Buffer>;
}
