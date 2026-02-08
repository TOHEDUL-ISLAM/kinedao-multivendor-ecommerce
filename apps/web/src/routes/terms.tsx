import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/terms')({
  component: Terms,
})

function Terms() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.terms')}</h1>
      <p>Content for Terms & Conditions page goes here.</p>
    </div>
  )
}
