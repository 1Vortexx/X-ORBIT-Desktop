// Quiet screen furniture for the authored opening; all movement is owned by the camera director.
export class FilmPresentation {
  constructor(){
    this.root=document.createElement('div');this.root.className='lh2-film';this.root.hidden=true;
    const el=(name,parent=this.root)=>{const n=document.createElement('div');n.className=name;parent.append(n);return n;};
    el('lh2-letterbox lh2-letterbox-top');el('lh2-letterbox lh2-letterbox-bottom');
    // the title sits under the fade layer, so fading to black takes it with the picture
    this.title_=document.createElement('img');this.title_.className='lh2-film-logo';this.title_.alt='Long Haul';this.title_.decoding='async';
    this.title_.src=new URL('../../../assets/branding/long-haul-logo.png',import.meta.url).href;this.root.append(this.title_);
    this.fade=el('lh2-film-fade');
    this.byline_=el('lh2-byline');   // over the fade, so it reads on the black
    this.credit=el('lh2-credit');
    this.role=el('lh2-credit-role',this.credit);this.name=el('lh2-credit-name',this.credit);
    this.card=el('lh2-chapter-card');this.date=el('lh2-chapter-date',this.card);this.title=el('lh2-chapter-title',this.card);
    this.caption=el('lh2-film-caption');
    this.skip=document.createElement('button');this.skip.className='lh2-opening-skip';this.skip.textContent='Skip opening';this.root.append(this.skip);
    document.body.append(this.root);
  }
  // away 0..1: the camera panning off the logo, which slides out of frame to the right and up a little
  // value 0..1 brings it in: it drops onto the screen from slightly larger, landing as it becomes solid
  logo(value,away=0){const v=Math.max(0,Math.min(1,value)),drop=away>0?0:1-v;this.title_.style.opacity=String(v);this.title_.style.transform=`translate(calc(-50% + ${away*30}vw),calc(-50% - ${away*6 + drop*3}vh)) scale(${1+.16*drop-.06*away})`;}
  byline(text,opacity){if(this.byline_.textContent!==text)this.byline_.textContent=text;this.byline_.style.opacity=String(Math.max(0,Math.min(1,opacity)));}
  show(opening=false){this.logo(0);this.byline('',0);this.root.hidden=false;this.root.dataset.kind=opening?'opening':'scene';this.skip.hidden=!opening;this.credit.hidden=!opening;this.card.hidden=opening;this.caption.textContent='';}
  opacity(value){this.fade.style.opacity=String(Math.max(0,Math.min(1,value)));}
  creditText(role,name,opacity){if(this.role.textContent!==role)this.role.textContent=role;if(this.name.textContent!==name){this.name.textContent=name;this.name.dataset.list=String(name.length>26);}this.credit.style.opacity=String(opacity);}
  chapter(date,title,opacity){this.date.textContent=date;this.title.textContent=title;this.card.style.opacity=String(opacity);}
  hide(){this.root.hidden=true;}
  dispose(){this.root.remove();}
}
