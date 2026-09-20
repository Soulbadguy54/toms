"use client";
import {useEffect,useRef} from "react";
import * as THREE from "three";

type Direction = 1|-1;

type Props = {
  direction: Direction;
  sourcePage: number;
  onMidpoint: ()=>void;
  onDone: ()=>void;
};

const WIDTH = 1280;
const HEIGHT = 720;

// Calibrated against the final Tom's catalog frame (0145.webp).
const PAGE = {
  left:  {x: 224, y: 154, w: 438, h: 438, angle: 10.4},
  right: {x: 654, y: 151, w: 430, h: 438, angle: -2.8},
} as const;

function cropPage(image:HTMLImageElement, side:"left"|"right"){
  const p=PAGE[side];
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(p.w*1.6);
  canvas.height=Math.round(p.h*1.6);
  const ctx=canvas.getContext("2d")!;
  ctx.scale(canvas.width/p.w,canvas.height/p.h);
  ctx.drawImage(image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);
  return canvas;
}

export default function ThreePageTurn({direction,sourcePage,onMidpoint,onDone}:Props){
  const host=useRef<HTMLDivElement>(null);
  const midpointRef=useRef(onMidpoint);
  const doneRef=useRef(onDone);
  midpointRef.current=onMidpoint;
  doneRef.current=onDone;

  useEffect(()=>{
    const el=host.current;
    if(!el)return;

    let disposed=false;
    let midpointSent=false;
    let raf=0;

    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,premultipliedAlpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(WIDTH,HEIGHT,false);
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.className="three-page-turn-canvas";
    el.appendChild(renderer.domElement);

    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(0,WIDTH,0,HEIGHT,-1000,1000);
    camera.position.z=300;

    const ambient=new THREE.AmbientLight(0xffffff,1.05);
    scene.add(ambient);
    const light=new THREE.DirectionalLight(0xfff2d2,1.3);
    light.position.set(200,500,500);
    scene.add(light);

    const sourceSide=direction>0?"right":"left";
    const p=PAGE[sourceSide];

    const image=new Image();
    image.decoding="async";
    image.src="/frames/toms/0145.webp";

    image.onload=async()=>{
      try{await image.decode();}catch{}
      if(disposed)return;

      const pageCanvas=cropPage(image,sourceSide);
      const texture=new THREE.CanvasTexture(pageCanvas);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;
      texture.magFilter=THREE.LinearFilter;

      // Dense geometry allows an actual paper-like curl instead of a flat card rotation.
      const segX=42,segY=10;
      const geometry=new THREE.PlaneGeometry(p.w,p.h,segX,segY);
      const uv=geometry.attributes.uv;
      const pos=geometry.attributes.position;

      // Move origin to the binding edge.
      geometry.translate(direction>0?p.w/2:-p.w/2,0,0);

      const material=new THREE.MeshStandardMaterial({
        map:texture,
        side:THREE.DoubleSide,
        transparent:true,
        roughness:.92,
        metalness:0,
      });
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(
        direction>0?p.x:p.x+p.w,
        HEIGHT-(p.y+p.h/2),
        10
      );
      mesh.rotation.z=THREE.MathUtils.degToRad(p.angle);
      scene.add(mesh);

      // Soft shadow beneath the turning page.
      const shadowGeo=new THREE.PlaneGeometry(p.w*.93,p.h*.92,1,1);
      const shadowMat=new THREE.MeshBasicMaterial({color:0x24170b,transparent:true,opacity:0,depthWrite:false});
      const shadow=new THREE.Mesh(shadowGeo,shadowMat);
      shadow.position.set(mesh.position.x+(direction>0?p.w*.5:-p.w*.5),mesh.position.y,-4);
      shadow.rotation.z=mesh.rotation.z;
      scene.add(shadow);

      const start=performance.now();
      const duration=760;

      const render=()=>{
        if(disposed)return;
        const t=Math.min(1,(performance.now()-start)/duration);
        const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

        if(!midpointSent&&t>=.5){
          midpointSent=true;
          midpointRef.current();
        }

        // Bend profile: binding stays fixed while outer edge lifts and curls.
        for(let i=0;i<pos.count;i++){
          const ox=pos.getX(i);
          const oy=pos.getY(i);
          const normalized=direction>0?ox/p.w:-ox/p.w;
          const u=Math.max(0,Math.min(1,normalized));

          const turn=Math.PI*eased;
          const localAngle=turn*(.22+.78*u);
          const radius=p.w*(.38+.24*(1-u));
          const arc=radius*Math.sin(localAngle)*u;
          const fold=radius*(1-Math.cos(localAngle))*u;

          const x=direction>0?arc:-arc;
          const z=fold + Math.sin(Math.PI*u)*Math.sin(Math.PI*eased)*34;
          const y=oy + Math.sin(Math.PI*u)*Math.sin(Math.PI*eased)*8;

          pos.setXYZ(i,x,y,z);
        }
        pos.needsUpdate=true;
        geometry.computeVertexNormals();

        shadowMat.opacity=.17*Math.sin(Math.PI*eased);
        shadow.scale.x=1+.12*Math.sin(Math.PI*eased);
        shadow.position.x=mesh.position.x+(direction>0?1:-1)*p.w*(.32+.18*eased);

        renderer.render(scene,camera);

        if(t<1)raf=requestAnimationFrame(render);
        else doneRef.current();
      };
      raf=requestAnimationFrame(render);
    };

    image.onerror=()=>{if(!disposed)doneRef.current();};

    return()=>{
      disposed=true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      renderer.domElement.remove();
    };
  },[direction,sourcePage]);

  return <div ref={host} className="three-page-turn" aria-hidden="true"/>;
}
