import sys,random; sys.argv=sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/",1)[0]); import liq
B=liq.B
def sim(mode,ratio=3,rng=0.04,fee=0.0005,buf=0.1,seed=1):
    R=random.Random(seed);longs,shorts={},{};atr=None;tr=[];opn=None
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
        A={k:v for k,v in shorts.items() if k<c*(1+rng)};Bd={k:v for k,v in longs.items() if k>c*(1-rng)}
        up,dn=sum(A.values()),sum(Bd.values())
        d=1 if up>ratio*dn and up>0 else -1 if dn>ratio*up and dn>0 else 0
        if mode=="random": d=R.choice((1,-1)) if (i%3==0) else 0
        if not d: continue
        if mode in("atr","random"): opn=(d,c,c-d*2*atr,c+d*atr,i);continue
        tgt=max(A,key=A.get) if d>0 else max(Bd,key=Bd.get)
        tp=tgt-d*buf*atr                                   # just before the big pile
        opp=Bd if d>0 else A                               # nearest opposite cluster = sweep zone
        near=[k for k in opp if (k<c if d>0 else k>c)]
        sw=(max(near) if d>0 else min(near)) if near else c-d*2*atr
        sl=sw-d*0.5*atr                                    # beyond the sweep
        tpd=min(max(abs(tp-c),0.5*atr),4*atr);sld=min(max(abs(sl-c),1*atr),4*atr)
        opn=(d,c,c-d*sld,c+d*tpd,i)
    return tr
def rep(n,tr,days):
    h=len(tr)//2;print(f"{n:<22} {len(tr):4d} tr ({len(tr)/days:.1f}/day) win {sum(x>0 for x in tr)/len(tr)*100:4.1f}% net {sum(tr)*100:+6.2f}% PF {sum(x for x in tr if x>0)/-sum(x for x in tr if x<0):.2f} halves {sum(tr[:h])*100:+.1f}/{sum(tr[h:])*100:+.1f}")
days=(B[-1][0]-B[0][0])/864e5
for fee in (0.0005,0.0002):
    print(f"-- fee {fee*100:.2f}%/side, {days:.0f} days")
    rep("magnet ATR TP1/SL2",sim("atr",fee=fee),days);rep("magnet LIQ-zone TP/SL",sim("clus",fee=fee),days)
    rr=[sim("random",fee=fee,seed=s) for s in range(20)];r=[x for t in rr for x in t];print(f"{'random (avg 20 runs)':<22} {len(r)/20:4.0f} tr win {sum(x>0 for x in r)/len(r)*100:4.1f}% net {sum(r)/20*100:+6.2f}%")
