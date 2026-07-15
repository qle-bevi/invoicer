import { describe, expect, it } from 'vitest'

import { sanitizeRedirect } from './auth-routing'

describe('authentication redirects', () => {
  it('keeps internal destinations and rejects external redirects', () => {
    expect(sanitizeRedirect('/factures?filtre=retard')).toBe(
      '/factures?filtre=retard',
    )
    expect(
      sanitizeRedirect(
        'https://invoicer.test/clients',
        'https://invoicer.test',
      ),
    ).toBe('/clients')
    expect(
      sanitizeRedirect(
        'https://attacker.test/phishing',
        'https://invoicer.test',
      ),
    ).toBe('/')
    expect(
      sanitizeRedirect('//attacker.test/phishing', 'https://invoicer.test'),
    ).toBe('/')
  })
})
