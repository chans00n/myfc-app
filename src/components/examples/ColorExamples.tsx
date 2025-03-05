'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

// This component renders all brand color shades
const ColorSwatch = ({ shade }: { shade: number }) => {
  const colorClass = `bg-brand-${shade}`
  return (
    <div className="flex flex-col">
      <div className={`h-16 rounded-md flex items-end p-2 ${
        shade === 50 ? 'bg-brand-50' :
        shade === 100 ? 'bg-brand-100' :
        shade === 200 ? 'bg-brand-200' :
        shade === 300 ? 'bg-brand-300' :
        shade === 400 ? 'bg-brand-400' :
        shade === 500 ? 'bg-brand-500' :
        shade === 600 ? 'bg-brand-600' :
        shade === 700 ? 'bg-brand-700' :
        shade === 800 ? 'bg-brand-800' :
        shade === 900 ? 'bg-brand-900' :
        'bg-brand-950'
      }`}></div>
      <div className="mt-1 text-xs">
        <div className="font-medium">brand-{shade}</div>
        <div className="text-text-muted">{`var(--brand-${shade})`}</div>
      </div>
    </div>
  )
}

export function ColorExamples() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-inverted mb-4">Background Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-md bg-background-light border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2">Main Background (Light Mode)</h3>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-background-light border border-gray-300 mr-2"></div>
              <code className="text-sm">#F4F4F0</code>
            </div>
          </div>
          
          <div className="p-4 rounded-md bg-background-dark border border-gray-700">
            <h3 className="font-medium mb-2 text-white">Main Background (Dark Mode)</h3>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-background-dark border border-gray-600 mr-2"></div>
              <code className="text-sm text-white">#121212</code>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-inverted mb-4">Brand Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <ColorSwatch shade={50} />
          <ColorSwatch shade={100} />
          <ColorSwatch shade={200} />
          <ColorSwatch shade={300} />
          <ColorSwatch shade={400} />
          <ColorSwatch shade={500} />
          <ColorSwatch shade={600} />
          <ColorSwatch shade={700} />
          <ColorSwatch shade={800} />
          <ColorSwatch shade={900} />
          <ColorSwatch shade={950} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-inverted mb-4">Button Examples</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="brand">Brand Button</Button>
          <Button variant="brand-outline">Brand Outline</Button>
          <Button variant="brand-ghost">Brand Ghost</Button>
          <Button variant="brand" size="rounded">Rounded Brand</Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-inverted mb-4">UI Elements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-brand border border-brand-200 dark:border-brand-800">
            <h3 className="text-lg font-semibold text-brand-800 dark:text-brand-300 mb-2">Card with Brand Styling</h3>
            <p className="text-text-secondary dark:text-text-inverted">
              This card uses our brand colors for borders and text accents.
            </p>
            <div className="mt-4">
              <Button variant="brand-outline" size="sm">Learn More</Button>
            </div>
          </div>
          
          <div className="p-4 bg-brand-50 dark:bg-brand-950 rounded-brand">
            <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-200 mb-2">Brand Background Card</h3>
            <p className="text-text-secondary dark:text-brand-300">
              This card uses brand colors for the background, creating a highlighted section.
            </p>
            <div className="mt-4">
              <Button variant="brand" size="sm">Take Action</Button>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-inverted mb-4">Text Colors</h2>
        <div className="space-y-2">
          <p className="text-text-primary dark:text-text-inverted">Primary Text - For main content</p>
          <p className="text-text-secondary dark:text-text-secondary">Secondary Text - For supporting content</p>
          <p className="text-text-muted dark:text-text-muted">Muted Text - For less important information</p>
          <p className="text-brand-600 dark:text-brand-400">Brand Text - For emphasis and links</p>
          <p className="text-brand-800 dark:text-brand-200 font-bold">Brand Heading - For section titles</p>
        </div>
      </div>
      
      <div className="pt-4 border-t border-brand-200 dark:border-brand-800">
        <Button 
          variant="brand-ghost" 
          onClick={toggleDarkMode}
          className="flex items-center gap-2"
        >
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </Button>
      </div>
    </div>
  )
} 