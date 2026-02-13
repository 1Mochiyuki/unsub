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

interface ChannelCardProps {
  channel: Channel
  selectionState?: SelectionState
  onToggleSelect: () => void
  onShiftClick?: () => void
  onUnsubscribe: () => void
}

export function ChannelCard({
  channel,
  selectionState = 'default',
  onToggleSelect,
  onShiftClick,
  onUnsubscribe,
}: ChannelCardProps) {
  const title = channel.snippet.title
  const description = channel.snippet.description
  const mediumThumbnail =
    channel.snippet.thumbnails?.medium?.url ||
    channel.snippet.thumbnails?.default?.url ||
    ''
  const initials = title?.slice(0, 2).toUpperCase() || '??'
  const videoCount = channel.contentDetails?.totalItemCount || 0

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return
        }
        if (e.shiftKey && onShiftClick) {
          e.stopPropagation()
          onShiftClick()
        } else {
          onToggleSelect()
        }
      }}
      className={cn(
        'group relative flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200',
        'bg-card border-border hover:border-primary/50 hover:bg-card/80',
        'data-[state=selected]:bg-primary/5 data-[state=selected]:border-primary data-[state=selected]:shadow-[0_0_15px_rgba(var(--primary),0.15)]',
      )}
      data-state={selectionState}
    >
      <Avatar className="w-14 h-14 border-2 border-border shrink-0">
        <AvatarImage
          src={mediumThumbnail}
          alt={title}
          referrerPolicy="no-referrer"
        />
        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>

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
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onUnsubscribe()
        }}
        className="shrink-0 text-destructive hover:bg-destructive/10 border border-border hover:border-destructive/30 rounded-lg h-8 px-3"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default ChannelCard
