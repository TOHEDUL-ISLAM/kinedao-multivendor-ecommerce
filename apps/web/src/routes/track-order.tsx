import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/track-order')({
  component: TrackOrder,
})

function TrackOrder() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.trackOrder')}</h1>
      <p>Content for Track Order page goes here.</p>
    </div>
  )
}
