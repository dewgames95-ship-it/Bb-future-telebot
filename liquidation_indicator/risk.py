import sys; sys.argv=sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/",1)[0]); import liq
B=liq.B; SLP=[]
def sim(ratio,rng,tpa,sla,fee):
    longs,shorts={},{};atr=None;tr=[];opn=None
    for i in range(1,len(B)):
        t,o,h,l,c,oi=B[i];doi=oi-B[i-1][5]
        a=max(h,B[i-1][4])-min(l,B[i-1][4]);atr=a if atr is None else atr+(a-atr)/14
        if opn and i>opn[4]:
            d,e,sl,tp,_=opn;hs=l<=sl if d>0 else h>=sl;ht=h>=tp if d>0 else l<=tp
            if hs or ht: tr.append(((sl if hs else tp)-e)/e*d-2*fee); SLP.append(abs(sl-e)/e);opn=None
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
import os
cfg=tuple(map(float,os.environ["CFG"].split(",")))
for fee in (0.0005,0.0002):
  for risk in (0.005,0.01,0.02,0.03):
    SLP.clear(); g=sim(cfg[0],cfg[1],cfg[2],cfg[3],0)
    eq=1000;pk=1000;dd=0;levs=[]
    for r,s in zip(g,SLP):
        pos=min(eq*risk/s,eq*20); levs.append(pos/eq); eq+=pos*(r-2*fee); pk=max(pk,eq); dd=max(dd,(pk-eq)/pk)
    print(f"fee {fee*100:.2f}% risk {risk*100:.1f}% -> ${eq:,.0f}  maxDD {dd*100:.1f}%  avg lev {sum(levs)/len(levs):.1f}x")
