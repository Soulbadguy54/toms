"use client";
import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import CinematicWorld from './cinematic-world';
export default function Home(){
 const [dialog,setDialog]=useState<'about'|'contacts'|null>(null);
 return <div className="site">
 <a className="skip-link" href="#catalog-ut" onClick={e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('open-product-catalog',{detail:'ut'}))}}>Перейти к каталогу</a>
 <main><CinematicWorld onAbout={()=>setDialog('about')}/>
 </main>
    <footer hidden><span>Продукты Дяди Тома / Tom’s</span><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Вернуться в наш мир ↑</button></footer>
    <Dialog open={!!dialog} onOpenChange={v=>{if(!v)setDialog(null)}}><DialogContent className="brand-dialog"><DialogTitle>{dialog==='about'?'Два характера. Одна семья.':'Связаться с нами'}</DialogTitle><DialogDescription>{dialog==='about'?'«Продукты Дяди Тома» и Tom’s — соки, нектары, соусы, кетчупы и повидло собственного производства. Создаём продукты для семейного стола и смелых кулинарных идей.':'Вопросы о заказе и доставке можно задать продавцу на странице товара в Ozon. Выберите продукт и откройте раздел вопросов.'}</DialogDescription>{dialog==='contacts'&&<a className="brand-cta" href="https://www.ozon.ru/search/?text=Продукты%20Дяди%20Тома" target="_blank" rel="noopener noreferrer">Найти на Ozon <ArrowUpRight size={18}/></a>}</DialogContent></Dialog>

  </div>
}
