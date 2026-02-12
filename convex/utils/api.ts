export async function handleApiError(response: Response, operation: string) {
  const error = await response.text()
  console.error(`${operation} Error`, error)
  throw new Error(`Failed to ${operation.toLowerCase()}`)
}
