/** Original 24 fps video frames supplied by the user, 19 September 2026. */
export const sequences = {world:144,curtain:193,ut:145,toms:145,about:97,'toms-pages':97} as const;
export type SequenceName = keyof typeof sequences;
export const frameUrl=(name:SequenceName,index:number)=>`/frames/${name}/${String(Math.max(1,Math.min(sequences[name],index+1))).padStart(4,'0')}.webp`;

/** Keep a small decoded window. Browser HTTP caching handles revisited frames. */
export class FrameSequenceCache {
 private entries=new Map<string,Promise<HTMLImageElement>>();
 private disposed=false;
 get(name:SequenceName,index:number){
  const url=frameUrl(name,index),existing=this.entries.get(url);
  if(existing){this.entries.delete(url);this.entries.set(url,existing);return existing;}
  const pending=new Promise<HTMLImageElement>((resolve,reject)=>{
   const image=new Image();image.decoding='async';
   image.onload=async()=>{
    try{
     await image.decode();
     resolve(image);
    }catch{
     resolve(image); // fallback if decode fails
    }
   };
   image.onerror=()=>{this.entries.delete(url);reject(new Error('Не удалось загрузить кадр'));};
   image.src=url;
  });
  this.entries.set(url,pending);
  while(this.entries.size>40)this.entries.delete(this.entries.keys().next().value!);
  return pending;
 }
 warm(name:SequenceName,index:number,direction=1){
  if(this.disposed)return;
  // Keep a larger look-ahead window so fast scroll gestures do not outrun
  // network fetch + image decoding. Also keep a few frames behind for reversals.
  for(let offset=1;offset<=28;offset++){
   const next=index+offset*direction;
   if(next>=0&&next<sequences[name])void this.get(name,next).catch(()=>{});
  }
  for(let offset=1;offset<=6;offset++){
   const previous=index-offset*direction;
   if(previous>=0&&previous<sequences[name])void this.get(name,previous).catch(()=>{});
  }
 }
 dispose(){this.disposed=true;this.entries.clear();}
}
