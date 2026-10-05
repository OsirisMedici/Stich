import { DEFAULT_EXPORT_SETTINGS, type ExportSettings } from '../render/exportSettings'

/** The Mac runtime can read originals even while browser proxies are building. */
export function stichExportSettings(resolutionHeight: number | null, nativeAvailable: boolean): ExportSettings {
  return { ...DEFAULT_EXPORT_SETTINGS, resolutionHeight, decodeEngine: nativeAvailable ? 'ffmpeg' : 'auto' }
}
