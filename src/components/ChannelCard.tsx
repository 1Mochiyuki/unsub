import { memo, useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Channel {
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

type SelectionState = 'default' | 'selected'
type ViewMode = 'list' | 'grid'

interface ChannelCardProps {
  channel: Channel
  selectionState?: SelectionState
  viewMode?: ViewMode
  onUnsubscribe: () => void
}

export const ChannelCard = memo(function ChannelCard({
  channel,
  selectionState = 'default',
  viewMode = 'list',
  onUnsubscribe,
}: ChannelCardProps) {
  const [imageError, setImageError] = useState(false)

  // Reset image error when channel changes
  useEffect(() => {
    setImageError(false)
  }, [channel.id])

  const cardData = useMemo(
    () => ({
      title: channel.snippet.title,
      description: channel.snippet.description,
      mediumThumbnail:
        channel.snippet.thumbnails?.medium?.url ||
        channel.snippet.thumbnails?.default?.url ||
        '',
      initials: channel.snippet.title?.slice(0, 2).toUpperCase() || '??',
      videoCount: channel.contentDetails?.totalItemCount || 0,
      channelId: channel.snippet.resourceId?.channelId || '',
    }),
    [channel],
  )

  const {
    title,
    description,
    mediumThumbnail,
    initials,
    videoCount,
    channelId,
  } = cardData

  const channelUrl = `https://www.youtube.com/channel/${channelId}`

  if (viewMode === 'grid') {
    return (
      <div
        className={cn(
          'group relative flex flex-col gap-3 p-4 border rounded-2xl cursor-pointer transition-all duration-200',
          'bg-card border-border hover:border-primary/50 hover:bg-card/80',
          'data-[state=selected]:bg-primary/5 data-[state=selected]:border-primary data-[state=selected]:shadow-[0_0_15px_rgba(var(--primary),0.15)]',
        )}
        data-state={selectionState}
      >
        {/* Thumbnail */}
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-video rounded-lg overflow-hidden bg-muted group/link"
          onClick={(e) => e.stopPropagation()}
        >
          {!imageError && (
            <img
              src={mediumThumbnail}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-4xl font-bold text-muted-foreground/30">
                {initials}
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-2 text-white">
              <ExternalLink className="w-5 h-5" />
              <span className="font-semibold">View Channel</span>
            </div>
          </div>
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-bold text-sm leading-tight line-clamp-2 transition-colors',
              'text-foreground group-hover:text-primary/90',
              'group-data-[state=selected]:text-primary',
            )}
          >
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className="bg-secondary text-secondary-foreground border-none rounded text-[10px] px-2 py-0 h-5"
            >
              Channel
            </Badge>
            {videoCount > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {videoCount} videos
              </span>
            )}
          </div>
        </div>

        {/* Unsubscribe Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onUnsubscribe()
          }}
          className="w-full rounded-lg h-8"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Unsubscribe
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200',
        'bg-card border-border hover:border-primary/50 hover:bg-card/80',
        'data-[state=selected]:bg-primary/5 data-[state=selected]:border-primary data-[state=selected]:shadow-[0_0_15px_rgba(var(--primary),0.15)]',
      )}
      data-state={selectionState}
    >
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 shrink-0 group/link"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar className="w-14 h-14 border-2 border-border">
          <AvatarImage
            src={mediumThumbnail}
            alt={title}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-opacity duration-200">
          <ExternalLink className="w-5 h-5 text-white" />
        </div>
      </a>

      <div className="flex-1 min-w-0 pr-8">
        <h3
          className={cn(
            'font-bold text-base leading-tight truncate transition-colors',
            'text-foreground group-hover:text-primary/90',
            'group-data-[state=selected]:text-primary',
          )}
        >
          {title}
        </h3>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {description || 'No description available'}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant="secondary"
            className="bg-secondary text-secondary-foreground border-none rounded text-[10px] px-2 py-0 h-5"
          >
            Channel
          </Badge>
          {videoCount > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {videoCount} videos
            </span>
          )}
        </div>
      </div>

      {/* Unsubscribe Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onUnsubscribe()
        }}
        className="shrink-0 rounded-lg h-8 px-3"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
})

export default ChannelCard
