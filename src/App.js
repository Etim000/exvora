import React, { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { auth, db } from "./firebase";

const C = {
  forest:"#1B4332",green:"#2D6A4F",mid:"#40916C",sage:"#74C69D",
  mint:"#B7E4C7",pale:"#D8F3DC",cream:"#F5F9F6",
  ember:"#E76F51",gold:"#F4A261",sky:"#219EBC",rose:"#E63946",
  ink:"#0D1F13",charcoal:"#2C3E33",mist:"#6B8C72",fog:"#A8C5AF",
  border:"#DCE8DF",shadow:"rgba(27,67,50,0.10)",
};
const FONT="'Plus Jakarta Sans',system-ui,sans-serif";
const DISPLAY="'Playfair Display',Georgia,serif";
const MODE_META={
  swap:{label:"Swap",icon:"🔄",color:C.green,bg:"#E8F5ED",border:"#A8D5B5"},
  kindness:{label:"Kindness",icon:"💙",color:C.sky,bg:"#E3F4FA",border:"#93CFE3"},
  emergency:{label:"Emergency",icon:"🚨",color:C.rose,bg:"#FDE8EA",border:"#F5A8AD"},
  shelter:{label:"Shelter",icon:"🏠",color:"#6B3FA0",bg:"#F0E8FA",border:"#C4A0E0"},
};
const CATS=["All","Food & Farm","Skills & Labour","Clothing","Shelter","Education","Emergency","Health","Other"];

const GS=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:${C.cream};font-family:${FONT};color:${C.ink};}
    input,textarea,select,button{font-family:${FONT};}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
    .fadeUp{animation:fadeUp 0.4s ease forwards;}
    .fadeIn{animation:fadeIn 0.3s ease forwards;}
    .scaleIn{animation:scaleIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards;}
    .spin{animation:spin 0.9s linear infinite;}
    .card{transition:box-shadow 0.2s,transform 0.2s;}
    .card:hover{box-shadow:0 8px 28px rgba(27,67,50,0.16);transform:translateY(-1px);}
  `}</style>
);

const Pill=({label,icon,bg,color,border,sm})=>(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:bg||C.pale,color:color||C.green,border:`1px solid ${border||C.mint}`,borderRadius:100,padding:sm?"2px 9px":"4px 12px",fontSize:sm?11:12,fontWeight:700,whiteSpace:"nowrap"}}>
    {icon&&<span style={{fontSize:sm?10:11}}>{icon}</span>}{label}
  </span>
);

const Av=({user,size=44})=>{
  const colors=["#2D6A4F","#E76F51","#219EBC","#F4A261","#6B3FA0","#C4572A"];
  const color=user?.color||colors[(user?.name||"A").charCodeAt(0)%colors.length];
  const initials=user?.name?user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"?";
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:size*0.36,flexShrink:0,position:"relative",boxShadow:`0 2px 8px ${C.shadow}`}}>
      {initials}
      {user?.verified&&<div style={{position:"absolute",bottom:-1,right:-1,background:C.sky,borderRadius:"50%",width:size*0.32,height:size*0.32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.18,color:"#fff",border:"2px solid #fff"}}>✓</div>}
    </div>
  );
};

const Btn=({children,onClick,variant="primary",full,sm,style={},disabled,loading})=>{
  const v={primary:{bg:C.green,color:"#fff",border:"none"},outline:{bg:"transparent",color:C.green,border:`1.5px solid ${C.green}`},ghost:{bg:"transparent",color:C.mist,border:"none"},ember:{bg:C.ember,color:"#fff",border:"none"},dark:{bg:C.forest,color:"#fff",border:"none"},soft:{bg:C.pale,color:C.green,border:`1px solid ${C.mint}`}}[variant]||{bg:C.green,color:"#fff",border:"none"};
  return(
    <button onClick={onClick} disabled={disabled||loading} style={{background:v.bg,color:v.color,border:v.border,borderRadius:12,padding:sm?"7px 14px":"11px 22px",fontSize:sm?13:14,fontWeight:700,cursor:(disabled||loading)?"not-allowed":"pointer",opacity:(disabled||loading)?0.6:1,width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,transition:"opacity 0.15s",...style}}
      onMouseEnter={e=>!(disabled||loading)&&(e.currentTarget.style.opacity="0.85")}
      onMouseLeave={e=>!(disabled||loading)&&(e.currentTarget.style.opacity="1")}
    >
      {loading?<span className="spin" style={{display:"inline-block",width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%"}}/>:children}
    </button>
  );
};

const Inp=({label,hint,type="text",value,onChange,placeholder,icon,multiline,rows=4,error})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:13,fontWeight:700,color:C.charcoal,marginBottom:5}}>{label}</label>}
    {hint&&<p style={{fontSize:12,color:C.mist,marginBottom:5}}>{hint}</p>}
    <div style={{position:"relative"}}>
      {icon&&<span style={{position:"absolute",left:13,top:multiline?"14px":"50%",transform:multiline?"none":"translateY(-50%)",fontSize:15,pointerEvents:"none"}}>{icon}</span>}
      {multiline
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:icon?"11px 14px 11px 42px":"11px 16px",borderRadius:12,border:`1.5px solid ${error?C.rose:C.border}`,fontSize:14,color:C.ink,background:"#fff",outline:"none",resize:"vertical",lineHeight:1.55}} onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=error?C.rose:C.border}/>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:icon?"11px 14px 11px 42px":"11px 16px",borderRadius:12,border:`1.5px solid ${error?C.rose:C.border}`,fontSize:14,color:C.ink,background:"#fff",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=error?C.rose:C.border}/>
      }
    </div>
    {error&&<p style={{fontSize:12,color:C.rose,marginTop:4,fontWeight:600}}>⚠️ {error}</p>}
  </div>
);

const Sheet=({open,onClose,children,title})=>{
  if(!open)return null;
  return(
    <div className="fadeIn" style={{position:"fixed",inset:0,zIndex:9000,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",background:"rgba(13,31,19,0.6)",backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div className="scaleIn" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px"}}><div style={{width:40,height:4,borderRadius:2,background:C.border}}/></div>
        {title&&<div style={{padding:"0 22px 14px",borderBottom:`1px solid ${C.border}`}}><h2 style={{fontSize:19,fontWeight:800,fontFamily:DISPLAY,color:C.forest}}>{title}</h2></div>}
        <div style={{padding:"16px 22px 0"}}>{children}</div>
      </div>
    </div>
  );
};

const Loader=({msg="Loading…"})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>
    <div className="spin" style={{width:40,height:40,border:`3px solid ${C.pale}`,borderTopColor:C.green,borderRadius:"50%"}}/>
    <p style={{color:C.mist,fontSize:14,fontWeight:600}}>{msg}</p>
  </div>
);

const Alert=({type,msg})=>{
  if(!msg)return null;
  const map={error:{bg:"#FDE8EA",color:C.rose,icon:"⚠️"},success:{bg:"#E8F5ED",color:C.green,icon:"✅"},info:{bg:"#E3F4FA",color:C.sky,icon:"ℹ️"}};
  const s=map[type]||map.info;
  return <div style={{background:s.bg,border:`1px solid ${s.color}40`,borderRadius:10,padding:"10px 14px",fontSize:13,color:s.color,marginBottom:14,fontWeight:600}}>{s.icon} {msg}</div>;
};

const Splash=({onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:99999,background:`linear-gradient(160deg,${C.forest} 0%,${C.green} 55%,${C.mid} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{animation:"float 2.4s ease-in-out infinite",fontSize:72,marginBottom:20}}>🤝</div>
      <h1 style={{fontFamily:DISPLAY,color:"#fff",fontSize:44,fontWeight:800,letterSpacing:-1.5,marginBottom:8}}>Exvora</h1>
      <p style={{color:"rgba(255,255,255,0.7)",fontSize:16}}>Exchange · Support · Survive Together</p>
      <div style={{display:"flex",gap:8,marginTop:36}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.5)",animation:`pulse 1.2s ease-in-out ${i*0.22}s infinite`}}/>)}
      </div>
    </div>
  );
};

const Onboarding=({onDone})=>{
  const slides=[
    {emoji:"🤝",title:"Exchange Without Money",body:"Swap what you have for what you need. No cash required — just community trust."},
    {emoji:"💙",title:"Kindness Has No Price",body:"Give freely. Food, skills, shelter — because helping others is its own reward."},
    {emoji:"🚨",title:"Emergency Help Fast",body:"Post urgent needs instantly. Your community responds within minutes."},
    {emoji:"🌍",title:"Built for Real Communities",body:"Where sharing is strength and every helping hand matters."},
  ];
  const [step,setStep]=useState(0);
  const s=slides[step];
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.forest} 0%,${C.green} 100%)`,display:"flex",flexDirection:"column",padding:28}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <div key={step} style={{fontSize:80,marginBottom:28,animation:"float 3s ease-in-out infinite"}}>{s.emoji}</div>
        <h2 style={{fontFamily:DISPLAY,color:"#fff",fontSize:28,fontWeight:800,lineHeight:1.25,marginBottom:16,maxWidth:300}}>{s.title}</h2>
        <p style={{color:"rgba(255,255,255,0.75)",fontSize:15,lineHeight:1.75,maxWidth:300}}>{s.body}</p>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28}}>
        {slides.map((_,i)=><div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?"#fff":"rgba(255,255,255,0.3)",transition:"all 0.3s"}}/>)}
      </div>
      <div style={{display:"flex",gap:12}}>
        {step<slides.length-1
          ?<><Btn variant="ghost" onClick={onDone} style={{color:"rgba(255,255,255,0.6)",flex:1}}>Skip</Btn><Btn onClick={()=>setStep(step+1)} style={{background:"#fff",color:C.green,flex:2}}>Continue →</Btn></>
          :<Btn onClick={onDone} style={{background:"#fff",color:C.green,flex:1,padding:"14px",fontSize:16}}>Get Started — Free 🚀</Btn>
        }
      </div>
    </div>
  );
};

const Auth=({onLogin})=>{
  const [tab,setTab]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const submit=async()=>{
    setErr("");
    if(tab==="register"&&!name.trim()){setErr("Please enter your full name.");return;}
    if(!email.includes("@")){setErr("Enter a valid email address.");return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");return;}
    setLoading(true);
    try{
      if(tab==="register"){
        const cred=await createUserWithEmailAndPassword(auth,email,pass);
        await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"users",cred.user.uid),{name:name.trim(),email,location:"",bio:"",verified:false,rating:0,reviews:0,createdAt:serverTimestamp()});
        onLogin(cred.user);
      }else{
        const cred=await signInWithEmailAndPassword(auth,email,pass);
        onLogin(cred.user);
      }
    }catch(e){
      const msgs={"auth/email-already-in-use":"Email already registered. Sign in instead.","auth/user-not-found":"No account found. Please register.","auth/wrong-password":"Incorrect password.","auth/invalid-credential":"Incorrect email or password.","auth/too-many-requests":"Too many attempts. Please wait."};
      setErr(msgs[e.code]||"Something went wrong. Please try again.");
    }
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:C.cream,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:22,margin:"0 auto 14px",background:`linear-gradient(135deg,${C.forest},${C.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,boxShadow:`0 8px 24px rgba(27,67,50,0.22)`}}>🤝</div>
          <h1 style={{fontFamily:DISPLAY,fontSize:32,fontWeight:800,color:C.forest,letterSpacing:-1,marginBottom:4}}>Exvora</h1>
          <p style={{fontSize:14,color:C.mist}}>Community exchange platform</p>
        </div>
        <div style={{background:"#fff",borderRadius:22,padding:26,boxShadow:`0 4px 28px ${C.shadow}`}}>
          <div style={{display:"flex",background:C.cream,borderRadius:12,padding:4,marginBottom:22}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:tab===t?C.forest:"transparent",color:tab===t?"#fff":C.mist,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.18s"}}>
                {t==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          {tab==="register"&&<Inp label="Full Name" value={name} onChange={setName} placeholder="Your full name" icon="👤"/>}
          <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="yourname@gmail.com" icon="✉️"/>
          <Inp label="Password" type="password" value={pass} onChange={setPass} placeholder="Minimum 6 characters" icon="🔒"/>
          <Alert type="error" msg={err}/>
          <Btn onClick={submit} full loading={loading} style={{padding:"13px",fontSize:15,marginBottom:14}}>
            {tab==="login"?"Sign In to Exvora →":"Create My Account →"}
          </Btn>
          <p style={{textAlign:"center",fontSize:12,color:C.fog,lineHeight:1.6}}>By joining you agree to our Community Guidelines. We never sell your data.</p>
        </div>
      </div>
    </div>
  );
};

const PostCard=({post,currentUser,onMessage,onOpen})=>{
  const mode=MODE_META[post.mode]||MODE_META.swap;
  const [liked,setLiked]=useState(post.likedBy?.includes(currentUser.uid)||false);
  const [likeCount,setLikeCount]=useState(post.likes||0);
  
  const toggleLike=async(e)=>{
    e.stopPropagation();
    const newLiked=!liked;
    setLiked(newLiked);
    setLikeCount(c=>newLiked?c+1:c-1);
    try{
      await updateDoc(doc(db,"posts",post.id),{
        likedBy:newLiked?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid),
        likes:increment(newLiked?1:-1)
      });
    }catch(e){
      setLiked(!newLiked);
      setLikeCount(c=>newLiked?c-1:c+1);
    }
  };
  
  return(
    <div className="card fadeUp" onClick={()=>onOpen(post)} style={{background:"#fff",borderRadius:18,border:`1.5px solid ${C.border}`,padding:18,marginBottom:14,cursor:"pointer",boxShadow:`0 2px 12px ${C.shadow}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Av user={{name:post.authorName}} size={40}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:C.ink,marginBottom:1}}>{post.authorName||"Community Member"}</div>
          <div style={{fontSize:11,color:C.mist}}>📍 {post.location||"Nigeria"} · {post.timeAgo||"Recently"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
          <Pill label={mode.label} icon={mode.icon} bg={mode.bg} color={mode.color} border={mode.border}/>
          <Pill label={post.type==="HAVE"?"I HAVE":"I NEED"} icon={post.type==="HAVE"?"✅":"🙏"} bg={post.type==="HAVE"?"#E8F5ED":"#FFF6E0"} color={post.type==="HAVE"?C.green:"#C47A00"} border={post.type==="HAVE"?C.mint:"#F0D080"} sm/>
        </div>
      </div>
      <div style={{display:"flex",gap:13,alignItems:"flex-start",marginBottom:14}}>
        <div style={{width:54,height:54,borderRadius:13,background:mode.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,border:`1px solid ${mode.border}`}}>{post.emoji||"📦"}</div>
        <div style={{flex:1,minWidth:0}}>
          {post.urgent&&<div style={{background:"#FDE8EA",color:C.rose,fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:6,display:"inline-block",marginBottom:5}}>🚨 URGENT</div>}
          <h3 style={{fontSize:15,fontWeight:800,color:C.ink,lineHeight:1.35,marginBottom:5}}>{post.title}</h3>
          <p style={{fontSize:13,color:C.charcoal,lineHeight:1.6}}>{(post.desc||"").slice(0,100)}{(post.desc||"").length>100?"…":""}</p>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
        <button onClick={toggleLike} style={{background:liked?"#FDE8EA":C.cream,border:`1px solid ${liked?"#F5A8AD":C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,color:liked?C.rose:C.mist,cursor:"pointer",fontWeight:700,transition:"all 0.15s"}}>❤️ {likeCount}</button>
        <button onClick={e=>{e.stopPropagation();onMessage({uid:post.authorId,name:post.authorName});}} style={{background:C.pale,border:`1px solid ${C.mint}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:C.green,cursor:"pointer",fontWeight:700}}>💬 Message</button>
        {post.responses>0&&<span style={{marginLeft:"auto",fontSize:12,color:C.mid,fontWeight:700}}>🔗 {post.responses} responses</span>}
      </div>
    </div>
  );
};

const Home=({currentUser,onMessage})=>{
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [mode,setMode]=useState("all");
  const [ptype,setPtype]=useState("All");
  const [open,setOpen]=useState(null);
  
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      const data=snap.docs.map(d=>{
        const x=d.data();
        const secs=x.createdAt?.seconds||Date.now()/1000;
        const diff=Math.floor((Date.now()/1000)-secs);
        const timeAgo=diff<60?"Just now":diff<3600?`${Math.floor(diff/60)}m ago`:diff<86400?`${Math.floor(diff/3600)}h ago`:`${Math.floor(diff/86400)}d ago`;
        return{id:d.id,...x,timeAgo};
      });
      setPosts(data);setLoading(false);
    });
    return()=>unsub();
  },[]);
  
  const filtered=posts.filter(p=>{
    if(cat!=="All"&&p.category!==cat)return false;
    if(mode!=="all"&&p.mode!==mode)return false;
    if(ptype!=="All"&&p.type!==ptype)return false;
    if(search){const q=search.toLowerCase();return p.title?.toLowerCase().includes(q)||p.desc?.toLowerCase().includes(q);}
    return true;
  });
  
  const urgent=posts.filter(p=>p.urgent);
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{background:`linear-gradient(155deg,${C.forest} 0%,${C.green} 65%,${C.mid} 100%)`,borderRadius:"0 0 28px 28px",padding:"22px 18px 28px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h2 style={{fontFamily:DISPLAY,color:"#fff",fontSize:22,fontWeight:800,lineHeight:1.2,marginBottom:4}}>
              Welcome, {(currentUser?.displayName||"Friend").split(" ")[0]}! 🌿
            </h2>
            <p style={{color:"rgba(255,255,255,0.72)",fontSize:13}}>
              {urgent.length>0?`🚨 ${urgent.length} urgent request${urgent.length>1?"s":""} need help`:"Community is active and ready"}
            </p>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",textAlign:"center"}}>
            <div style={{color:"#fff",fontWeight:800,fontSize:19}}>{posts.length}</div>
            <div style={{color:"rgba(255,255,255,0.62)",fontSize:10,fontWeight:600}}>Posts</div>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items, skills, people…" style={{width:"100%",padding:"11px 14px 11px 42px",borderRadius:13,border:"none",fontSize:14,background:"rgba(255,255,255,0.96)",color:C.ink,outline:"none"}}/>
        </div>
      </div>
      <div style={{padding:"0 15px"}}>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:6,marginBottom:11}}>
          {[{key:"all",icon:"🌐",label:"All"},{key:"emergency",icon:"🚨",label:"Emergency"},{key:"kindness",icon:"💙",label:"Kindness"},{key:"swap",icon:"🔄",label:"Swap"},{key:"shelter",icon:"🏠",label:"Shelter"}].map(m=>(
            <button key={m.key} onClick={()=>setMode(m.key)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,cursor:"pointer",border:`1.5px solid ${mode===m.key?C.green:C.border}`,background:mode===m.key?C.green:"#fff",color:mode===m.key?"#fff":C.mist,fontWeight:700,fontSize:12,whiteSpace:"nowrap",transition:"all 0.18s"}}>{m.icon} {m.label}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:7,marginBottom:11}}>
          {["All","HAVE","NEED"].map(t=>(
            <button key={t} onClick={()=>setPtype(t)} style={{padding:"6px 15px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:12,border:`1.5px solid ${ptype===t?C.green:C.border}`,background:ptype===t?"#E8F5ED":"#fff",color:ptype===t?C.green:C.mist,transition:"all 0.18s"}}>{t==="HAVE"?"✅ I HAVE":t==="NEED"?"🙏 I NEED":"All"}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:14}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"4px 12px",borderRadius:20,cursor:"pointer",background:cat===c?C.ember:C.cream,border:`1px solid ${cat===c?C.ember:C.border}`,color:cat===c?"#fff":C.mist,fontSize:12,fontWeight:600,transition:"all 0.18s"}}>{c}</button>
          ))}
        </div>
        {urgent.length>0&&mode==="all"&&(
          <div style={{background:"#FDE8EA",border:`1.5px solid ${C.rose}`,borderRadius:16,padding:"13px 15px",marginBottom:14,display:"flex",gap:11,alignItems:"center"}}>
            <span style={{fontSize:24}}>🚨</span>
            <div>
              <div style={{fontWeight:800,color:C.rose,fontSize:14,marginBottom:2}}>Emergency Help Needed</div>
              <div style={{fontSize:12,color:C.charcoal,lineHeight:1.5}}>{urgent.length} person{urgent.length>1?"s":""} need urgent help right now.</div>
            </div>
          </div>
        )}
        {loading?<Loader msg="Loading community posts…"/>:
         filtered.length===0?(
          <div style={{textAlign:"center",padding:"50px 0",color:C.fog}}>
            <div style={{fontSize:52,marginBottom:14}}>🌿</div>
            <div style={{fontWeight:700,fontSize:17,marginBottom:6}}>No posts found</div>
            <div style={{fontSize:13}}>{posts.length===0?"Be the first to post!":"Try different filters."}</div>
          </div>
        ):filtered.map((post,i)=>(
          <div key={post.id} style={{animationDelay:`${i*0.05}s`}}>
            <PostCard post={post} currentUser={currentUser} onMessage={onMessage} onOpen={setOpen}/>
          </div>
        ))}
      </div>
      <Sheet open={!!open} onClose={()=>setOpen(null)}>
        {open&&(()=>{
          const mode=MODE_META[open.mode]||MODE_META.swap;
          return(
            <>
              <div style={{background:`linear-gradient(135deg,${mode.bg},${C.cream})`,borderRadius:16,padding:"22px 0",textAlign:"center",fontSize:62,marginBottom:16}}>{open.emoji||"📦"}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
                <Pill label={mode.label} icon={mode.icon} bg={mode.bg} color={mode.color} border={mode.border}/>
                <Pill label={open.type==="HAVE"?"I HAVE":"I NEED"} icon={open.type==="HAVE"?"✅":"🙏"} bg={open.type==="HAVE"?"#E8F5ED":"#FFF6E0"} color={open.type==="HAVE"?C.green:"#C47A00"} border={open.type==="HAVE"?C.mint:"#F0D080"}/>
              </div>
              {open.urgent&&<div style={{background:"#FDE8EA",border:`1.5px solid ${C.rose}`,borderRadius:12,padding:"10px 14px",marginBottom:14,color:C.rose,fontSize:13,fontWeight:700}}>🚨 URGENT — Please respond quickly if you can help.</div>}
              <h2 style={{fontFamily:DISPLAY,fontSize:20,fontWeight:800,color:C.forest,lineHeight:1.3,marginBottom:12}}>{open.title}</h2>
              <p style={{fontSize:14,color:C.charcoal,lineHeight:1.75,marginBottom:16}}>{open.desc}</p>
              <div style={{fontSize:12,color:C.mist,marginBottom:20}}>📍 {open.location} · 🕐 {open.timeAgo} · ❤️ {open.likes||0} likes</div>
              <div style={{background:C.cream,borderRadius:14,padding:16,marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Av user={{name:open.authorName}} size={48}/>
                  <div><div style={{fontWeight:800,fontSize:15,color:C.ink,marginBottom:3}}>{open.authorName}</div><div style={{fontSize:12,color:C.mist}}>📍 {open.location}</div></div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn onClick={()=>{onMessage({uid:open.authorId,name:open.authorName});setOpen(null);}} full style={{padding:"13px"}}>💬 Message {(open.authorName||"").split(" ")[0]}</Btn>
                <Btn variant="outline" style={{padding:"13px 16px"}}>🚩</Btn>
              </div>
            </>
          );
        })()}
      </Sheet>
    </div>
  );
};

const Create=({currentUser})=>{
  const EMOJIS={"Food & Farm":"🌽","Skills & Labour":"🔨","Clothing":"👗","Shelter":"🏡","Education":"📖","Emergency":"🚨","Health":"💊","Other":"📦"};
  const [type,setType]=useState("HAVE");
  const [mode,setMode]=useState("swap");
  const [cat,setCat]=useState("Food & Farm");
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [loc,setLoc]=useState("");
  const [urgent,setUrgent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [err,setErr]=useState("");
  
  const publish=async()=>{
    if(!title.trim()){setErr("Please add a title.");return;}
    if(desc.trim().length<20){setErr("Description must be at least 20 characters.");return;}
    if(!loc.trim()){setErr("Please enter your location.");return;}
    setErr("");setLoading(true);
    try{
      await addDoc(collection(db,"posts"),{
        type,mode,category:cat,title:title.trim(),desc:desc.trim(),
        location:loc.trim(),urgent:mode==="emergency"?urgent:false,
        emoji:EMOJIS[cat]||"📦",
        authorId:currentUser.uid,authorName:currentUser.displayName||"Anonymous",
        likes:0,likedBy:[],responses:0,verified:false,
        tags:title.trim().toLowerCase().split(" ").filter(w=>w.length>3).slice(0,4),
        createdAt:serverTimestamp(),
      });
      setDone(true);
    }catch(e){setErr("Failed to publish. Check your connection.");}
    setLoading(false);
  };
  
  if(done)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",textAlign:"center",padding:32}}>
      <div style={{fontSize:80,marginBottom:20}}>🎉</div>
      <h2 style={{fontFamily:DISPLAY,fontSize:26,fontWeight:800,color:C.forest,marginBottom:10}}>Post Published!</h2>
      <p style={{color:C.charcoal,fontSize:15,lineHeight:1.7,maxWidth:280,marginBottom:24}}>Your post is now live. Community members will see it and reach out.</p>
      <Btn onClick={()=>{setDone(false);setTitle("");setDesc("");setMode("swap");setType("HAVE");setUrgent(false);}}>Create Another Post</Btn>
    </div>
  );
  
  return(
    <div style={{padding:"18px 18px 100px"}}>
      <h2 style={{fontFamily:DISPLAY,fontSize:22,fontWeight:800,color:C.forest,marginBottom:3}}>Create a Post</h2>
      <p style={{fontSize:13,color:C.mist,marginBottom:20}}>Share what you have, need, or offer freely.</p>
      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:C.charcoal,marginBottom:8}}>What are you doing?</label>
        <div style={{display:"flex",gap:10}}>
          {["HAVE","NEED"].map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"13px",borderRadius:14,cursor:"pointer",border:`2px solid ${type===t?C.green:C.border}`,background:type===t?"#E8F5ED":"#fff",color:type===t?C.forest:C.mist,fontWeight:800,fontSize:15,transition:"all 0.18s"}}>
              {t==="HAVE"?"✅ I HAVE":"🙏 I NEED"}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:C.charcoal,marginBottom:8}}>Post Type</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.entries(MODE_META).map(([key,m])=>(
            <button key={key} onClick={()=>setMode(key)} style={{padding:"13px 12px",borderRadius:14,textAlign:"left",cursor:"pointer",border:`2px solid ${mode===key?m.color:C.border}`,background:mode===key?m.bg:"#fff",transition:"all 0.18s"}}>
              <div style={{fontSize:22,marginBottom:5}}>{m.icon}</div>
              <div style={{fontWeight:800,fontSize:13,color:mode===key?m.color:C.ink,marginBottom:2}}>{m.label}</div>
              <div style={{fontSize:11,color:C.mist}}>{{swap:"Exchange for something",kindness:"Give freely",emergency:"Urgent help needed",shelter:"Space for service"}[key]}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:C.charcoal,marginBottom:8}}>Category</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {CATS.filter(c=>c!=="All").map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 13px",borderRadius:20,cursor:"pointer",border:`1.5px solid ${cat===c?C.forest:C.border}`,background:cat===c?C.forest:"#fff",color:cat===c?"#fff":C.mist,fontSize:12,fontWeight:700,transition:"all 0.18s"}}>{c}</button>
          ))}
        </div>
      </div>
      <Inp label="Post Title" hint="Be specific — good titles get more responses" value={title} onChange={setTitle} placeholder="e.g. Fresh farm tomatoes, 3kg bundle available"/>
      <Inp label="Full Description" hint="Include quantity, condition, and what you want in return" value={desc} onChange={setDesc} placeholder="Describe everything clearly…" multiline rows={5}/>
      <Inp label="Your Location" hint="Area or neighbourhood" value={loc} onChange={setLoc} placeholder="e.g. Ugbowo, Benin City" icon="📍"/>
      {mode==="emergency"&&(
        <div style={{background:"#FDE8EA",border:`1.5px solid ${C.rose}`,borderRadius:12,padding:14,marginBottom:14}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)} style={{width:18,height:18}}/>
            <span style={{fontSize:13,color:C.rose,fontWeight:700}}>🚨 Mark as URGENT — I need help immediately</span>
          </label>
        </div>
      )}
      <Alert type="error" msg={err}/>
      <Btn onClick={publish} full loading={loading} style={{padding:"14px",fontSize:16,marginBottom:10}}>🚀 Publish Post to Community</Btn>
    </div>
  );
};

const Messages=({currentUser,activeChat,setActiveChat})=>{
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [threads,setThreads]=useState([]);
  const [loading,setLoading]=useState(true);
  const endRef=useRef(null);
  const chatId=activeChat?[currentUser.uid,activeChat.uid].sort().join("_"):null;
  
  useEffect(()=>{
    if(!activeChat||!chatId)return;
    const q=query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"));
    const unsub=onSnapshot(q,snap=>{setMsgs(snap.docs.map(d=>({id:d.id,...d.data()})));});
    return()=>unsub();
  },[chatId,activeChat]);
  
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  
  useEffect(()=>{
    const load=async()=>{
      try{
        const snap=await getDocs(collection(db,"chats"));
        setThreads(snap.docs.filter(d=>d.id.includes(currentUser.uid)).map(d=>({id:d.id,...d.data()})));
      }catch(e){}
      setLoading(false);
    };
    if(!activeChat)load();
  },[activeChat,currentUser.uid]);
  
  const send=async()=>{
    if(!input.trim()||!activeChat||!chatId)return;
    const text=input.trim();setInput("");
    try{
      await addDoc(collection(db,"chats",chatId,"messages"),{
        text,from:currentUser.uid,fromName:currentUser.displayName||"You",
        to:activeChat.uid,createdAt:serverTimestamp(),
      });
      await setDoc(doc(db,"chats",chatId),{
        participants:[currentUser.uid,activeChat.uid],
        participantNames:{[currentUser.uid]:currentUser.displayName,[activeChat.uid]:activeChat.name},
        lastMessage:text,lastMessageTime:serverTimestamp(),
      },{merge:true});
    }catch(e){setInput(text);}
  };
  
  if(activeChat)return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 64px)"}}>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,background:"#fff",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <button onClick={()=>{setActiveChat(null);setMsgs([]);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.mist}}>←</button>
        <Av user={{name:activeChat.name}} size={36}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:14,color:C.ink}}>{activeChat.name}</div>
          <div style={{fontSize:11,color:C.sage,fontWeight:600}}>Exvora member</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",background:C.cream,display:"flex",flexDirection:"column",gap:10}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:C.fog}}><div style={{fontSize:40,marginBottom:10}}>👋</div><div style={{fontWeight:600}}>Say hello to {activeChat.name.split(" ")[0]}!</div></div>}
        {msgs.map(m=>{
          const isMe=m.from===currentUser.uid;
          const secs=m.createdAt?.seconds||0;
          const time=secs?new Date(secs*1000).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}):"";
          return(
            <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
              {!isMe&&<Av user={{name:activeChat.name}} size={26}/>}
              <div style={{maxWidth:"74%",padding:"11px 15px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?C.forest:"#fff",color:isMe?"#fff":C.ink,fontSize:14,lineHeight:1.6,boxShadow:`0 2px 8px ${C.shadow}`}}>
                {m.text}
                <div style={{fontSize:10,marginTop:4,color:isMe?"rgba(255,255,255,0.5)":C.fog,textAlign:"right"}}>{time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"11px 13px",background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",gap:9,alignItems:"center",flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type your message…" style={{flex:1,padding:"11px 15px",borderRadius:22,border:`1.5px solid ${C.border}`,fontSize:14,color:C.ink,background:C.cream,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=C.border}/>
        <button onClick={send} style={{width:42,height:42,borderRadius:"50%",background:input.trim()?C.green:C.border,border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.18s"}}>→</button>
      </div>
    </div>
  );
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{padding:"18px 18px 12px",borderBottom:`1px solid ${C.border}`,background:"#fff"}}>
        <h2 style={{fontFamily:DISPLAY,fontSize:22,fontWeight:800,color:C.forest,marginBottom:2}}>Messages</h2>
        <p style={{fontSize:13,color:C.mist}}>Your exchange conversations</p>
      </div>
      {loading?<Loader msg="Loading conversations…"/>:threads.length===0?(
        <div style={{textAlign:"center",padding:"50px 20px",color:C.fog}}>
          <div style={{fontSize:52,marginBottom:14}}>💬</div>
          <div style={{fontWeight:700,fontSize:17,marginBottom:6}}>No messages yet</div>
          <div style={{fontSize:13}}>Tap "Message" on any post to start a conversation.</div>
        </div>
      ):threads.map(t=>{
        const otherId=t.participants?.find(p=>p!==currentUser.uid);
        const otherName=t.participantNames?.[otherId]||"Community Member";
        return(
          <div key={t.id} onClick={()=>setActiveChat({uid:otherId,name:otherName})} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:"#fff",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.cream} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <Av user={{name:otherName}} size={48}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:C.ink,marginBottom:2}}>{otherName}</div>
              <div style={{fontSize:12,color:C.mist,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.lastMessage||"Start chatting"}</div>
            </div>
            <span style={{color:C.fog,fontSize:20}}>›</span>
          </div>
        );
      })}
    </div>
  );
};

const SettingsPage=({onBack,currentUser})=>{
  const [notif,setNotif]=useState(true);
  const [loc,setLoc]=useState(true);
  const [msg,setMsg]=useState("");
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{padding:"18px 18px 12px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.mist}}>←</button>
        <div><h2 style={{fontFamily:DISPLAY,fontSize:22,fontWeight:800,color:C.forest}}>Settings</h2></div>
      </div>
      <div style={{padding:"18px"}}>
        {msg&&<Alert type="success" msg={msg}/>}
        <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <h3 style={{fontWeight:800,fontSize:16,marginBottom:14,color:C.forest}}>Notifications</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:12}}>
            <div><div style={{fontWeight:700,fontSize:14,color:C.ink,marginBottom:2}}>Push Notifications</div><div style={{fontSize:12,color:C.mist}}>Get alerts for matches and messages</div></div>
            <input type="checkbox" checked={notif} onChange={e=>setNotif(e.target.checked)} style={{width:20,height:20}}/>
          </label>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <h3 style={{fontWeight:800,fontSize:16,marginBottom:14,color:C.forest}}>Location</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:12}}>
            <div><div style={{fontWeight:700,fontSize:14,color:C.ink,marginBottom:2}}>Location Services</div><div style={{fontSize:12,color:C.mist}}>Show nearby posts and users</div></div>
            <input type="checkbox" checked={loc} onChange={e=>setLoc(e.target.checked)} style={{width:20,height:20}}/>
          </label>
        </div>
        <Btn onClick={()=>setMsg("Settings saved!")} full>Save Settings</Btn>
      </div>
    </div>
  );
};

const Profile=({currentUser,onLogout})=>{
  const [profile,setProfile]=useState(null);
  const [tab,setTab]=useState("about");
  const [editing,setEditing]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [name,setName]=useState("");
  const [bio,setBio]=useState("");
  const [location,setLocation]=useState("");
  const [saving,setSaving]=useState(false);
  const [posts,setPosts]=useState([]);
  const [msg,setMsg]=useState("");
  
  useEffect(()=>{
    const load=async()=>{
      try{
        const snap=await getDoc(doc(db,"users",currentUser.uid));
        if(snap.exists()){const d=snap.data();setProfile(d);setName(d.name||currentUser.displayName||"");setBio(d.bio||"");setLocation(d.location||"");}
        else{setName(currentUser.displayName||"");setProfile({});}
        const q=query(collection(db,"posts"),where("authorId","==",currentUser.uid));
        const psnap=await getDocs(q);
        setPosts(psnap.docs.map(d=>({id:d.id,...d.data()})));
      }catch(e){}
    };
    load();
  },[currentUser]);
  
  const save=async()=>{
    setSaving(true);
    try{
      await setDoc(doc(db,"users",currentUser.uid),{name,bio,location,email:currentUser.email,verified:profile?.verified||false,rating:profile?.rating||0,reviews:profile?.reviews||0},{merge:true});
      await updateProfile(currentUser,{displayName:name});
      setProfile(p=>({...p,name,bio,location}));
      setEditing(false);setMsg("Profile saved!");setTimeout(()=>setMsg(""),3000);
    }catch(e){setMsg("Failed to save.");}
    setSaving(false);
  };
  
  const logout=async()=>{try{await signOut(auth);onLogout();}catch(e){}};
  
  if(showSettings)return <SettingsPage onBack={()=>setShowSettings(false)} currentUser={currentUser}/>;
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:`linear-gradient(155deg,${C.forest} 0%,${C.green} 100%)`,padding:"24px 18px 38px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
          <Av user={{name:name||currentUser.displayName}} size={64}/>
          <div style={{flex:1}}>
            <h2 style={{fontFamily:DISPLAY,color:"#fff",fontSize:20,fontWeight:800,marginBottom:3}}>{name||currentUser.displayName||"Your Profile"}</h2>
            <div style={{color:"rgba(255,255,255,0.72)",fontSize:13,marginBottom:4}}>📍 {location||"Location not set"}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{currentUser.email}</div>
          </div>
          <Btn variant="ghost" onClick={logout} style={{color:"rgba(255,255,255,0.65)",fontSize:12,padding:"6px 10px"}}>Sign out</Btn>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"0 15px",marginTop:-22,marginBottom:16}}>
        {[{v:posts.length,l:"Posts"},{v:profile?.reviews||0,l:"Reviews"},{v:profile?.rating||"New",l:"Rating"}].map(s=>(
          <div key={s.l} style={{background:"#fff",borderRadius:14,padding:"12px 8px",textAlign:"center",boxShadow:`0 2px 10px ${C.shadow}`,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:800,fontSize:20,color:C.forest}}>{s.v}</div>
            <div style={{fontSize:11,color:C.mist,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"0 15px"}}>
        {msg&&<Alert type={msg.includes("saved")?"success":"error"} msg={msg}/>}
        <div style={{display:"flex",background:C.cream,borderRadius:12,padding:4,marginBottom:16}}>
          {["about","posts","settings"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:tab===t?C.forest:"transparent",color:tab===t?"#fff":C.mist,fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
        {tab==="about"&&(editing?(
          <div style={{background:"#fff",borderRadius:16,padding:18,border:`1px solid ${C.border}`}}>
            <h3 style={{fontWeight:800,color:C.forest,marginBottom:16,fontSize:16}}>Edit Profile</h3>
            <Inp label="Full Name" value={name} onChange={setName} placeholder="Your full name" icon="👤"/>
            <Inp label="Location" value={location} onChange={setLocation} placeholder="Your city or area" icon="📍"/>
            <Inp label="About You" value={bio} onChange={setBio} placeholder="Tell the community who you are…" multiline rows={3}/>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={save} full loading={saving}>Save Profile</Btn>
              <Btn variant="outline" onClick={()=>setEditing(false)} full>Cancel</Btn>
            </div>
          </div>
        ):(
          <div style={{background:"#fff",borderRadius:16,padding:18,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontWeight:800,color:C.forest,fontSize:15}}>About Me</h3>
              <Btn variant="soft" sm onClick={()=>setEditing(true)}>✏️ Edit</Btn>
            </div>
            <p style={{fontSize:14,color:C.charcoal,lineHeight:1.7,marginBottom:16}}>{bio||"Add a bio so the community knows who you are."}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{l:"Name",v:name||"Not set"},{l:"Location",v:location||"Not set"},{l:"Email",v:currentUser.email},{l:"Status",v:profile?.verified?"✅ Verified":"⏳ Unverified"}].map(f=>(
                <div key={f.l} style={{background:C.cream,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:C.fog,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:3}}>{f.l}</div>
                  <div style={{fontSize:12,color:C.charcoal,fontWeight:600,wordBreak:"break-all"}}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tab==="posts"&&(posts.length===0?(
          <div style={{textAlign:"center",padding:"32px 0",color:C.fog}}>
            <div style={{fontSize:44,marginBottom:10}}>📋</div>
            <div style={{fontWeight:600,fontSize:15}}>No posts yet</div>
          </div>
        ):posts.map(p=>{const m=MODE_META[p.mode]||MODE_META.swap;return(
          <div key={p.id} style={{background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"13px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:26}}>{p.emoji||"📦"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
              <Pill label={m.label} icon={m.icon} bg={m.bg} color={m.color} border={m.border} sm/>
            </div>
          </div>
        );}))}
        {tab==="settings"&&[{icon:"🔔",label:"Notifications & Alerts",action:()=>setShowSettings(true)},{icon:"📍",label:"Location Services",action:()=>setShowSettings(true)},{icon:"🔒",label:"Privacy Settings",action:()=>setShowSettings(true)},{icon:"🚩",label:"Report a User",action:()=>{}},{icon:"📞",label:"Help & Support",action:()=>{}}].map(s=>(
          <div key={s.label} className="card" onClick={s.action} style={{background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"13px 15px",marginBottom:10,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:38,height:38,borderRadius:12,background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{s.icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.ink}}>{s.label}</div></div>
            <span style={{color:C.fog,fontSize:20}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Nav=({tab,setTab})=>{
  const items=[{key:"home",icon:"🏠",label:"Home"},{key:"create",icon:"+",label:"Post",special:true},{key:"messages",icon:"💬",label:"Messages"},{key:"profile",icon:"👤",label:"Profile"}];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:5000,background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 12px",boxShadow:"0 -4px 20px rgba(0,0,0,0.07)"}}>
      {items.map(item=>(
        <button key={item.key} onClick={()=>setTab(item.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:tab===item.key?C.forest:C.fog,transition:"color 0.15s"}}>
          {item.special?(
            <div style={{width:48,height:48,borderRadius:16,marginTop:-14,background:`linear-gradient(135deg,${C.forest},${C.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#fff",boxShadow:`0 4px 16px rgba(27,67,50,0.35)`}}>+</div>
          ):(
            <span style={{fontSize:22}}>{item.icon}</span>
          )}
          <span style={{fontSize:item.special?10:9,fontWeight:tab===item.key?800:600,marginTop:item.special?1:0}}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App(){
  const [phase,setPhase]=useState("splash");
  const [tab,setTab]=useState("home");
  const [currentUser,setCurrentUser]=useState(null);
  const [activeChat,setActiveChat]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,user=>{setCurrentUser(user);setAuthReady(true);});
    return()=>unsub();
  },[]);
  
  const handleMessage=useCallback(user=>{setActiveChat(user);setTab("messages");},[]);
  const handleTab=useCallback(t=>{if(t!=="messages")setActiveChat(null);setTab(t);},[]);
  
  return(
    <>
      <GS/>
      {phase==="splash"&&<Splash onDone={()=>setPhase("onboard")}/>}
      {phase==="onboard"&&<Onboarding onDone={()=>setPhase("auth")}/>}
      {(phase==="auth"||phase==="app")&&!currentUser&&authReady&&<Auth onLogin={u=>{setCurrentUser(u);setPhase("app");}}/>}
      {currentUser&&(
        <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.cream}}>
          <div style={{minHeight:"100vh"}}>
            {tab==="home"&&<Home currentUser={currentUser} onMessage={handleMessage}/>}
            {tab==="create"&&<Create currentUser={currentUser}/>}
            {tab==="messages"&&<Messages currentUser={currentUser} activeChat={activeChat} setActiveChat={setActiveChat}/>}
            {tab==="profile"&&<Profile currentUser={currentUser} onLogout={()=>{setCurrentUser(null);setPhase("auth");}}/>}
          </div>
          <Nav tab={tab} setTab={handleTab}/>
        </div>
      )}
    </>
  );
}
