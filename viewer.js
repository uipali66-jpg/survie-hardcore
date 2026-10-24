
/* Visionneuse locale : géométrie des modèles Minecraft + UV des textures du pack. */
const ModelViewer=(()=>{
 const cache=new Map(), running=new Set();
 function model(id){return MODELS[id]||null}
 function viewer(id,extra=''){
  return model(id)?`<canvas class="model3d ${extra}" data-model="${id.replace(/"/g,'&quot;')}" width="260" height="260" role="img" aria-label="Modèle 3D rotatif : ${id.replace(/"/g,'&quot;')}"></canvas>`:'';
 }
 function boot(scope=document){
  scope.querySelectorAll('canvas.model3d:not([data-ready])').forEach(c=>{
   c.dataset.ready='1';let m=model(c.dataset.model);if(!m)return;
   const state={angle:-.65,tilt:.38,drag:false,last:0,scale:1,frames:[]};
   c.addEventListener('pointerdown',e=>{state.drag=true;state.last=e.clientX;c.setPointerCapture(e.pointerId)});
   c.addEventListener('pointerup',()=>state.drag=false);
   c.addEventListener('pointercancel',()=>state.drag=false);
   c.addEventListener('pointermove',e=>{if(state.drag){state.angle+=(e.clientX-state.last)*.012;state.last=e.clientX}});
   const imgs={};
   for(const [key,url] of Object.entries(m.textures)){
    if(!cache.has(url)){const im=new Image();im.src=url;cache.set(url,im)}
    imgs[key]=cache.get(url);
   }
   const dims=m.elements.flatMap(e=>[e.from,e.to]);
   const min=[0,1,2].map(k=>Math.min(...dims.map(p=>p[k]))),max=[0,1,2].map(k=>Math.max(...dims.map(p=>p[k])));
   const center=min.map((v,k)=>(v+max[k])/2),extent=Math.max(...min.map((v,k)=>max[k]-v),1);
   const cv=c.getContext('2d',{alpha:true});
   const visible=()=>{let r=c.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight};
   function rot(p,axis,a){const s=Math.sin(a),t=Math.cos(a),[x,y,z]=p;
    if(axis==='x')return [x,y*t-z*s,y*s+z*t];
    if(axis==='y')return [x*t+z*s,y,-x*s+z*t];
    return [x*t-y*s,x*s+y*t,z];}
   function project(p){
    let v=[p[0]-center[0],p[1]-center[1],p[2]-center[2]];
    v=rot(v,'y',state.angle);v=rot(v,'x',state.tilt);
    const size=195/extent;return [c.width/2+v[0]*size,c.height/2-v[1]*size,v[2]];}
   const faces={
    north:[0,3,2,1],south:[4,5,6,7],west:[4,0,1,5],
    east:[3,7,6,2],up:[1,2,6,5],down:[4,7,3,0]
   };
   function tri(im,pts,uv){
    const [p0,p1,p2]=pts,[t0,t1,t2]=uv;
    const det=(t0[0]*(t1[1]-t2[1])+t1[0]*(t2[1]-t0[1])+t2[0]*(t0[1]-t1[1]));
    if(Math.abs(det)<.00001)return;
    const a=(p0[0]*(t1[1]-t2[1])+p1[0]*(t2[1]-t0[1])+p2[0]*(t0[1]-t1[1]))/det;
    const b=(p0[1]*(t1[1]-t2[1])+p1[1]*(t2[1]-t0[1])+p2[1]*(t0[1]-t1[1]))/det;
    const cc=(p0[0]*(t2[0]-t1[0])+p1[0]*(t0[0]-t2[0])+p2[0]*(t1[0]-t0[0]))/det;
    const d=(p0[1]*(t2[0]-t1[0])+p1[1]*(t0[0]-t2[0])+p2[1]*(t1[0]-t0[0]))/det;
    const e=p0[0]-a*t0[0]-cc*t0[1],f=p0[1]-b*t0[0]-d*t0[1];
    cv.save();cv.beginPath();cv.moveTo(p0[0],p0[1]);cv.lineTo(p1[0],p1[1]);cv.lineTo(p2[0],p2[1]);cv.closePath();cv.clip();
    cv.transform(a,b,cc,d,e,f);cv.imageSmoothingEnabled=false;cv.drawImage(im,0,0);cv.restore();
   }
   function paint(){
    if(!c.isConnected){running.delete(c);return}
    if(visible()){
     if(!state.drag)state.angle+=.003;
     cv.clearRect(0,0,c.width,c.height);
     const polys=[];
     for(const el of m.elements){
      const [x,y,z]=el.from,[X,Y,Z]=el.to;
      let verts=[[x,y,z],[x,Y,z],[X,Y,z],[X,y,z],[x,y,Z],[x,Y,Z],[X,Y,Z],[X,y,Z]];
      if(el.rotation?.angle){let o=el.rotation.origin||[8,8,8],ax=el.rotation.axis,angle=el.rotation.angle*Math.PI/180;
       verts=verts.map(v=>rot(v.map((a,k)=>a-o[k]),ax,angle).map((a,k)=>a+o[k]));}
      const projected=verts.map(project);
      for(const [side,face] of Object.entries(el.faces||{})){
       const key=String(face.texture||'').replace(/^#/,'');
       const im=imgs[key];if(!im?.complete||!im.naturalWidth)continue;
       const indices=faces[side];if(!indices)continue;
       const ps=indices.map(j=>projected[j]);
       const uv=face.uv||[0,0,16,16],tw=im.naturalWidth/16,th=im.naturalHeight/16;
       const uvs=[[uv[0]*tw,uv[1]*th],[uv[2]*tw,uv[1]*th],[uv[2]*tw,uv[3]*th],[uv[0]*tw,uv[3]*th]];
       polys.push({ps,uvs,im,depth:ps.reduce((v,p)=>v+p[2],0)/4});
      }
     }
     polys.sort((a,b)=>b.depth-a.depth);
     for(const p of polys){tri(p.im,[p.ps[0],p.ps[1],p.ps[2]],[p.uvs[0],p.uvs[1],p.uvs[2]]);tri(p.im,[p.ps[0],p.ps[2],p.ps[3]],[p.uvs[0],p.uvs[2],p.uvs[3]])}
    }
    setTimeout(()=>requestAnimationFrame(paint),48);
   }
   running.add(c);requestAnimationFrame(paint);
  });
 }
 return {viewer,boot,model};
})();
