import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/help')({
  component: Help,
})

function Help() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.helpCenter')}</h1>
      <p>Content for Help Center page goes here.</p>
    </div>
  )
}
