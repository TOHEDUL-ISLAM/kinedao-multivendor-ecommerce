import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '../hooks/use-translation'

export const Route = createFileRoute('/shipping')({
  component: Shipping,
})

function Shipping() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('footer.shipping')}</h1>
      <p>Content for Shipping Info page goes here.</p>
    </div>
  )
}
