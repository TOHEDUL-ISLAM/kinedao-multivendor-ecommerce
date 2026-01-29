import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/returns')({
  component: Returns,
})

function Returns() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.returns')}</h1>
      <p>Content for Returns & Refunds page goes here.</p>
    </div>
  )
}
