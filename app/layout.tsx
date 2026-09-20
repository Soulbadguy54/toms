import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Мир Дяди Тома — Продукты Дяди Тома / Tom’s',description:'Добро пожаловать в мир вкуса. Исследуйте ферму Дяди Тома и откройте два характера настоящего вкуса.',icons:{icon:'/ut-logo.jpg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
