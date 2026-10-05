import { expect, it } from 'vitest'
import { stichExportSettings } from './exportSettings'
import { resolveExportDecodeRouting } from '../render/exportDecodeRouting'

it('exports an original through native decode without waiting for an unfinished browser proxy', () => {
  const settings = stichExportSettings(1080, true)
  const routing = resolveExportDecodeRouting({ setting: settings.decodeEngine, componentAvailable: true, bitDepth: 8,
    media: [{ id: 'recording', kind: 'Video', path: '/recording.mov', decode_route: { route: 'proxied', full_proxy: null, quick_proxy: null, format_version: 0 } }] })
  expect(routing.routes.recording).toEqual({ engine: 'native', sourcePath: '/recording.mov' })
})

it('retains capability fallback when the native component is unavailable', () => {
  expect(stichExportSettings(null, false).decodeEngine).toBe('auto')
})
