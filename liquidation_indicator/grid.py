import sys; sys.argv=sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/",1)[0]); import liq
B=liq.B
def sim(ratio,rng,tpa,sla,fee):
    longs,shorts={},{};atr=None;tr=[];opn=None
    for i in range(1,len(B)):
        t,o,h,l,c,oi=B[i];doi=oi-B[i-1][5]
        a=max(h,B[i-1][4])-min(l,B[i-1][4]);atr=a if atr is None else atr+(a-atr)/14
        if opn and i>opn[4]:
            d,e,sl,tp,_=opn;hs=l<=sl if d>0 else h>=sl;ht=h>=tp if d>0 else l<=tp
            if hs or ht: tr.append(((sl if hs else tp)-e)/e*d-2*fee);opn=None
        for k in [k for k in longs if l<=k]: del longs[k]
        for k in [k for k in shorts if h>=k]: del shorts[k]
        p=(h+l+c)/3
        if doi>0:
            w=0.5+0.5*((c-o)/(h-l) if h>l else 0)
            for L,wt in liq.LEV:
                x,y=round(p*(1-1/L+liq.MM),-1),round(p*(1+1/L-liq.MM),-1)
                longs[x]=longs.get(x,0)+doi*w*wt;shorts[y]=shorts.get(y,0)+doi*(1-w)*wt
        elif doi<0:
            f=max(0.0,1+doi/B[i-1][5])
            for m in (longs,shorts):
                for k in m: m[k]*=f
        if opn or i<100: continue
        up=sum(v for k,v in shorts.items() if k<c*(1+rng));dn=sum(v for k,v in longs.items() if k>c*(1-rng))
        d=1 if up>ratio*dn and up>0 else -1 if dn>ratio*up and dn>0 else 0
        if d: opn=(d,c,c-d*sla*atr,c+d*tpa*atr,i)
    return tr
res=[]
for ratio in (2,3,4):
  for rng in (0.02,0.04):
    for tpa,sla in ((1.5,1.5),(1,1),(2,1),(1,2),(3,1.5)):
      tr=sim(ratio,rng,tpa,sla,0.0002)
      if len(tr)<20: continue
      h=len(tr)//2;a,b=sum(tr[:h])*100,sum(tr[h:])*100
      res.append((min(a,b),ratio,rng,tpa,sla,len(tr),sum(x>0 for x in tr)/len(tr)*100,sum(tr)*100,a,b,(sum(sim(ratio,rng,tpa,sla,0.0005))*100)))
res.sort(reverse=True)
print("ratio rng  TP/SL  trades win%  maker-net  halves         taker-net")
for r in res[:8]+[("..",)]+res[-3:]:
    if r[0]=="..": print("..."); continue
    print(f"{r[1]}x  {r[2]*100:.0f}%  {r[3]}/{r[4]}  {r[5]:4d}  {r[6]:4.1f}  {r[7]:+6.2f}%  {r[8]:+.2f}/{r[9]:+.2f}  {r[10]:+6.2f}%")
