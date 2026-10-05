export interface SpeechWord { id: string; text: string; roman: string; startUs: number; endUs: number }
export interface EditingTranscript { version: 1; id: string; mediaId: string; sourceHash: string; timing: string; words: SpeechWord[] }
export interface TranscriptRef { version: 1; id: string; corrections: Record<string, string> }
export interface StichJob { id: string; kind: 'transcript' | 'export'; state: 'running' | 'complete' | 'error' | 'cancelled'; stage: string; startedAt: number; elapsedMs?: number; result?: unknown; error?: string }
export interface StichStatus { workspace: string | null; revision: number; jobs: StichJob[]; editorUrl?: string }
export const STICH_TOOLS = [
  ['stich_status', 'Read browser editor connection, active workspace/revision and processing jobs.', true],
  ['open_stich_editor', 'Get a single-use localhost editor launch URL for the Codex browser. Open the URL to connect the full editor.', true],
  ['stich_save_project', 'Save the current project locally. Undo and named checkpoints last for the current open session.', false],
  ['stich_setup_local_speech', 'Install and select the free local Whisper Base runtime/model on this Mac. Track readiness in Models settings; no audio upload.', false],
  ['stich_preview', 'Play, pause or seek the live browser editor and return observed playback state. Browser audio may need one initial human Play gesture.', true],
  ['stich_find_files', 'List video/audio files immediately inside an explicitly requested local folder; bounded to 100 entries.', true],
  ['stich_move_project', 'Save and move the current project to a new absolute folder path, then reopen and validate it. Refuses an existing destination.', false],
  ['stich_transcribe', 'Start free LOCAL speech transcription for a normal-speed clip. Returns a job; poll stich_status. Does not add captions.', false],
  ['stich_read_transcript', 'Read source-anchored editing words for a clip, including surviving occurrences and Roman Hindi display.', true],
  ['stich_correct_text', 'Correct the display spelling of a word without changing its media/timing. Undoable.', false],
  ['stich_cut_words', 'Cut a consecutive selection of surviving word IDs from one normal-speed clip with linked sound and ripple, as ONE undoable edit. Requires workspace/revision from stich_status.', false],
  ['stich_export', 'Start MP4 export using the existing compositor on this Mac. Editor tab may close; local runtime must stay running. Returns a job.', false],
  ['stich_cancel_job', 'Cancel an active transcript or export job.', false],
] as const
const fields:Record<string,unknown> = {
  language:{type:'string',enum:['auto','en','hi']}, layerId:{type:'string'}, wordId:{type:'string'},
  wordIds:{type:'array',items:{type:'string'},minItems:1,maxItems:5000}, text:{type:'string',maxLength:500},
  workspace:{type:'string'}, revision:{type:'integer',minimum:0}, requestId:{type:'string',minLength:8},
  jobId:{type:'string'}, path:{type:'string'}, action:{type:'string',enum:['play','pause','seek']},
  timeUs:{type:'integer',minimum:0}, root:{type:'string'}, target:{type:'string',enum:['browser','desktop']},
  resolutionHeight:{type:['integer','null'],minimum:144,maximum:7680},
}
const inputs:Record<string,{required:string[];optional?:string[]}> = {
  stich_status:{required:[]},open_stich_editor:{required:[]},stich_save_project:{required:[]},stich_setup_local_speech:{required:[]},
  stich_preview:{required:['action'],optional:['timeUs','target']},stich_find_files:{required:['root']},
  stich_move_project:{required:['path']},stich_transcribe:{required:['layerId'],optional:['language']},
  stich_read_transcript:{required:['layerId']},stich_cancel_job:{required:['jobId']},
  stich_export:{required:['path'],optional:['resolutionHeight']},
  stich_correct_text:{required:['layerId','wordId','text','workspace','revision','requestId']},
  stich_cut_words:{required:['layerId','wordIds','workspace','revision','requestId']},
}
export const STICH_TOOL_DEFS = STICH_TOOLS.map(([name,description,readOnlyHint]) => {
  const input=inputs[name]!
  return {name,description,inputSchema:{type:'object' as const,properties:Object.fromEntries([...input.required,...input.optional??[]].map(k=>[k,fields[k]])),required:input.required,additionalProperties:false},annotations:{readOnlyHint,destructiveHint:!readOnlyHint,openWorldHint:false}}
})
