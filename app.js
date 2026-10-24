
const C=window.CATEGORIES,R=window.RECIPES,byRecipe=new Map(R.map(r=>[r.id,r])),pages=C.flatMap(c=>c.items.map(i=>({...i,categoryName:c.name}))),byPage=new Map(pages.map(p=>[p.id,p]));
const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[ch]));
const modelPic=r=>r?(r.preview||r.render||r.image||''):''; 
const art=(id,cls='')=>{
 const r=byRecipe.get(id),key=RECIPE_MODELS?.[id]||r?.model;
 if(key&&MODELS?.[key])return `<span class="model-wrap ${cls}">${ModelViewer.viewer(key)}</span>`;
 const url=r?.model_sprite||r?.preview||r?.render||r?.image;
 return url?`<img class="${cls}" src="${escape(url)}" alt="${escape(r.name)}" loading="lazy" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span class=\'noart\'>Aperçu indisponible</span>')">`:`<span class="noart" title="Modèle absent des fichiers fournis">Aperçu non fourni</span>`;
};
const catName=id=>C.find(c=>c.id===id)?.name||id;
const clean=id=>id.replace(/^minecraft:/,'').replaceAll('_',' ').replace(/\b\w/g,ch=>ch.toUpperCase());
const itemName=id=>{
 if(!id)return 'Vide';
 if(id==='minecraft:echo_shard')return 'Éclat d’écho / cristal kyber vierge (selon l’objet)';
 if(id==='minecraft:carrot_on_a_stick')return 'Carotte sur bâton (objet de base)';
 return byRecipe.get(id)?.name||clean(id);
};
const VANILLA_BLOCKS=new Set(['glass','bell','amethyst_block','copper_block','iron_block','gold_block','redstone_block','piston','obsidian','crafting_table','netherite_block','cobblestone','stone','oak_planks','oak_log','anvil','target','jigsaw','dispenser','dropper','tnt','furnace','smithing_table','beacon','barrel','slime_block','honey_block','note_block','redstone_lamp']);
// Un identifiant Minecraft peut être le support technique d'un objet custom.
// On choisit le modèle à partir de la RECETTE, jamais de l'identifiant vanilla seul.
const CUSTOM_INGREDIENTS={
 'boomerang:portee_1':{
   'minecraft:netherite_upgrade_smithing_template':['boomerang:duplicate_portee_template','Trim Portée'],
   'minecraft:jigsaw':['boomerang:boomerang','Boomerang personnalisé']
 },
 'boomerang:shadow_1':{
   'minecraft:netherite_upgrade_smithing_template':['boomerang:shadow_template_duplication','Trim Shadow'],
   'minecraft:jigsaw':['boomerang:boomerang','Boomerang personnalisé']
 },
 'maillet:onde':{
   'minecraft:iron_nugget':['maillet:duplicate_onde','Trim Onde'],
   'minecraft:warped_fungus_on_a_stick':['maillet:maillet','Maillet de Harley Quinn']
 },
 'maillet:rebond':{
   'minecraft:iron_nugget':['maillet:duplicate_rebond','Trim Rebond'],
   'minecraft:warped_fungus_on_a_stick':['maillet:maillet','Maillet de Harley Quinn']
 },
 'maillet:seisme':{
   'minecraft:iron_nugget':['maillet:duplicate_seisme','Trim Séisme'],
   'minecraft:warped_fungus_on_a_stick':['maillet:maillet','Maillet de Harley Quinn']
 },
 'maillet:propulsion':{
   'minecraft:iron_nugget':['maillet:duplicate_propulsion','Trim Propulsion'],
   'minecraft:warped_fungus_on_a_stick':['maillet:maillet','Maillet de Harley Quinn']
 },
 'boomerang:duplicate_portee_template':{
   'minecraft:netherite_upgrade_smithing_template':['boomerang:duplicate_portee_template','Trim Portée']
 },
 'boomerang:shadow_template_duplication':{
   'minecraft:netherite_upgrade_smithing_template':['boomerang:shadow_template_duplication','Trim Shadow']
 },
 ...Object.fromEntries(['onde','rebond','seisme','propulsion'].map(x=>[
  'maillet:duplicate_'+x,{'minecraft:iron_nugget':['maillet:duplicate_'+x,'Trim '+x.charAt(0).toUpperCase()+x.slice(1)]}
 ]))
};
const customIngredient=(id,owner)=>CUSTOM_INGREDIENTS[owner?.id]?.[id]||null;
const ingredientImage=(id,owner)=>{
 const custom=customIngredient(id,owner);
 if(custom)return art(custom[0]);
 let special=null;
 if(id==='minecraft:echo_shard'&&owner?.ns==='ezra')special=byRecipe.get('ezra:kyber_vierge');
 if(id==='minecraft:carrot_on_a_stick'&&owner?.id==='odm:odm_gear')special=byRecipe.get('odm:canister');
 if(id==='minecraft:carrot_on_a_stick'&&owner?.ns==='ezra')special=byRecipe.get('ezra:sabre_vide');
 if(special)return art(special.id);
 const known=byRecipe.get(id);
 if(known)return art(known.id);
 if(id?.startsWith('minecraft:')){
   const name=id.slice(10),folder=VANILLA_BLOCKS.has(name)?'block':'item';
   const local='vanilla-icons/'+encodeURIComponent(name)+'.png';
   const official='https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/'+folder+'/'+encodeURIComponent(name)+'.png';
   return `<img class="ingredient-icon" src="${official}" data-fallback="${local}" onerror="this.onerror=null;this.src=this.dataset.fallback" alt="${escape(clean(id))}" loading="lazy">`;
 }
 return '<span class="noart">◇</span>';
};
const ingredientName=(id,owner)=>{
 const custom=customIngredient(id,owner);
 if(custom)return custom[1];
 if(id==='minecraft:echo_shard'&&owner?.ns==='ezra')return 'Cristal kyber vierge (objet personnalisé)';
 if(id==='minecraft:carrot_on_a_stick'&&owner?.id==='odm:odm_gear')return 'Bonbonne ODM';
 if(id==='minecraft:carrot_on_a_stick'&&owner?.ns==='ezra')return 'Sabre-blaster (base)';
 return itemName(id);
};
const slot=(id,r)=>`<div class="slot ${id?'':'empty'}">${id?ingredientImage(id,r):''}<small>${escape(id?ingredientName(id,r):'Vide')}</small></div>`;
const recipeBlock=r=>{
 if(!r)return '<div class="note">Aucune recette confirmée pour cet objet.</div>';
 const kind=r.type||'';
 const smith=kind.includes('smithing');
 const shapeless=kind.includes('shapeless');
 let ingredients=[];
 if(smith){ingredients=(r.smithing||[r.template,r.base,r.addition]).filter(Boolean);if(!ingredients.length)ingredients=r.cells?.filter(Boolean)||[];}
 else if(shapeless)ingredients=r.cells?.filter(Boolean)||Object.values(r.ingredients||{});
 else ingredients=(r.cells||Array(9).fill(null)).slice(0,9);
 const label=smith?'Table de forge':shapeless?'Fabrication sans ordre':'Établi — grille 3 × 3';
 return `<div class="crafthead"><span class="overline">${label}</span><small>Résultat ×${r.count||1}</small></div><div class="craftrow"><div class="craftgrid ${shapeless||smith?'shapeless':''}">${ingredients.map(x=>slot(x,r)).join('')}</div><div class="arrow">➜</div><div class="result">${art(r.id)}<strong>${escape(r.name)}</strong></div></div>${smith?'<p class="hint">Ordre de gauche à droite : modèle, objet de base, ajout.</p>':shapeless?'<p class="hint">Les ingrédients peuvent être placés dans n’importe quel ordre.</p>':'<p class="hint">Disposition des cases conforme à la recette enregistrée.</p>'}`;
};
function guideFor(p){
 const sections=window.WIKI_GUIDES?.[p.id];
 if(sections?.length)return sections.map(([heading,body])=>({heading,body}));
 return [{heading:"Documentation",body:"Le fonctionnement exact n’a pas encore été confirmé dans les fichiers disponibles."}];
}

function gallery(){
 $('#app').innerHTML=`<a class="back" href="#/">← Retour aux catégories</a><div class="hero"><div class="overline">RESSOURCES / MODÈLES OFFICIELS</div><h1>Bibliothèque des modèles</h1><p>Les ${MODEL_LIBRARY.length} définitions de modèles du resource pack. Les modèles avec géométrie sont affichés en 3D, les modèles plats utilisent leur texture officielle.</p></div><div class="grid">${MODEL_LIBRARY.map(id=>{const art=MODELS[id]?ModelViewer.viewer(id):MODEL_SPRITES[id]?`<img src="${MODEL_SPRITES[id]}" alt="${escape(id)}">`:'<span class="noart">Modèle sans géométrie ni texture utilisable</span>';return `<div class="card"><div class="visual">${art}</div><div class="cardbody"><h3>${escape(id.split(':')[1].replaceAll('_',' '))}</h3><p>${escape(id.split(':')[0])} • ${MODELS[id]?'Modèle 3D':MODEL_SPRITES[id]?'Modèle plat':'Aperçu non disponible'}</p></div></div>`}).join('')}</div>`;
}
function navbar(){ $('#nav').innerHTML='<a class="nav-item" href="#/modeles">◈ &nbsp; Tous les modèles</a>'+C.map(c=>`<a class="nav-item" href="#/categorie/${c.id}">${escape(c.icon)} &nbsp; ${escape(c.name)}</a>`).join(''); }
function card(p){return `<a class="card" href="#/item/${p.id}"><div class="visual"><span class="tag">${escape(p.categoryName)}</span>${art(p.hero)}</div><div class="cardbody"><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><div class="cardlink"><span>Explorer le wiki</span><span>↗</span></div></div></a>`;}
function categoryCard(c){
 const count=c.items.length;
 const examples=c.items.slice(0,3);
 return `<a class="category-card" href="#/categorie/${c.id}"><div class="category-top"><span class="category-symbol">${escape(c.icon)}</span><span class="category-count">${count} fiches</span></div><h2>${escape(c.name)}</h2><p>${escape(examples.map(i=>i.name).join(' • '))}${count>3?'…':''}</p><div class="category-bottom">Explorer la catégorie <span>↗</span></div></a>`;
}
function home(category='all'){
 const selected=C.find(c=>c.id===category);
 if(!selected){
  $('#app').innerHTML=`<div class="hero"><div class="overline">SURVIE HARDCORE / BASE DE CONNAISSANCES</div><h1>Explore l'univers<br>Survie Hardcore.</h1><p>Choisis une catégorie pour découvrir ses objets, leurs crafts, leurs variantes et leur fonctionnement.</p></div><div class="section-label"><div class="overline">LES UNIVERS</div><h2>Choisis ton univers — 5 catégories</h2></div><div class="category-grid">${C.map(categoryCard).join('')}</div><div class="home-tip">Chaque catégorie mène à ses fiches d'objets. Les crafts et les améliorations sont regroupés dans chaque fiche.</div>`;
  return;
 }
 const list=selected.items.map(i=>({...i,categoryName:selected.name}));
 $('#app').innerHTML=`<a class="back" href="#/">← Retour aux catégories</a><div class="hero category-hero"><div class="overline">SURVIE HARDCORE / ${escape(selected.name.toUpperCase())}</div><h1>${escape(selected.name)}</h1><p>Explore les ${list.length} fiches de cette catégorie, avec leurs crafts, variantes et guides.</p></div><input id="search" class="search" placeholder="⌕  Rechercher dans ${escape(selected.name)}…" aria-label="Rechercher"><div class="grid" id="cards">${list.map(card).join('')}</div><p id="empty" hidden>Aucun objet trouvé.</p>`;
 $('#search').addEventListener('input',e=>{const t=e.target.value.toLocaleLowerCase('fr');const filtered=list.filter(p=>(p.name+' '+p.description+' '+p.categoryName).toLocaleLowerCase('fr').includes(t));$('#cards').innerHTML=filtered.map(card).join('');ModelViewer.boot($('#cards'));$('#empty').hidden=filtered.length>0;});
}

function rhittaGuide(){return `<section class="panel rhitta-panel"><div class="overline">RHITTA / ÉPREUVE SOLAIRE</div><h2>Comment obtenir Rhitta ?</h2><div class="rhitta-timeline"><div><strong>01 · Le Passe du Soleil</strong><p>Fabrique le passe puis jette-le au sol. Un rituel lumineux commence et la hache apparaît après environ 5 secondes.</p></div><div><strong>02 · L’épreuve</strong><p>Frappe la hache apparue : chaque coup validé donne +2 % de force. La jauge perd 6 % chaque seconde. Atteins 100 % avant la fin des 15 secondes.</p></div><div><strong>03 · Victoire ou échec</strong><p>À 100 %, tu reçois Rhitta, la Hache sacrée. Si tu échoues, attends 20 minutes et fabrique un nouveau passe.</p></div></div><p class="rhitta-warning">Attention : le texte affiché en jeu annonce 20 secondes, mais le compteur du datapack est réglé sur 15 secondes.</p><div class="overline">RHITTA / POUVOIRS</div><h2>Utiliser la Hache sacrée</h2><div class="rhitta-powers"><article><h3>☀ Impact solaire</h3><p><b>Action :</b> clic droit, sans s’accroupir.</p><p>Inflige 8 points de dégâts magiques à certains monstres proches, dans un rayon de 5 blocs. Accorde Régénération IV pendant 2 secondes et Force II pendant 5 secondes.</p><span>Recharge : 20 secondes</span></article><article><h3>✦ Soleil cruel</h3><p><b>Action :</b> s’accroupir + clic droit.</p><p>Projette une boule solaire dans la direction du regard. Elle avance d’environ 0,65 bloc par tick, pendant 5 secondes maximum, puis explose à l’impact. L’explosion inflige 12 points de dégâts magiques dans un rayon de 5 blocs aux cibles concernées, sauf au lanceur.</p><span>Recharge : 45 secondes</span></article></div><p class="hint">Informations vérifiées dans les fonctions du datapack Rhitta. Les dégâts et effets sont décrits tels qu’ils sont codés, sans supposer d’autres capacités.</p></section>`;}
function page(id){
 const p=byPage.get(id);if(!p)return home();
 const variants=p.recipes.map(x=>byRecipe.get(x)).filter(Boolean);
 const hero=byRecipe.get(p.hero);
 $('#app').innerHTML=`<a class="back" href="#/categorie/${p.category}">← ${escape(catName(p.category))}</a><div class="detailhero"><div><div class="overline">${escape(catName(p.category))} / FICHE OBJET</div><h1>${escape(p.name)}</h1><p>${escape(p.description)}</p><span class="chip">${variants.length} recette${variants.length>1?'s':''} associée${variants.length>1?'s':''}</span></div><div class="artbox">${art(p.hero)}</div></div><section class="panel"><div class="overline">01 / GUIDE</div><h2>Comment ça fonctionne ?</h2><div class="guide">${guideFor(p).map((t,n)=>`<div class="step"><strong>${String(n+1).padStart(2,'0')} · ${escape(t.heading)}</strong><p>${escape(t.body)}</p></div>`).join('')}</div></section>${p.id==='passe'?rhittaGuide():''}<section class="panel"><div class="overline">02 / FABRICATION</div><h2>Crafts et variantes</h2><p>Sélectionne une recette pour afficher les ingrédients et le résultat. Toutes les recettes proviennent du pack fourni.</p><div class="variantlist">${variants.map((r,n)=>`<button class="variant ${n===0?'active':''}" data-recipe="${escape(r.id)}">${art(r.id)}<span>${escape(variantName(r,p))}</span></button>`).join('')}</div><div id="recipe">${recipeBlock(variants[0])}</div></section><section class="panel"><div class="overline">03 / DÉPENDANCES</div><h2>Arbre de fabrication</h2><p>Les éléments associés sont regroupés dans cette fiche. Les sous-recettes inconnues ne sont pas inventées.</p><div id="tree" class="tree"></div></section>`;
 document.querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-recipe]').forEach(x=>x.classList.toggle('active',x===b));const r=byRecipe.get(b.dataset.recipe);$('#recipe').innerHTML=recipeBlock(r);ModelViewer.boot($('#recipe'));drawTree(r,p);});
 drawTree(variants[0],p);
}
function variantName(r,p){
 if(p.id==='ezra')return r.key.startsWith('installer_')?'Installation '+r.key.slice(10).replaceAll('_',' '):r.key.startsWith('sabre_direct_')?'Fabrication directe '+r.key.slice(13).replaceAll('_',' '):'Sabre sans cristal';
 if(p.id==='kyber')return r.key==='kyber_vierge'?'Cristal vierge':r.name;
 if(p.id==='maillet')return r.key==='maillet'?'Maillet de base':r.key[0].toUpperCase()+r.key.slice(1);
 if(p.id==='boomerang')return r.key==='boomerang'?'Boomerang de base':r.name+' — '+r.key.replaceAll('_',' ');
 return r.name;
}
function drawTree(r,p){
 if(!r){$('#tree').textContent='Pas de recette disponible.';return;}
 const ids=[...new Set((r.cells||[]).filter(Boolean))];
 const children=ids.map(id=>{
  const target=pages.find(q=>q.hero===id||q.recipes.includes(id));
  return target?`<a href="#/item/${target.id}">${escape(target.name)} ↗</a>`:`<a href="javascript:void(0)" style="cursor:default">${escape(ingredientName(id,r))}</a>`;
 });
 $('#tree').innerHTML=`<span>${escape(r.name)}</span><span>←</span>${children.join('')||'<span>Aucun ingrédient lié documenté.</span>'}`;
}
function route(){const hash=decodeURIComponent(location.hash||'#/');const m=hash.match(/^#\/item\/(.+)$/),c=hash.match(/^#\/categorie\/(.+)$/);if(m)page(m[1]);else if(c)home(c[1]);else if(hash==='#/modeles')gallery();else home();document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===hash));ModelViewer.boot();window.scrollTo({top:0,behavior:'instant'});}
navbar();window.addEventListener('hashchange',route);route();
