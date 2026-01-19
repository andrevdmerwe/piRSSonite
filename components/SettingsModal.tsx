'use client'

import ManageFeedsModal from './ManageFeedsModal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export default function SettingsModal({ isOpen, onClose, onRefresh }: SettingsModalProps) {
  // Wrapper for future settings tabs - for now, just manage feeds
  return (
    <ManageFeedsModal
      isOpen={isOpen}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  )
}
