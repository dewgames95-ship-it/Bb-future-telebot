import sys; sys.argv=sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/",1)[0]); import liq
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch
B=liq.B; RATIO,RNG,TPA,SLA,FEE,RISK=3,0.04,1,2,0.0005,0.01
longs,shorts={},{};atr=None;trades=[];opn=None;eq=1000;pk=1000;mdd=0;gw=gl=0
for i in range(1,len(B)):
    t,o,h,l,c,oi=B[i];doi=oi-B[i-1][5]
    a=max(h,B[i-1][4])-min(l,B[i-1][4]);atr=a if atr is None else atr+(a-atr)/14
    if opn and i>opn["i"]:
        d=opn["d"];hs=l<=opn["sl"] if d>0 else h>=opn["sl"];ht=h>=opn["tp"] if d>0 else l<=opn["tp"]
        if hs or ht:
            ex=opn["sl"] if hs else opn["tp"];r=(ex-opn["e"])/opn["e"]*d;pnl=opn["pos"]*(r-2*FEE);eq+=pnl;pk=max(pk,eq);mdd=max(mdd,(pk-eq)/pk*100)
            gw+=max(pnl,0);gl+=max(-pnl,0);opn["win"]=ht and not hs;trades.append(opn);opn=None
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
    up=sum(v for k,v in shorts.items() if k<c*(1+RNG));dn=sum(v for k,v in longs.items() if k>c*(1-RNG))
    d=1 if up>RATIO*dn and up>0 else -1 if dn>RATIO*up and dn>0 else 0
    if d: opn=dict(i=i,d=d,e=c,tp=c+d*TPA*atr,sl=c-d*SLA*atr,pos=min(eq*RISK/(SLA*atr/c),eq*20))
n=len(trades);wins=sum(t["win"] for t in trades)
live=opn or dict(trades[-1],i=trades[-1]["i"])
bg,gr,up_c,dn_c="#131722","#1e2230","#26a69a","#ef5350"
def draw(fn,size,N,fs):
    fig=plt.figure(figsize=size,dpi=170);fig.patch.set_facecolor(bg)
    ax=fig.add_axes([0.02,0.04,0.86,0.88]);ax.set_facecolor(bg)
    x0=len(B)-N;bars=B[-N:];F=int(N*0.22)
    for j,b in enumerate(bars):
        _,o,h,l,c,_=b;col=up_c if c>=o else dn_c
        ax.plot([j,j],[l,h],color=col,lw=0.8);ax.add_patch(Rectangle((j-0.35,min(o,c)),0.7,max(abs(c-o),3),color=col))
    for t in trades+([opn] if opn else []):
        if t["i"]<x0: continue
        j=t["i"]-x0;b=B[t["i"]]
        y=b[3] if t["d"]>0 else b[2]
        ax.annotate("BUY" if t["d"]>0 else "SELL",(j,y),xytext=(j,y+(-1 if t["d"]>0 else 1)*atr*1.3),ha="center",va="center",color="white",fontsize=fs,fontweight="bold",
                    bbox=dict(boxstyle="round,pad=0.25",fc=up_c if t["d"]>0 else dn_c,ec="none"),arrowprops=dict(arrowstyle="-",color=up_c if t["d"]>0 else dn_c,lw=1))
    L=live;j=max(L["i"]-x0,0);x2=N+F-1
    ax.add_patch(Rectangle((j,min(L["e"],L["tp"])),x2-j,abs(L["tp"]-L["e"]),color=up_c,alpha=0.15,lw=0))
    ax.add_patch(Rectangle((j,min(L["e"],L["sl"])),x2-j,abs(L["sl"]-L["e"]),color=dn_c,alpha=0.15,lw=0))
    ax.plot([j,x2],[L["e"]]*2,color="#9598a1",lw=1.6);ax.plot([j,x2],[L["tp"]]*2,color=up_c,lw=1.6,ls="--");ax.plot([j,x2],[L["sl"]]*2,color=dn_c,lw=1.6)
    pt=abs(L["tp"]-L["e"])/L["e"]*100;ps=abs(L["sl"]-L["e"])/L["e"]*100;sg="+" if L["d"]>0 else "-";sg2="-" if L["d"]>0 else "+"
    for y,txt,fc in ((L["tp"],f"Target {sg}{pt:.2f}%  {L['tp']:,.1f}",up_c),(L["e"],f"Entry  {L['e']:,.1f}","#2a2e39"),(L["sl"],f"Stop {sg2}{ps:.2f}%  {L['sl']:,.1f}",dn_c)):
        ax.text(x2,y,txt,color="white",fontsize=fs-0.5,va="center",ha="right",fontweight="bold",bbox=dict(boxstyle="round,pad=0.25",fc=fc,ec="none"))
    lo=min(min(b[3] for b in bars),L["sl"],L["tp"]);hi=max(max(b[2] for b in bars),L["sl"],L["tp"]);pad=(hi-lo)*0.06
    ax.set_xlim(-1,x2+1);ax.set_ylim(lo-pad,hi+pad);ax.grid(color=gr,lw=0.5);ax.set_xticks([]);ax.yaxis.tick_right();ax.tick_params(colors="#b2b5be",labelsize=fs-1)
    for s in ax.spines.values(): s.set_visible(False)
    fig.text(0.02,0.955,"BTCUSDT.P · 1h · OKX data   🐋 Whale Liquidation Magnet".replace("🐋 ",""),color="#d1d4dc",fontsize=fs+1.5,fontweight="bold")
    rows=[("BACKTEST 1h","BTCUSDT.P"),("Trades",str(n)),("Win rate",f"{wins/n*100:.1f}%"),("Profit factor",f"{gw/gl:.2f}"),("Net",f"{(eq-1000)/10:+.2f}%"),
          ("Max drawdown",f"-{mdd:.2f}%"),("$1000 →",f"${eq:,.2f}"),("Risk/trade","1%"),("Fee/side","0.05%")]
    tw=0.30 if size[0]<size[1] else 0.17;rh=0.018 if size[0]<size[1] else 0.032;tx=0.02;ty=0.91
    fig.patches.append(FancyBboxPatch((tx-0.005,ty-rh*len(rows)+rh*0.6),tw,rh*len(rows),transform=fig.transFigure,boxstyle="round,pad=0.004",fc="#1c2030",ec="#363a45"))
    for r,(k,v) in enumerate(rows):
        y=ty-r*rh;good=not v.startswith("-") and not (k=="Profit factor" and gw<gl)
        col="white" if r==0 or k in("Trades","Risk/trade","Fee/side") else (up_c if good else dn_c)
        fig.text(tx,y,k,color="white" if r==0 else "#9598a1",fontsize=fs-1,fontweight="bold" if r==0 else None)
        fig.text(tx+tw-0.012,y,v,color=col,fontsize=fs-1,ha="right",fontweight="bold")
    plt.savefig(fn,facecolor=bg);plt.close(fig)
draw("/home/user/Bb-future-telebot/liquidation_indicator/preview_pc.png",(16,9),160,9)
draw("/home/user/Bb-future-telebot/liquidation_indicator/preview_mobile.png",(5.4,9.6),55,7)
print(n,wins/n,eq,mdd,gw/gl)
