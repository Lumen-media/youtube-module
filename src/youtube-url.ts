const VIDEO_ID_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/

export function parseVideoId(input: string): string | null {
  const match = input.match(VIDEO_ID_REGEX)
  return match?.[1] ?? null
}

export function isYouTubeUrl(input: string): boolean {
  return VIDEO_ID_REGEX.test(input)
}

export function makeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
