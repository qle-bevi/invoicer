import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ssr-demo')({
  ssr: true,
  component: SsrDemo,
})

function SsrDemo() {
  return (
    <main className="p-8" data-ssr-demo="enabled">
      <h1 className="text-4xl font-bold">SSR route</h1>
      <p className="mt-4 text-lg">
        This route opts into server-side rendering while the rest of the app stays client-rendered by default.
      </p>
    </main>
  )
}
