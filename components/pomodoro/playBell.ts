const BELL_SRC = "/sounds/bell.mp3";

export async function playBell(): Promise<void> {
  if (typeof window === "undefined") return;

  const audio = new Audio(BELL_SRC);
  audio.volume = 0.85;

  try {
    await audio.play();
  } catch {
    /* autoplay policy or load error */
  }
}
