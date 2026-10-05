// Readable ASCII transliteration, not translation. Acoustic/source IDs stay intact.
// Small local adapter; spellings can be corrected by the person. No external model.
const consonants: Record<string,string> = Object.fromEntries('क:k ख:kh ग:g घ:gh ङ:ng च:ch छ:chh ज:j झ:jh ञ:ny ट:t ठ:th ड:d ढ:dh ण:n त:t थ:th द:d ध:dh न:n प:p फ:ph ब:b भ:bh म:m य:y र:r ल:l व:v श:sh ष:sh स:s ह:h क़:q ख़:kh ग़:g ज़:z ड़:r ढ़:rh फ़:f'.split(' ').map(v => v.split(':')))
const vowels: Record<string,string> = Object.fromEntries('अ:a आ:aa इ:i ई:ee उ:u ऊ:oo ऋ:ri ए:e ऐ:ai ओ:o औ:au'.split(' ').map(v => v.split(':')))
const marks: Record<string,string> = Object.fromEntries('ा:aa ि:i ी:ee ु:u ू:oo ृ:ri े:e ै:ai ो:o ौ:au ं:n ँ:n ः:h ।:.'.split(' ').map(v => v.split(':')))
export function romanHindi(text: string): string {
  const chars=[...text.normalize('NFC')]; let out=''
  for(let i=0;i<chars.length;i++) { const c=chars[i]!; const next=chars[i+1]
    if(consonants[c]) { out+=consonants[c]; if(next!=='्' && !(next && marks[next]) && next!=='़' && next && /[\u0900-\u097f]/.test(next)) out+='a' }
    else if(vowels[c]) out+=vowels[c]
    else if(marks[c]) out+=marks[c]
    else if(c!=='्' && c!=='़') out+=c
  }
  return out
}
