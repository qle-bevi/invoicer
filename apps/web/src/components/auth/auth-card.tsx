import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { ReactNode } from 'react'

interface AuthCardProps {
  children: ReactNode
  description: string
  footerLabel: string
  footerLinkLabel: string
  footerTo: '/login' | '/register'
  redirect: string
  title: string
}

export function AuthCard({
  children,
  description,
  footerLabel,
  footerLinkLabel,
  footerTo,
  redirect,
  title,
}: AuthCardProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center gap-1">
          <span>{footerLabel}</span>
          <Button asChild variant="link">
            <Link to={footerTo} search={{ redirect }}>
              {footerLinkLabel}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
