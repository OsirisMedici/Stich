import fs from 'node:fs'
import path from 'node:path'
import type { Project } from '../state/model'

/** Copy only referenced immutable transcripts before publishing a Save As project. */
export function copyTranscriptArtifacts(project: Project, from: string | null, to: string) {
  if (!from || path.resolve(from) === path.resolve(to)) return
  const ids = new Set(Object.values(project.compositions).flatMap(c => c.tracks.flatMap(t => t.layers))
    .map(l => (l.metadata.stich_transcript as {id?: string} | undefined)?.id).filter((id): id is string => !!id))
  for (const id of ids) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid transcript reference')
    const source = path.join(from, 'Transcripts', id + '.json')
    const target = path.join(to, 'Transcripts', id + '.json')
    const contents = fs.readFileSync(source)
    if (fs.existsSync(target)) {
      if (!contents.equals(fs.readFileSync(target))) throw new Error('Destination has a conflicting transcript artifact')
      continue
    }
    fs.mkdirSync(path.dirname(target), {recursive: true})
    fs.writeFileSync(target, contents, {flag: 'wx'})
  }
}
