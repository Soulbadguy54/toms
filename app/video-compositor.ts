/** Key the supplied green plate without touching the original source file. */
export function createCurtainRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) {
    const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});
    if(!ctx)throw new Error('Canvas unavailable');
    const smoothstep=(start:number,end:number,value:number)=>{
      const t=Math.min(1,Math.max(0,(value-start)/(end-start)));
      return t*t*(3-2*t);
    };
    const matte=new Float32Array(canvas.width*canvas.height);
    return {
      draw(video:HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,visible:boolean){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if(!visible)return;
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const frame=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=frame.data;
        const width=canvas.width,height=canvas.height;
        for(let p=0,i=0;p<matte.length;p++,i+=4){
          const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          matte[p]=smoothstep(5,31,g-Math.max(r,b))*smoothstep(26,62,g);
        }
        for(let y=0,p=0;y<height;y++)for(let x=0;x<width;x++,p++){
          const i=p*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],maxRB=Math.max(r,b);
          let neighbour=0;
          if(x>0)neighbour=Math.max(neighbour,matte[p-1]);
          if(x+1<width)neighbour=Math.max(neighbour,matte[p+1]);
          if(y>0)neighbour=Math.max(neighbour,matte[p-width]);
          if(y+1<height)neighbour=Math.max(neighbour,matte[p+width]);
          const key=Math.max(matte[p],neighbour*0.56);
          const spill=smoothstep(0,20,g-maxRB);
          pixels[i+1]=Math.round(g+(maxRB-g)*spill);
          pixels[i+3]=Math.round(255*(1-key));
        }
        ctx.putImageData(frame,0,0);
      },
      dispose(){}
    };
  }
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
    return s;
  };
  const vertex = shader(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){ uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5); gl_Position=vec4(position,0.,1.); }');
  const fragment = shader(gl.FRAGMENT_SHADER, `precision highp float;
    varying vec2 uv; uniform sampler2D plate; uniform vec2 texel;
    float keyAt(vec2 point){
      vec3 sampleColor=texture2D(plate,point).rgb;
      float dominance=sampleColor.g-max(sampleColor.r,sampleColor.b);
      return smoothstep(0.02,0.122,dominance)*smoothstep(0.102,0.243,sampleColor.g);
    }
    void main(){
      vec4 c=texture2D(plate,uv);
      float key=keyAt(uv);
      float neighbour=max(
        max(keyAt(uv+vec2(texel.x,0.0)),keyAt(uv-vec2(texel.x,0.0))),
        max(keyAt(uv+vec2(0.0,texel.y)),keyAt(uv-vec2(0.0,texel.y)))
      );
      key=max(key,neighbour*0.56);
      float alpha=1.0-key;
      float maxRB=max(c.r,c.b);
      float spill=smoothstep(0.0,0.078,c.g-maxRB);
      c.g=mix(c.g,min(c.g,maxRB),spill);
      gl_FragColor=vec4(c.rgb,alpha);
    }`);
  const program = gl.createProgram()!;
  gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Shader linking failed');
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(program,'plate'),0);
  gl.uniform2f(gl.getUniformLocation(program,'texel'),1/canvas.width,1/canvas.height);
  gl.viewport(0,0,canvas.width,canvas.height);
  return {
    draw(video:HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, visible:boolean){
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      if(!visible)return;
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    },
    dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);}
  };
}
