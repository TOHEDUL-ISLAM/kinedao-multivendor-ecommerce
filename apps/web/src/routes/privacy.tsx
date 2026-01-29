import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
})

function Privacy() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.privacy')}</h1>
      <p>Content for Privacy Policy page goes here.</p>
    </div>
  )
}
