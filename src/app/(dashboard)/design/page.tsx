import { ColorExamples } from '@/components/examples/ColorExamples'

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-text-primary dark:text-text-inverted">
        Design System
      </h1>
      <p className="text-text-secondary dark:text-text-inverted mb-8">
        This page showcases the brand colors and UI components using our custom Tailwind CSS color palette.
      </p>
      
      <ColorExamples />
    </div>
  )
} 