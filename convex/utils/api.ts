export async function handleApiError(response: Response, operation: string) {
  const errorText = await response.text()
  console.error(`${operation} Error`, errorText)

  let errorMessage = `Failed to ${operation.toLowerCase()}`

  try {
    const errorJson = JSON.parse(errorText)

    if (errorJson.error) {
      const errorCode = errorJson.error.status || response.status

      switch (errorCode) {
        case 401:
          errorMessage = 'Session expired. Please sign in again.'
          break
        case 403:
          if (errorJson.error.message?.includes('quota')) {
            errorMessage = 'YouTube quota exceeded. Please try again later.'
          } else {
            errorMessage = 'Permission denied. Check your account access.'
          }
          break
        case 404:
          errorMessage = 'Channel or subscription not found.'
          break
        case 429:
          errorMessage =
            'Too many requests. Please wait a moment and try again.'
          break
        default:
          errorMessage = errorJson.error.message || errorMessage
      }
    }
  } catch {
    if (response.status === 401) {
      errorMessage = 'Session expired. Please sign in again.'
    } else if (response.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.'
    }
  }

  throw new Error(errorMessage)
}
