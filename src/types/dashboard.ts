export interface Subscription {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: { url: string }
      medium: { url: string }
      high: { url: string }
    }
    resourceId: {
      channelId: string
    }
  }
  contentDetails: {
    totalItemCount: number
    newItemCount: number
    activityType: string
  }
}

export interface YouTubeSubscriptionsResponse {
  items: Array<Subscription>
  nextPageToken?: string
  pageInfo?: {
    totalResults: number
    resultsPerPage: number
  }
}

export type SelectionMode = 'REPLACE' | 'TOGGLE' | 'ADD'

export interface ConfirmationState {
  open: boolean
  type: 'single' | 'bulk'
  data?: any
}
