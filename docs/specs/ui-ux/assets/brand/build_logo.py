#!/usr/bin/env python3
"""1694.io Ledger logo family (ticket #236). Outlines from Source Serif 4 Semibold (opsz 60) and Source Sans 3 Regular.
Writes exports to ./brand, board previews to ./preview and layout.json for the Penpot writer."""
import json,textwrap,html,subprocess,os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen
from PIL import Image
def inst(f,ax): return instantiateVariableFont(TTFont('fonts/'+f),ax)
FONTS={'serif':inst('SourceSerif4.ttf',{'wght':600,'opsz':60}),'sans':inst('SourceSans3.ttf',{'wght':400})}
class P(BasePen):
    def __init__(s,gs,k,dx): super().__init__(gs); s.k=k; s.dx=dx; s.c=[]
    def t(s,p): return [round(s.dx+p[0]*s.k,3),round(-p[1]*s.k,3)]
    def _moveTo(s,p): s.c.append(['M']+s.t(p))
    def _lineTo(s,p): s.c.append(['L']+s.t(p))
    def _curveToOne(s,a,b,c): s.c.append(['C']+s.t(a)+s.t(b)+s.t(c))
    def _closePath(s): s.c.append(['Z'])
def run(text,fk,size):
    f=FONTS[fk]; gs=f.getGlyphSet(); cm=f.getBestCmap(); k=size/f['head'].unitsPerEm; x=0; out=[]
    for ch in text:
        g=cm[ord(ch)]; p=P(gs,k,x); gs[g].draw(p); out+=p.c; x+=gs[g].width*k
    return out,x
def pts(c):
    for s in c:
        for i in range(1,len(s),2): yield s[i],s[i+1]
def bounds(c):
    xs,ys=zip(*pts(c)); return min(xs),min(ys),max(xs),max(ys)
def shift(c,dx,dy): return [[s[0]]+[round(v+(dx if i%2==0 else dy),3) for i,v in enumerate(s[1:])] for s in c]
def tight(c):
    x0,y0,x1,y1=bounds(c); return shift(c,-x0,-y0),x1-x0,y1-y0
def stack(h):
    a,_=run('16','serif',100); b,_=run('94','serif',100); a,aw,ah=tight(a); b,bw,bh=tight(b)
    gap=0.2*ah; k=h/(ah+gap+bh); W=max(aw,bw)
    sc=lambda c:[[s[0]]+[round(v*k,3) for v in s[1:]] for s in c]
    return shift(sc(a),(W-aw)/2*k,0)+shift(sc(b),(W-bw)/2*k,(ah+gap)*k),W*k,h
def FH(S): return -bounds(run('1694','serif',S)[0])[1]
def word(S):
    n,w=run('1694','serif',S); fh=FH(S); io,wi=run('.io','sans',S*0.6); tot=w+0.03*S+wi
    return [['p',shift(n,0,fh),'ink'],['p',shift(io,w+0.03*S,fh),'brand'],['r',0,fh+0.13*S,0.5*S,0.075*S,'accent',0],['r',0.5*S,fh+0.15*S,tot-0.5*S,0.035*S,'ink',0]],tot,fh+0.205*S
def stacked(S):
    a,aw=run('16','serif',S); b,bw=run('94','serif',S); fh=FH(S); io,wi=run('.io','sans',S*0.6); b2=2*fh+0.18*S; tot=max(aw,bw+0.03*S+wi)
    return [['p',shift(a,0,fh),'ink'],['p',shift(b,0,b2),'ink'],['p',shift(io,bw+0.03*S,b2),'brand'],['r',0,b2+0.13*S,0.5*S,0.075*S,'accent',0],['r',0.5*S,b2+0.15*S,tot-0.5*S,0.035*S,'ink',0]],tot,b2+0.205*S
def symbol(D):
    s,w,h=stack(0.50*D); gap=0.085*D; bar=0.05*D; x=(D-w)/2; y=(D-(h+gap+bar))/2
    return [['r',0,0,D,D,'tile',0.18*D],['p',shift(s,x,y),'ontile'],['r',x,y+h+gap,w*0.45,bar,'taccent',0],['r',x+w*0.45,y+h+gap+bar*0.27,w*0.55,bar*0.46,'ontile',0]],D,D
def symbol_small(D):
    s,w,h=stack(0.70*D); return [['r',0,0,D,D,'tile',0.18*D],['p',shift(s,(D-w)/2,(D-h)/2),'ontile']],D,D
PAL={'light':dict(ink='#0B1430',brand='#0033AD',accent='#FF640A',bg='#FFFFFF',tile='#0033AD',ontile='#FFFFFF',taccent='#FF640A'),
     'dark':dict(ink='#EEF1F8',brand='#8FB0FF',accent='#FF8A47',bg='#0B1020',tile='#0033AD',ontile='#FFFFFF',taccent='#FF640A'),
     'black':dict(ink='#000000',brand='#000000',accent='#000000',bg='#FFFFFF',tile='#000000',ontile='#FFFFFF',taccent='#FFFFFF'),
     'white':dict(ink='#FFFFFF',brand='#FFFFFF',accent='#FFFFFF',bg='#000000',tile='#FFFFFF',ontile='#000000',taccent='#000000')}
def d(c): return ' '.join(s[0]+' '.join(str(v) for v in s[1:]) for s in c)
def rr(x,y,w,h,r):
    if r<=0: return [['M',x,y],['L',x+w,y],['L',x+w,y+h],['L',x,y+h],['Z']]
    k=0.5523*r
    return [['M',x+r,y],['L',x+w-r,y],['C',x+w-r+k,y,x+w,y+r-k,x+w,y+r],['L',x+w,y+h-r],['C',x+w,y+h-r+k,x+w-r+k,y+h,x+w-r,y+h],['L',x+r,y+h],['C',x+r-k,y+h,x,y+h-r+k,x,y+h-r],['L',x,y+r],['C',x,y+r-k,x+r-k,y,x+r,y],['Z']]
def svg(mark,pal,knock=None):
    m,w,h=mark; o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {round(w,3)} {round(h,3)}" width="{round(w,3)}" height="{round(h,3)}" role="img" aria-label="1694.io"><title>1694.io</title>']
    if knock:  # one-colour symbol: numerals and rule cut out of the tile
        c=[]
        for p in m: c+= p[1] if p[0]=='p' else rr(*[round(v,3) for v in p[1:5]],round(p[6],3))
        o.append(f'<path fill-rule="evenodd" fill="{knock}" d="{d(c)}"/>')
    else:
        for p in m:
            if p[0]=='p': o.append(f'<path fill="{PAL[pal][p[2]]}" d="{d(p[1])}"/>')
            else: o.append(f'<rect x="{round(p[1],3)}" y="{round(p[2],3)}" width="{round(p[3],3)}" height="{round(p[4],3)}"'+(f' rx="{round(p[6],3)}"' if p[6] else '')+f' fill="{PAL[pal][p[5]]}"/>')
    return '\n'.join(o+['</svg>'])
os.makedirs('brand',exist_ok=True); os.makedirs('preview',exist_ok=True)
def out(name,s,widths=()):
    open(f'brand/{name}.svg','w').write(s)
    for w in widths: subprocess.run(['rsvg-convert','-w',str(w),f'brand/{name}.svg','-o',f'brand/{name}-{w}.png'],check=True)
for pal in ('light','dark','black','white'):
    out(f'1694-wordmark-{pal}',svg(word(200),pal),(800,400)); out(f'1694-stacked-{pal}',svg(stacked(200),pal),(600,)) 
out('1694-symbol',svg(symbol(512),'light'),(512,192,180,96,48)); out('1694-symbol-small',svg(symbol_small(512),'light'),(32,24,16))
out('1694-symbol-black',svg(symbol(512),None,'#000000'),(512,)); out('1694-symbol-white',svg(symbol(512),None,'#FFFFFF'),(512,))
out('1694-symbol-small-black',svg(symbol_small(512),None,'#000000')); out('1694-symbol-small-white',svg(symbol_small(512),None,'#FFFFFF'))
Image.open('brand/1694-symbol-small-32.png').save('brand/favicon.ico',sizes=[(16,16),(24,24),(32,32)],append_images=[Image.open('brand/1694-symbol-small-24.png'),Image.open('brand/1694-symbol-small-16.png')])
# ---------------- Penpot boards
boards=[]; G='#C7CDD1'; INK='#0B1430'; MUTE='#5B667A'
def scalex(m,k): return [(['p',[[s[0]]+[round(v*k,3) if i%2==0 else v for i,v in enumerate(s[1:])] for s in p[1]],p[2]] if p[0]=='p' else ['r',p[1]*k,p[2],p[3]*k,p[4],p[5],p[6]]) for p in m]
def place(it,m,x,y,pal,name,over=None):
    for p in m:
        col=(over or PAL[pal])[p[2] if p[0]=='p' else p[5]]
        if p[0]=='p': it.append(dict(k='p',c=shift(p[1],x,y),fill=col,name=name))
        else: it.append(dict(k='r',x=round(x+p[1],3),y=round(y+p[2],3),w=round(p[3],3),h=round(p[4],3),fill=col,r=round(p[6],3),name=name))
def panel(it,x,y,w,h,fill,stroke=None,r=8,name='panel'): it.append(dict(k='r',x=x,y=y,w=w,h=h,fill=fill,r=r,stroke=stroke,name=name))
def centre(it,mark,px,py,pw,ph,pal,name,bg=None,stroke=None):
    panel(it,px,py,pw,ph,bg or PAL[pal]['bg'],stroke); m,w,h=mark; assert w<=pw-12 and h<=ph-12,(name,w,h,pw,ph); place(it,m,px+(pw-w)/2,py+(ph-h)/2,pal,name); return px+(pw-w)/2,py+(ph-h)/2,w,h
def text(it,x,y,w,s,size=12,weight='400',color=MUTE,font='sans'):
    lines=[]
    for para in s.split('\n'): lines+=textwrap.wrap(para,max(4,int(w/(size*0.52)))) or ['']
    hh=round(len(lines)*size*1.35)+2; it.append(dict(k='t',x=x,y=y,w=w,h=hh,s=s,lines=lines,size=size,weight=weight,color=color,font=font,name=s[:40])); return hh
def pill(it,x,y,label,pal):
    w=len(label)*7+22; prev=label=='Preview'
    fill={'light':'#FFEFE6','dark':'#4C1E03'}[pal] if prev else PAL[pal]['bg']
    it.append(dict(k='r',x=x,y=y,w=w,h=22,fill=fill,r=11,stroke=PAL[pal]['accent'] if prev else PAL[pal]['ink'],name='network label / '+label)); text(it,x+11,y+3,w-14,label,12,'600',PAL[pal]['ink']); return w
def board(name,h,sub):
    it=[]; boards.append(dict(name=name,x=0,y=sum(b['h']+60 for b in boards),w=1200,h=h,fill='#F3F5FF',items=it))
    text(it,40,32,1120,name,26,'600',INK,'serif'); text(it,40,74,1120,sub,14,'400',INK); return it
# 1 family
it=board('Ledger — logo family',800,'The wordmark is the primary logo. The stacked form is for narrow or square spaces. The symbol is for favicons, app icons and avatars; its colours do not change between themes.')
text(it,40,134,300,'Wordmark, light'); centre(it,word(96),40,154,540,190,'light','wordmark light',stroke=G)
text(it,620,134,300,'Wordmark, dark'); centre(it,word(96),620,154,540,190,'dark','wordmark dark')
text(it,40,364,250,'Stacked, light'); centre(it,stacked(66),40,384,250,230,'light','stacked light',stroke=G)
text(it,310,364,250,'Stacked, dark'); centre(it,stacked(66),310,384,250,230,'dark','stacked dark')
text(it,580,364,180,'Symbol, 48 px and up'); centre(it,symbol(120),580,384,180,230,'light','symbol',stroke=G)
text(it,780,364,180,'Small symbol, under 48 px'); centre(it,symbol_small(120),780,384,180,230,'light','symbol small',stroke=G)
text(it,980,364,180,'Favicon at 32, 24, 16 px'); panel(it,980,384,180,230,'#FFFFFF',G)
for D,x in ((32,1004),(24,1056),(16,1100)): place(it,symbol_small(D)[0],x,499-D/2,'light','favicon %d'%D)
text(it,40,634,300,'One colour, black'); centre(it,word(52),40,654,540,106,'black','wordmark black',stroke=G)
text(it,620,634,300,'One colour, white'); centre(it,word(52),620,654,540,106,'white','wordmark white')
# 2 clear space, min size
MINS=28; mw,mwid,mh=word(MINS); sm,sw,sh=stacked(MINS)
it=board('Ledger — clear space and minimum size',520,'Keep the tinted zone empty. Below the minimum sizes the thin rule drops under one pixel and the numerals close up.')
text(it,40,134,400,'Clear space: x is half the height of the numerals, on every side'); panel(it,40,154,640,300,'#FFFFFF',G)
m,w,h=word(96); cs=0.5*FH(96); x0=40+(640-w)/2; y0=154+(300-h)/2; panel(it,round(x0-cs,2),round(y0-cs,2),round(w+2*cs,2),round(h+2*cs,2),'#FFEFE6',r=0,name='clear space'); place(it,m,x0,y0,'light','wordmark')
text(it,720,134,400,'Minimum sizes, shown at actual size'); panel(it,720,154,440,300,'#FFFFFF',G)
place(it,mw,744,184,'light','wordmark min'); text(it,900,188,250,'Wordmark: %d px tall'%round(mh))
place(it,sm,744,236,'light','stacked min'); text(it,900,250,250,'Stacked: %d px tall'%round(sh))
place(it,symbol(48)[0],744,316,'light','symbol min'); text(it,900,332,250,'Symbol: 48 px')
place(it,symbol_small(16)[0],744,392,'light','small symbol min'); text(it,900,392,250,'Small symbol: 16 px')
# 3 colour, type, network
it=board('Ledger — colour, type and network label',600,'Each colour has a light and a dark value. The network is a text label beside the logo and never part of it.')
for n,(nm,l,dk) in enumerate((('Ink','#0B1430','#EEF1F8'),('Brand blue','#0033AD','#8FB0FF'),('Accent orange','#FF640A','#FF8A47'),('Surface','#FFFFFF','#0B1020'))):
    x=40+n*285; text(it,x,134,265,nm,13,'600',INK); panel(it,x,158,128,80,l,G,name='swatch light / '+nm); panel(it,x+137,158,128,80,dk,G,name='swatch dark / '+nm); text(it,x,244,128,'Light '+l); text(it,x+137,244,128,'Dark '+dk)
text(it,40,292,300,'Typefaces',13,'600',INK)
text(it,40,318,1120,'Source Serif 4 Semibold: headings and the numerals in the logo',26,'600',INK,'serif')
text(it,40,366,1120,'Source Sans 3: interface text, navigation, buttons and labels',19,'400',INK)
text(it,40,400,1120,'Source Code Pro: drep1y2x7w0qk…k9qf4   12,345,678.90   Epoch 594',17,'400',INK,'mono')
text(it,40,434,1120,'Japanese and Simplified Chinese: Noto Serif JP / SC for headings, Noto Sans JP / SC for interface text. All faces are SIL Open Font License 1.1.',13)
text(it,40,482,300,'Network label',13,'600',INK)
panel(it,40,508,540,60,'#FFFFFF',G); m,w,h=word(26); place(it,m,60,508+(60-h)/2,'light','wordmark'); a=pill(it,60+w+16,527,'Mainnet','light'); pill(it,60+w+16+a+60,527,'Preview','light')
panel(it,620,508,540,60,'#0B1020'); place(it,m,640,508+(60-h)/2,'dark','wordmark'); a=pill(it,640+w+16,527,'Mainnet','dark'); pill(it,640+w+16+a+60,527,'Preview','dark')
# 4 misuse
it=board('Ledger — misuse',400,'Do not do these.')
m,w,h=word(48)
cases=[('Stretch or squash it',scalex(m,1.4),w*1.4,'light',None,'#FFFFFF'),('Recolour the numerals',m,w,'light',dict(PAL['light'],ink='#FF640A',brand='#1C94B2'),'#FFFFFF'),('Remove the rule',[p for p in m if p[0]=='p'],w,'light',None,'#FFFFFF'),('Place it where it cannot be read',m,w,'light',None,'#1B2A52')]
for n,(cap,mm,ww,pal,over,bg) in enumerate(cases):
    x=40+n*285; panel(it,x,134,265,170,bg,G); place(it,mm,x+(265-ww)/2,134+(170-h)/2,pal,'misuse',over); panel(it,x,134,265,8,'#D00000',r=0,name='do not'); text(it,x,314,265,'Don’t: '+cap.lower(),13,'600','#B00000')
# 5 in use
it=board('Ledger — in use',800,'Header on desktop and mobile, mobile menu, footer, browser tab and app icon. Navigation follows the approved sitemap.')
for pal,y,net in (('light',134,'Mainnet'),('dark',226,'Preview')):
    c=PAL[pal]; panel(it,40,y,1120,72,c['bg'],G if pal=='light' else None,name='header / '+pal); m,w,h=word(26); place(it,m,64,y+(72-h)/2,pal,'wordmark'); pill(it,64+w+16,y+25,net,pal)
    text(it,560,y+26,300,'DReps        Proposals        Learn',14,'600',c['ink']); text(it,880,y+27,60,'EN',13,'600',c['ink']); panel(it,1000,y+18,136,36,c['brand'],r=18,name='button'); text(it,1021,y+27,110,'Connect wallet',13,'600',c['bg'])
text(it,40,322,375,'Mobile menu, 375 px'); panel(it,40,342,375,410,'#FFFFFF',G,name='mobile menu'); m,w,h=word(22); place(it,m,60,342+(60-h)/2,'light','wordmark'); pill(it,60+w+12,361,'Mainnet','light')
for k in range(3): panel(it,371,362+k*7,22,2.5,INK,r=0,name='menu icon')
panel(it,40,402,375,1,G,r=0,name='rule')
for k,l in enumerate(('DReps','Proposals','Learn','Language: English','Theme: Light')): text(it,60,424+k*52,300,l,17,'600' if k<3 else '400',INK); panel(it,60,460+k*52,335,1,'#E6E9F0',r=0,name='rule')
text(it,455,322,300,'Footer'); panel(it,455,342,705,230,'#0B1020',name='footer'); m,w,h=stacked(44); place(it,m,487,342+(230-h)/2,'dark','stacked')
text(it,640,384,480,'DReps      Proposals      Learn',14,'600','#EEF1F8'); text(it,640,424,480,'GovTool ↗    Cardano ↗    Intersect ↗    Catalyst Explorer ↗',13,'400','#9AA6BD'); text(it,640,506,480,'A Lido Nation community project',12,'400','#9AA6BD')
text(it,455,592,300,'Browser tab and app icon'); panel(it,455,612,705,140,'#DDE2EC',name='browser'); panel(it,479,636,250,40,'#FFFFFF',r=8,name='tab'); place(it,symbol_small(16)[0],493,648,'light','favicon 16'); text(it,519,646,200,'DReps · 1694.io',13,'400',INK)
place(it,symbol(96)[0],1032,634,'light','app icon 96')
json.dump(dict(page='04 Logo family (Ledger)',boards=boards),open('layout.json','w'))
FF={'sans':'Source Sans 3, DejaVu Sans, sans-serif','serif':'Source Serif 4, DejaVu Serif, serif','mono':'Source Code Pro, DejaVu Sans Mono, monospace'}
bad=0
for n,b in enumerate(boards):
    o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {b["w"]} {b["h"]}" width="{b["w"]}" height="{b["h"]}"><rect width="{b["w"]}" height="{b["h"]}" fill="{b["fill"]}"/>']
    for i in b['items']:
        if i['k']=='r': o.append(f'<rect x="{i["x"]}" y="{i["y"]}" width="{i["w"]}" height="{i["h"]}" rx="{i["r"]}" fill="{i["fill"]}"'+(f' stroke="{i["stroke"]}"' if i.get('stroke') else '')+'/>')
        elif i['k']=='p': o.append(f'<path d="{d(i["c"])}" fill="{i["fill"]}"/>')
        else:
            for k,l in enumerate(i['lines']): o.append(f'<text x="{i["x"]}" y="{i["y"]+i["size"]*(1.35*k+1)}" font-family="{FF[i["font"]]}" font-size="{i["size"]}" font-weight="{i["weight"]}" fill="{i["color"]}">{html.escape(l)}</text>')
        if i['k']!='p' and (i['x']<0 or i['x']+i['w']>b['w'] or i['y']<0 or i['y']+i['h']>b['h']): bad+=1; print('OUT',b['name'],i['name'])
        if i['k']=='p':
            x0,y0,x1,y1=bounds(i['c'])
            if x0<0 or y0<0 or x1>b['w'] or y1>b['h']: bad+=1; print('PATH OUT',b['name'],i['name'])
    open('preview/b.svg','w').write('\n'.join(o+['</svg>'])); subprocess.run(['rsvg-convert','preview/b.svg','-o',f'preview/ledger-{n+1}-'+b['name'].split('— ')[1].replace(',','').replace(' ','-')+'.png'],check=True)
os.remove('preview/b.svg')
def lum(h): 
    v=[int(h[i:i+2],16)/255 for i in (1,3,5)]; v=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in v]; return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]
def cr(a,b): a,b=sorted((lum(a),lum(b)),reverse=True); return round((a+0.05)/(b+0.05),2)
print('layout issues',bad,'| boards',[(b['name'],b['y'],len(b['items'])) for b in boards])
print('min wordmark S=%d: %.1f x %.1f px, thin rule %.2f px | stacked %.1f x %.1f'%(MINS,mwid,mh,0.035*MINS,sw,sh))
print('aspect wordmark w/h %.3f stacked %.3f | numeral height/S %.3f'%(word(100)[1]/word(100)[2],stacked(100)[1]/stacked(100)[2],FH(100)/100))
for a,b,n in (('#0B1430','#FFFFFF','ink on light'),('#0033AD','#FFFFFF','brand on light'),('#FF640A','#FFFFFF','accent on light'),('#EEF1F8','#0B1020','ink on dark'),('#8FB0FF','#0B1020','brand on dark'),('#FF8A47','#0B1020','accent on dark'),('#FFFFFF','#0033AD','numerals on tile'),('#0033AD','#0B1020','tile on dark surface'),('#FF640A','#0033AD','rule on tile')): print(n,cr(a,b))
