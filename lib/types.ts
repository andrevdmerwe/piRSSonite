export interface ParsedFeed {
  title: string
  entries: ParsedEntry[]
  hubUrl?: string
  topicUrl?: string
}

export interface ParsedEntry {
  url: string
  title: string
  content: string
  published: Date
}

export interface UnreadCounts {
  total: number
  byFolder: Record<number, number>
  byFeed: Record<number, number>
}

export interface RefreshResult {
  refreshed: number
  errors: string[]
}
