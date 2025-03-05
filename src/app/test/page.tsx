'use client';

import { Button } from "@/components/ui/button";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Tailwind CSS Test Page</h1>
          <p className="text-muted-foreground">Testing various Tailwind CSS features and components</p>
        </div>

        {/* Color System Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Color System</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-primary-foreground rounded-lg">Primary</div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">Secondary</div>
            <div className="p-4 bg-destructive text-destructive-foreground rounded-lg">Destructive</div>
            <div className="p-4 bg-muted text-muted-foreground rounded-lg">Muted</div>
          </div>
        </section>

        {/* Button Variants */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="destructive">Delete Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
          </div>
        </section>

        {/* Responsive Design */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Responsive Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-card text-card-foreground rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Card {i}</h3>
                <p className="text-sm text-muted-foreground">
                  This card demonstrates responsive grid layout and card styling.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Typography</h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base">Regular paragraph text</p>
            <p className="text-sm text-muted-foreground">Small muted text</p>
          </div>
        </section>

        {/* Spacing and Layout */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Spacing and Layout</h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full"></div>
              <div className="w-8 h-8 bg-secondary rounded-full"></div>
              <div className="w-8 h-8 bg-accent rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 