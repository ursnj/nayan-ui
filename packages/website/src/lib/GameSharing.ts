/** Copies the presented GPU frame before the browser clears its drawing buffer. */
function captureGame(surface: HTMLElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      try {
        const source = surface.querySelector("canvas");
        if (!source || source.width < 2 || source.height < 2)
          throw new Error("Wait for the game to finish loading, then share again.");
        const snapshot = document.createElement("canvas");
        snapshot.width = source.width;
        snapshot.height = source.height;
        const context = snapshot.getContext("2d");
        if (!context) throw new Error("Unable to capture the game screenshot.");
        context.drawImage(source, 0, 0);
        snapshot.toBlob((blob) => {
          if (blob) resolve(new File([blob], filename, { type: "image/png" }));
          else reject(new Error("Unable to capture the game screenshot."));
        }, "image/png");
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Shares a screenshot of the game with its link (the system share sheet where the browser can share
 * files), or downloads the screenshot and copies the link. Returns a status message, or null when the
 * player cancelled the share sheet.
 */
export async function shareGameScreenshot(
  surface: HTMLElement,
  gameId: string,
  title: string,
  onCaptured: () => void,
): Promise<string | null> {
  const file = await captureGame(surface, `nayan-ui-${gameId}.png`);
  onCaptured();
  const url = `${window.location.origin}/games/${gameId}`;
  const data = {
    title: `${title} on Nayan UI`,
    text: `Check out my game in ${title} on Nayan UI! ${url}`,
    files: [file],
  };
  if (navigator.share && navigator.canShare?.({ files: data.files })) {
    try {
      await navigator.share(data);
      return "Game shared.";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
      // Browsers can advertise file sharing and still reject it; fall back to the download.
    }
  }
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  try {
    await navigator.clipboard.writeText(url);
    return "Screenshot downloaded. Game link copied.";
  } catch {
    return "Screenshot downloaded.";
  }
}
