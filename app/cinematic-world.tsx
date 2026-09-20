"use client";
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ArrowUpRight,RotateCcw} from 'lucide-react';
import {createCurtainRenderer} from './video-compositor';
import {FrameSequenceCache,frameUrl,sequences,type SequenceName} from './frame-sequence';
const ozon='https://www.ozon.ru/search/?text=Продукты%20Дяди%20Тома';
type Destination='ut'|'toms'|'about';
type View='landing'|'transition'|'choice'|'destination';
type Character='plane'|'tomatoes'|'pepper'|'crow';
const characterRegions:Record<Character,[number,number,number,number]>={plane:[8,8,262,154],tomatoes:[785,510,245,206],pepper:[1000,390,260,316],crow:[978,0,290,328]};
const characterLabels:Record<Character,string>={plane:'Самолёт',tomatoes:'Братья-помидорки',pepper:'Пёс Перчик',crow:'Ворона'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export default function CinematicWorld({onAbout}:{onAbout:()=>void}){
 const root=useRef<HTMLElement>(null),track=useRef<HTMLDivElement>(null);
 const base=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null);
 const actions=useRef({choose:()=>{},open:(_brand:Destination)=>{},back:()=>{},flip:(_direction:1|-1=1)=>{},hover:(_character:Character|null)=>{},retry:()=>{}});
 const [view,setView]=useState<View>('landing'),[ready,setReady]=useState(false);
 const [destination,setDestination]=useState<Destination|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[loading,setLoading]=useState(false);
 const [catalogPage,setCatalogPage]=useState(0);
 const [bootProgress,setBootProgress]=useState(0),[bootReady,setBootReady]=useState(false);
 const hoverCanvas=useRef<HTMLCanvasElement>(null);
 const progressBar=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const ctx=base.current!.getContext('2d',{alpha:false});if(!ctx){setError(true);return;}
  const cache=new FrameSequenceCache(),renderer=createCurtainRenderer(overlay.current!);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let stopped=false,painting=false,target=0,last=-1,active:Destination|null=null,animating=false,frame=0,returnProgress=0,flipped=false;
  let revision=0,lastScene:View='landing',hoverRevision=0;
  const preloadInitial=async()=>{
   if(media.matches){setBootProgress(1);setBootReady(true);return;}
   const preloadTargets:Array<[SequenceName,number]>=[
    ...Array.from({length:16},(_,index)=>['world',index] as [SequenceName,number]),
    ...Array.from({length:24},(_,index)=>['curtain',index] as [SequenceName,number]),
   ];
   let completed=0;
   await Promise.allSettled(preloadTargets.map(([name,index])=>cache.get(name,index).finally(()=>{
    completed++;if(!stopped)setBootProgress(completed/preloadTargets.length);
   })));
   if(!stopped)setBootReady(true);
  };
  void preloadInitial();
  const snapshot=()=>{const image=document.createElement('canvas');image.width=1280;image.height=720;image.getContext('2d')!.drawImage(base.current!,0,0);return image;};
  const pause=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
  const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
  const stopHover=()=>{hoverRevision++;hoverCanvas.current?.getContext('2d')?.clearRect(0,0,1280,720);};
  const choiceFrame=()=>cache.get('ut',0);
  const hover=async(character:Character|null)=>{
   stopHover();if(!character||media.matches||active||lastScene!=='landing'||target>.025)return;
   const ticket=hoverRevision,hctx=hoverCanvas.current?.getContext('2d');if(!hctx)return;
   const [x,y,w,h]=characterRegions[character];
   const patch=document.createElement('canvas');patch.width=w;patch.height=h;const pc=patch.getContext('2d')!;
   const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mc=mask.getContext('2d')!;
   mc.filter='blur(7px)';mc.fillStyle='white';mc.fillRect(12,12,w-24,h-24);
   let n=0,direction=1;
   try{while(!stopped&&!active&&ticket===hoverRevision&&lastScene==='landing'&&target<=.025){
    const at=performance.now();cache.warm('world',n,direction);const image=await cache.get('world',n);
    if(stopped||active||ticket!==hoverRevision)return;
    pc.clearRect(0,0,w,h);pc.globalCompositeOperation='source-over';pc.drawImage(image,x,y,w,h,0,0,w,h);
    pc.globalCompositeOperation='destination-in';pc.drawImage(mask,0,0);pc.globalCompositeOperation='source-over';
    hctx.clearRect(0,0,1280,720);hctx.drawImage(patch,x,y);
    n+=direction;if(n>=18)direction=-1;if(n<=0)direction=1;
    await pause(Math.max(0,1000/24-(performance.now()-at)));
   }}catch{/* A hover request must never block navigation. */}
  };
  const changeView=(next:View)=>{if(lastScene!==next){lastScene=next;setView(next);}};
  const clearCurtain=()=>renderer.draw(base.current!,false);
  const paint=async()=>{
   if(painting||stopped||active)return;
   painting=true;
   try{
    while(!stopped&&!active&&last!==target){
     const p=target,epoch=revision;
     // Start on the first wheel gesture and distribute the full sequence across
     // almost the entire track: short travel, but no rushed section of motion.
     const wi=Math.round(clamp((p-.08)/.78)*143),ci=Math.round(clamp((p-.008)/.91)*192);
     const showCurtain=!media.matches&&p>.006&&p<.925;
     const [world,curtain]=await Promise.all([p>=.48?choiceFrame():cache.get('world',media.matches?0:wi),showCurtain?cache.get('curtain',ci):Promise.resolve(null)]);
     if(stopped||active||epoch!==revision)break;
     if(p>.006)stopHover();
     ctx.drawImage(world,0,0,1280,720);
     if(curtain)renderer.draw(curtain,true);else clearCurtain();
     changeView(p>=.975?'choice':p<.025?'landing':'transition');
     if(progressBar.current)progressBar.current.style.transform=`scaleX(${p})`;
     setReady(true);setError(false);
     const direction=p>=last?1:-1;
     last=p;
     cache.warm('world',wi,direction);if(showCurtain)cache.warm('curtain',ci,direction);
    }
   }catch{if(!stopped)setError(true);}finally{painting=false;}
  };
  gsap.registerPlugin(ScrollTrigger);
  const proxy={p:0};
  const tween=gsap.to(proxy,{p:1,ease:'none',paused:true,onUpdate:()=>{target=proxy.p;void paint();}});
  const trigger=ScrollTrigger.create({trigger:track.current,scroller:root.current!,start:'top top',end:'bottom bottom',animation:tween,scrub:.18,invalidateOnRefresh:true});
  target=trigger.progress;void paint();

  // Advance only after a frame is available. A slow connection never creates blanks
  // or skips the first part of a brand entrance; decoded frames stay memory-bounded.
  const play=async(name:SequenceName,from:number,to:number,anchor?:HTMLCanvasElement,onFrame?:(progress:number)=>void)=>{
   const direction=to>=from?1:-1,epoch=revision;
   if(media.matches){const image=await cache.get(name,to);if(!stopped&&epoch===revision){ctx.drawImage(image,0,0,1280,720);frame=to;}return;}
   for(let i=from;direction>0?i<=to:i>=to;i+=direction){
    const start=performance.now();cache.warm(name,i,direction);
    const image=await cache.get(name,i);
    if(stopped||epoch!==revision)return;
    ctx.save();
    // Register Tom’s camera to the shared choice frame, then release the small
    // scale/translation correction as the original camera begins its move.
    if(name==='toms'&&anchor){const strength=1-smooth(i/24),scale=1+.01179255*strength;ctx.translate(640-.34273936*strength,360+3.27998972*strength);ctx.scale(scale,scale);ctx.translate(-640,-360);}
    ctx.drawImage(image,0,0,1280,720);ctx.restore();
    if(anchor&&i<12){ctx.globalAlpha=1-smooth(i/12);ctx.drawImage(anchor,0,0);ctx.globalAlpha=1;}
    frame=i;setReady(true);
    const distance=Math.abs(to-from)||1;
    onFrame?.(Math.min(1,Math.abs(i-from)/distance));
    await new Promise<void>(resolve=>setTimeout(resolve,Math.max(0,1000/24-(performance.now()-start))));
   }
  };
  const open=async(brand:Destination)=>{
   if(active||animating)return;
   stopHover();const anchor=snapshot();
   active=brand;revision++;returnProgress=target;animating=true;setBusy(true);setDestination(brand);setCatalogPage(0);setError(false);setLoading(true);
   root.current!.style.overflowY='hidden';
   try{
    await cache.get(brand,0);if(stopped)return;
    changeView('transition');clearCurtain();setLoading(false);
    // Let the existing DOM labels fade before the camera starts moving.
    await new Promise(resolve=>setTimeout(resolve,media.matches?0:260));
    await play(brand,0,sequences[brand]-1,anchor);
    if(stopped)return;
    changeView('destination');
   }catch{if(!stopped){setError(true);changeView('destination');}}
   finally{animating=false;if(!stopped){setBusy(false);setLoading(false);}}
  };
  const back=async()=>{
   if(animating)return;
   if(!active){root.current?.scrollTo({top:0,behavior:media.matches?'instant':'smooth'});return;}
   animating=true;revision++;setBusy(true);setError(false);stopHover();
   try{
    const previous=snapshot(),next=returnProgress>=.48?await choiceFrame():await cache.get('world',0);
    if(stopped)return;
    setDestination(null);changeView('transition');clearCurtain();
    const start=performance.now(),duration=media.matches?0:180;
    do{if(stopped)return;const amount=duration?smooth((performance.now()-start)/duration):1;
     ctx.drawImage(next,0,0,1280,720);ctx.globalAlpha=1-amount;ctx.drawImage(previous,0,0);ctx.globalAlpha=1;
     if(amount>=1)break;await pause(16);
    }while(true);
    active=null;flipped=false;setCatalogPage(0);root.current!.style.overflowY='auto';target=returnProgress;last=-1;await paint();
   }catch{if(!stopped){setError(true);changeView('destination');}}
   finally{animating=false;if(!stopped)setBusy(false);}
  };
  const flip=(direction:1|-1=1)=>{
   if(active!=='toms')return;
   if(direction>0&&!flipped){flipped=true;setCatalogPage(1);}
   else if(direction<0&&flipped){flipped=false;setCatalogPage(0);}
  };
  const choose=()=>{if(active)return;root.current?.scrollTo({top:trigger.end,behavior:media.matches?'instant':'smooth'});};
  actions.current={choose,hover:character=>{void hover(character);},open:brand=>{void open(brand);},back:()=>{void back();},flip:direction=>{void flip(direction);},retry:()=>{setError(false);if(active){const brand=active;active=null;animating=false;void open(brand);}else{last=-1;void paint();}}};
  const brandEvent=(e:Event)=>{const name=(e as CustomEvent).detail;if(name==='ut'||name==='toms')void open(name);};
  const showChoice=()=>choose();const visible=()=>{if(!document.hidden)void paint();};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&active&&!document.querySelector('[role="dialog"]'))void back();};
  window.addEventListener('open-product-catalog',brandEvent);window.addEventListener('show-brand-choice',showChoice);document.addEventListener('visibilitychange',visible);window.addEventListener('keydown',key);
  return()=>{stopped=true;stopHover();revision++;tween.kill();trigger.kill();cache.dispose();renderer.dispose();window.removeEventListener('open-product-catalog',brandEvent);window.removeEventListener('show-brand-choice',showChoice);document.removeEventListener('visibilitychange',visible);window.removeEventListener('keydown',key);};
 },[]);
 return <section ref={root} id="world" className="world sequence-world" aria-label="Мир Дяди Тома" aria-busy={busy||!bootReady}>
  {!bootReady&&<div className="site-preloader" role="status" aria-live="polite">
   <img src="/ut-logo-transparent.png" alt="" className="site-preloader-logo"/>
   <div className="site-preloader-copy"><strong>Добро пожаловать в мир вкуса</strong><span>Подготавливаем сцену… {Math.round(bootProgress*100)}%</span></div>
   <div className="site-preloader-track" aria-hidden="true"><span style={{transform:`scaleX(${bootProgress})`}}/></div>
  </div>}
  <div ref={track} className="world-track"><div className="world-stage">
   <div className="world-frame">
    {!ready&&<img className="world-video" src={frameUrl('world',0)} alt="Ферма Дяди Тома" fetchPriority="high"/>}
    <canvas ref={base} className="world-video" width={1280} height={720} aria-hidden="true" style={{visibility:ready?'visible':'hidden'}}/>
    <canvas ref={hoverCanvas} className="character-motion" width={1280} height={720} aria-hidden="true"/>
    <div className="world-ui" data-scene={view}>
     <div className="character-hotspots" inert={view!=='landing'||busy} aria-hidden={view!=='landing'}>
      {(Object.keys(characterRegions) as Character[]).map(character=><button key={character} type="button" className={`character-hit character-${character}`} aria-label={`${characterLabels[character]} — смотреть видео`} onPointerEnter={()=>actions.current.hover(character)} onPointerLeave={()=>actions.current.hover(null)} onFocus={()=>actions.current.hover(character)} onBlur={()=>actions.current.hover(null)} onClick={()=>actions.current.open('about')}>
       <span className="character-card"><strong>{characterLabels[character]}</strong><span>Текст заглушка</span></span>
      </button>) }
     </div>
     <nav className="world-nav" aria-label="Навигация"><button type="button" onClick={()=>actions.current.choose()}>Продукты</button><button type="button" onClick={onAbout}>О нас</button><a className="world-ozon" href={ozon} target="_blank" rel="noopener noreferrer">Мы на <b>Ozon</b><ArrowUpRight size={18}/></a></nav>
     <div className="world-intro"><img className="landing-brand" src="/ut-logo-transparent.png" alt="Продукты Дяди Тома"/><div className="welcome-cloud"><h1>Добро пожаловать<br/>в мир вкуса</h1><p>Для любимых семейных традиций</p></div></div>
     <p className="landing-sign-copy"><span>Вкус<br/>начинается<br/>дома</span></p>
     <div className="world-choice" inert={view!=='choice'||busy} aria-hidden={view!=='choice'}>
      <div className="world-choice-heading"><h2>Выберите свой вкус</h2><p>Два характера. Настоящий вкус.</p></div>
      <a className="sign-link sign-ut" href="#catalog-ut" onClick={e=>{e.preventDefault();actions.current.open('ut');}} aria-label="Открыть каталог Продукты Дяди Тома"><img className="original-wordmark" src="/ut-wordmark-transparent.png" alt="Продукты Дяди Тома"/></a>
      <a className="sign-link sign-toms" href="#catalog-toms" onClick={e=>{e.preventDefault();actions.current.open('toms');}} aria-label="Открыть каталог Tom’s"><img src="/toms-logo-transparent.png" alt="Tom’s"/></a>
     </div>
    </div>
    {(destination==='ut'||destination==='toms')&&view==='destination'&&catalogPage>=0&&<BookCatalog brand={destination} page={catalogPage} onTurnPage={direction=>actions.current.flip(direction)}/>} 
    {destination==='about'&&view==='destination'&&<div className="projection-video"><video src="/video/world.mp4" aria-label="Пример видео на экране Дяди Тома" controls autoPlay muted playsInline loop preload="metadata"/></div>}
    <canvas ref={overlay} className="world-curtain" width={1280} height={720} aria-hidden="true"/>
   </div>
   {(view==='choice'||view==='destination')&&<div className="world-controls"><button type="button" disabled={busy} onClick={()=>actions.current.back()}><RotateCcw size={16}/>{destination?'Назад':'В начало'}</button></div>}
   {(loading||error)&&<div className="sequence-status" role="status">{error?<><span>Не удалось загрузить кадры.</span><button onClick={()=>actions.current.retry()}>Повторить</button></>:<span>Загружаем сцену…</span>}</div>}
   <div className="world-progress" aria-hidden="true"><span ref={progressBar}/></div>
  </div></div>
 </section>;
}


type CatalogProduct={
 id:string;
 label:string;
 description:string;
 image:string;
 x:number;
 y:number;
 popup:[string,string];
};

const tomatoPlaceholder='https://images.unsplash.com/photo-1594567170531-bb0a139aaba3?auto=format&fit=crop&w=640&q=82';
const bottlePlaceholder='https://images.unsplash.com/photo-1603824255873-bb3608d7e545?auto=format&fit=crop&w=640&q=82';

function BookCatalog({brand,page,onTurnPage}:{brand:'ut'|'toms';page:number;onTurnPage:(direction:1|-1)=>void}){
 const [hovered,setHovered]=useState<CatalogProduct|null>(null);
 const [turning,setTurning]=useState<1|-1|0>(0);
 const turnPage=(direction:1|-1)=>{
  if(turning||(direction>0&&page===1)||(direction<0&&page===0))return;
  setHovered(null);setTurning(direction);
  window.setTimeout(()=>{onTurnPage(direction);setTurning(0);},620);
 };
 const tomsPages:CatalogProduct[][]=[
  [
   {id:'sweet-chili',label:'Sweet Chili',description:'Текст-заглушка для описания продукта. Здесь позже появятся вкус, состав, формат упаковки и рекомендации по подаче.',image:bottlePlaceholder,x:240,y:274,popup:['30%','51%']},
   {id:'barbecue',label:'Barbecue',description:'Текст-заглушка для описания продукта. Здесь позже появится короткая история вкуса и основные характеристики.',image:bottlePlaceholder,x:240,y:309,popup:['30%','56%']},
   {id:'sriracha',label:'Sriracha Hot',description:'Текст-заглушка для описания острого соуса и его сочетаний с блюдами.',image:tomatoPlaceholder,x:240,y:344,popup:['30%','61%']},
   {id:'sweet-sour',label:'Sweet & Sour',description:'Текст-заглушка для описания кисло-сладкого соуса и подходящих блюд.',image:tomatoPlaceholder,x:240,y:379,popup:['30%','66%']},
   {id:'soy-teriyaki',label:'Soy · Teriyaki',description:'Текст-заглушка для азиатской линейки: вкус, формат и рекомендации по использованию.',image:bottlePlaceholder,x:748,y:274,popup:['69%','51%']},
   {id:'unagi',label:'Unagi',description:'Текст-заглушка для продукта. Позже здесь будет описание вкуса и применения.',image:bottlePlaceholder,x:748,y:309,popup:['69%','56%']},
   {id:'ginger',label:'Ginger',description:'Текст-заглушка для имбирного вкуса и сочетаний.',image:tomatoPlaceholder,x:748,y:344,popup:['69%','61%']},
   {id:'hot-chili',label:'Hot Chili',description:'Текст-заглушка для острого соуса и рекомендаций по подаче.',image:tomatoPlaceholder,x:748,y:379,popup:['69%','66%']},
  ],
  [
   {id:'apple',label:'Яблочный',description:'Текст-заглушка для яблочного сока: состав, объём и вкусовой профиль.',image:tomatoPlaceholder,x:240,y:278,popup:['30%','52%']},
   {id:'grape',label:'Виноградный',description:'Текст-заглушка для виноградного сока и его характеристик.',image:bottlePlaceholder,x:240,y:320,popup:['30%','59%']},
   {id:'pomegranate',label:'Гранатовый',description:'Текст-заглушка для гранатового сока и его характеристик.',image:tomatoPlaceholder,x:240,y:362,popup:['30%','65%']},
   {id:'ketchup-classic',label:'Томатный',description:'Текст-заглушка для классического томатного кетчупа.',image:tomatoPlaceholder,x:748,y:278,popup:['69%','52%']},
   {id:'ketchup-grill',label:'Для гриля',description:'Текст-заглушка для кетчупа к грилю.',image:bottlePlaceholder,x:748,y:320,popup:['69%','59%']},
   {id:'ketchup-hot',label:'Острый',description:'Текст-заглушка для острого кетчупа.',image:tomatoPlaceholder,x:748,y:362,popup:['69%','65%']},
  ],
 ];
 const utProducts:CatalogProduct[]=[
  {id:'apple-ut',label:'Яблочный · Томатный',description:'Текст-заглушка для соков и нектаров «Продукты Дяди Тома».',image:tomatoPlaceholder,x:410,y:276,popup:['40%','53%']},
  {id:'apricot-ut',label:'Абрикосовый · Тыквенный',description:'Текст-заглушка для линейки соков и нектаров.',image:bottlePlaceholder,x:410,y:307,popup:['40%','59%']},
  {id:'carrot-ut',label:'Морковный · Шиповник',description:'Текст-заглушка для линейки соков и нектаров.',image:tomatoPlaceholder,x:410,y:338,popup:['40%','65%']},
  {id:'krasnodar-ut',label:'Краснодарский соус',description:'Текст-заглушка для соуса: вкус, состав и подача.',image:tomatoPlaceholder,x:795,y:343,popup:['69%','57%']},
  {id:'tomato-ut',label:'Кетчуп томатный',description:'Текст-заглушка для томатного кетчупа.',image:bottlePlaceholder,x:795,y:374,popup:['69%','63%']},
  {id:'bbq-ut',label:'Шашлычный · Острый',description:'Текст-заглушка для шашлычного и острого вкусов.',image:tomatoPlaceholder,x:795,y:405,popup:['69%','69%']},
 ];
 const products=brand==='toms'?tomsPages[Math.min(page,1)]:utProducts;
 const renderItems=(side:'left'|'right')=>products.filter(product=>side==='left'?product.x<650:product.x>=650).map(product=>
  <text key={product.id} className="book-item" x={product.x<650?0:0} y={product.y-(brand==='ut'?(product.x<650?185:252):176)}
   tabIndex={0} role="button"
   onPointerEnter={()=>setHovered(product)} onPointerLeave={()=>setHovered(null)}
   onFocus={()=>setHovered(product)} onBlur={()=>setHovered(null)}>{product.label}</text>
 );
 return <div className={`book-catalog book-catalog-${brand}${turning?` is-turning turn-${turning>0?'forward':'backward'}`:''}`} role="region" aria-label={brand==='ut'?'Каталог продуктов Дяди Тома':'Каталог Tom’s'}>
  <svg viewBox="0 0 1280 720" aria-hidden="false">
   {brand==='ut'?<>
    <g className="book-ink ut-page-left book-perspective-left" transform="translate(410 185) rotate(10.6) skewY(1.4) scale(.985 1)">
     <text className="book-kicker" x="0" y="0">ПРОДУКТЫ ДЯДИ ТОМА</text><text className="book-title" x="0" y="42">Соки и нектары</text><path d="M0 58H255"/>
     {renderItems('left')}<text className="book-note" x="0" y="212">Натуральный вкус щедрого сада</text>
    </g>
    <g className="book-ink ut-page-right book-perspective-right" transform="translate(795 252) rotate(-8) skewY(-1.6) scale(.985 1)">
     <text className="book-kicker" x="0" y="0">К СЕМЕЙНОМУ СТОЛУ</text><text className="book-title" x="0" y="42">Соусы и кетчупы</text><path d="M0 58H245"/>
     {renderItems('right')}<text className="book-note" x="0" y="212">Вкус начинается дома</text>
    </g>
   </>:page===0?<>
    <g className="book-ink toms-page-left book-perspective-left" transform="translate(240 176) rotate(10.4) skewY(1.5) scale(.975 1)">
     <text className="book-kicker" x="0" y="0">TOM’S · SAUCE COLLECTION</text><text className="book-title" x="0" y="44">Соусы</text><path d="M0 62H310"/>{renderItems('left')}<text className="book-note" x="0" y="270">Яркие вкусы для любимых блюд</text>
    </g>
    <g className="book-ink toms-page-right book-perspective-right" transform="translate(748 176) rotate(-2.8) skewY(-1.5) scale(.975 1)">
     <text className="book-kicker" x="0" y="0">CHEF’S CHOICE</text><text className="book-title" x="0" y="44">Азиатская линия</text><path d="M0 62H310"/>{renderItems('right')}<text className="book-note" x="0" y="270">Точная подача. Чистый вкус.</text>
    </g>
   </>:<>
    <g className="book-ink toms-page-left book-perspective-left" transform="translate(240 176) rotate(2.4) skewY(1.7) scale(.975 1)">
     <text className="book-kicker" x="0" y="0">TOM’S · JUICE BAR</text><text className="book-title" x="0" y="44">Соки 0,2 л</text><path d="M0 62H310"/>{renderItems('left')}<text className="book-note" x="0" y="270">Удобный формат — насыщенный вкус</text>
    </g>
    <g className="book-ink toms-page-right book-perspective-right" transform="translate(748 176) rotate(-2.6) skewY(-1.8) scale(.975 1)">
     <text className="book-kicker" x="0" y="0">TOM’S · KETCHUP</text><text className="book-title" x="0" y="44">Кетчупы</text><path d="M0 62H310"/>{renderItems('right')}<text className="book-note" x="0" y="270">Классика с характером Tom’s</text>
    </g>
   </>}
  </svg>
  {hovered&&<div className="catalog-popover" style={{left:hovered.popup[0],top:hovered.popup[1]}}>
   <img src={hovered.image} alt="" loading="lazy"/>
   <div><strong>{hovered.label}</strong><p>{hovered.description}</p></div>
  </div>}
  {brand==='toms'&&<>
   <div className="book-live-pages" aria-hidden="true">
    <div className="book-live-page book-live-left"/>
    <div className="book-live-page book-live-right"/>
    {turning!==0&&<div className={`book-turn-sheet ${turning>0?'turn-sheet-forward':'turn-sheet-backward'}`}>
      <div className="book-turn-face book-turn-front"/>
      <div className="book-turn-face book-turn-back"/>
    </div>}
   </div>
   <button className="book-page-edge book-page-edge-left" type="button" aria-label="Предыдущая страница" disabled={page===0||!!turning} onClick={()=>turnPage(-1)}><span>‹</span></button>
   <button className="book-page-edge book-page-edge-right" type="button" aria-label="Следующая страница" disabled={page===1||!!turning} onClick={()=>turnPage(1)}><span>›</span></button>
  </>}
 </div>;
}
