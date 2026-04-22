import React, { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { auth, db } from "./firebase";

const THEMES={
  dark:{bg:"#0A0A0A",surface:"#1C1C1E",card:"#2C2C2E",text:"#FFFFFF",textSec:"#EBEBF5",textTer:"#8E8E93",border:"#38383A",primary:"#0A84FF",accent:"#5E5CE6",success:"#30D158",error:"#FF453A"},
  light:{bg:"#F2F2F7",surface:"#FFFFFF",card:"#FFFFFF",text:"#000000",textSec:"#3C3C43",textTer:"#8E8E93",border:"#E5E5EA",primary:"#007AFF",accent:"#5856D6",success:"#34C759",error:"#FF3B30"},
  ocean:{bg:"#001F3F",surface:"#003D5C",card:"#00507A",text:"#FFFFFF",textSec:"#B8D4E8",textTer:"#7FA8C2",border:"#006494",primary:"#00B4D8",accent:"#0096C7",success:"#06FFA5",error:"#FF006E"},
  forest:{bg:"#0D1F13",surface:"#1B4332",card:"#2D6A4F",text:"#FFFFFF",textSec:"#D8F3DC",textTer:"#95D5B2",border:"#40916C",primary:"#52B788",accent:"#74C69D",success:"#B7E4C7",error:"#FF6B6B"},
  sunset:{bg:"#1A0E2E",surface:"#2D1B4E",card:"#3E2C5F",text:"#FFFFFF",textSec:"#E8D5F2",textTer:"#C4A5D9",border:"#5A4575",primary:"#9D4EDD",accent:"#C77DFF",success:"#7AE582",error:"#FF6B9D"},
};

const MODE_META={
  swap:{label:"Swap",color:"#52B788",bg:"#E8F3EF"},
  kindness:{label:"Kindness",color:"#9D4EDD",bg:"#F3EFFF"},
  emergency:{label:"Emergency",color:"#FF453A",bg:"#FFE8E8"},
  shelter:{label:"Shelter",color:"#FF9500",bg:"#FFF3E0"},
};

const CATS=["Food & Farm","Skills & Labour","Clothing","Shelter","Education","Emergency","Health","Pads for Girls","Other"];
const FONT="'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

const Icon=({name,size=24,color})=>{
  const paths={
    home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    plus:"M12 4v16m8-8H4",
    message:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    heart:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    heartFilled:"M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z",
    send:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    settings:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    arrowLeft:"M10 19l-7-7m0 0l7-7m-7 7h18",
    check:"M5 13l4 4L19 7",
    x:"M6 18L18 6M6 6l12 12",
    image:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    palette:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    users:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    flag:"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    phone:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    fire:"M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
    camera:"M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]||paths.home}/>
    </svg>
  );
};

const GS=({theme})=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    body{background:${theme.bg};font-family:${FONT};color:${theme.text};overflow-x:hidden;-webkit-font-smoothing:antialiased;}
    input,textarea,button{font-family:${FONT};}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .slideUp{animation:slideUp 0.4s cubic-bezier(0.16,1,0.3,1);}
  `}</style>
);

const Btn=({children,onClick,variant="primary",full,icon,loading,disabled,theme,style})=>{
  const styles={primary:{bg:theme.primary,color:"#FFF"},secondary:{bg:theme.card,color:theme.text},ghost:{bg:"transparent",color:theme.textSec},danger:{bg:theme.error,color:"#FFF"}};
  const s=styles[variant];
  return(
    <button onClick={onClick} disabled={disabled||loading} style={{background:s.bg,color:s.color,border:"none",borderRadius:14,padding:"14px 20px",fontSize:16,fontWeight:700,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled||loading?0.6:1,width:full?"100%":"auto",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",...style}}>
      {loading?<div style={{width:20,height:20,border:"3px solid rgba(255,255,255,0.3)",borderTopColor:"#FFF",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:icon?<Icon name={icon} size={20} color={s.color}/>:null}
      {children}
    </button>
  );
};

const Inp=({label,type="text",value,onChange,placeholder,icon,multiline,rows=4,theme})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:16,top:multiline?"16px":"50%",transform:multiline?"none":"translateY(-50%)",pointerEvents:"none",zIndex:1}}><Icon name={icon} size={20} color={theme.textTer}/></div>}
      {multiline
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:icon?"14px 16px 14px 48px":"14px 16px",borderRadius:12,border:`2px solid ${theme.border}`,fontSize:16,color:theme.text,background:theme.surface,outline:"none",resize:"vertical"}}/>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:icon?"14px 16px 14px 48px":"14px 16px",borderRadius:12,border:`2px solid ${theme.border}`,fontSize:16,color:theme.text,background:theme.surface,outline:"none"}}/>
      }
    </div>
  </div>
);

const Alert=({type,msg,theme})=>{
  if(!msg)return null;
  const colors={success:theme.success,error:theme.error,info:theme.primary};
  const c=colors[type]||colors.info;
  return <div style={{background:`${c}15`,border:`2px solid ${c}`,borderRadius:12,padding:"14px 16px",fontSize:15,color:c,marginBottom:16,fontWeight:600}}>{msg}</div>;
};

const Loader=()=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
    <div style={{width:48,height:48,border:"4px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.8)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
  </div>
);

const Splash=({onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24}}>
      <div style={{fontSize:80,animation:"pulse 2s ease-in-out infinite"}}>🤝</div>
      <h1 style={{color:"#FFF",fontSize:48,fontWeight:900,letterSpacing:-2}}>Exvora</h1>
      <p style={{color:"rgba(255,255,255,0.8)",fontSize:18,fontWeight:500}}>Exchange · Support · Survive</p>
    </div>
  );
};

const Auth=({onLogin,theme})=>{
  const [isLogin,setIsLogin]=useState(true);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  
  const submit=async()=>{
    setErr("");
    if(!isLogin&&!name.trim()){setErr("Please enter your name");return;}
    if(!email.includes("@")){setErr("Invalid email");return;}
    if(pass.length<6){setErr("Password must be 6+ characters");return;}
    setLoading(true);
    try{
      if(isLogin){
        const cred=await signInWithEmailAndPassword(auth,email,pass);
        onLogin(cred.user);
      }else{
        const cred=await createUserWithEmailAndPassword(auth,email,pass);
        await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"users",cred.user.uid),{name:name.trim(),email,bio:"",location:"",photoURL:"",followers:[],following:[],verified:false,theme:"dark",settings:{notifications:true,location:true,privacy:"public"},createdAt:serverTimestamp()});
        onLogin(cred.user);
      }
    }catch(e){
      setErr(e.code==="auth/email-already-in-use"?"Email already registered":e.code==="auth/user-not-found"?"No account found":e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Incorrect credentials":"Error occurred");
    }
    setLoading(false);
  };
  
  return(
    <div style={{minHeight:"100vh",background:theme.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:64,marginBottom:16}}>🤝</div>
          <h1 style={{fontSize:36,fontWeight:900,color:theme.text,marginBottom:8}}>Exvora</h1>
          <p style={{fontSize:16,color:theme.textTer}}>Join the community</p>
        </div>
        <div style={{background:theme.surface,borderRadius:20,padding:28,border:`1px solid ${theme.border}`}}>
          <div style={{display:"flex",background:theme.card,borderRadius:12,padding:4,marginBottom:24}}>
            <button onClick={()=>setIsLogin(true)} style={{flex:1,padding:12,borderRadius:10,border:"none",background:isLogin?theme.primary:"transparent",color:isLogin?"#FFF":theme.textSec,fontWeight:700,cursor:"pointer"}}>Sign In</button>
            <button onClick={()=>setIsLogin(false)} style={{flex:1,padding:12,borderRadius:10,border:"none",background:!isLogin?theme.primary:"transparent",color:!isLogin?"#FFF":theme.textSec,fontWeight:700,cursor:"pointer"}}>Sign Up</button>
          </div>
          {!isLogin&&<Inp label="Full Name" value={name} onChange={setName} placeholder="Your name" icon="user" theme={theme}/>}
          <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="message" theme={theme}/>
          <Inp label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="fire" theme={theme}/>
          <Alert type="error" msg={err} theme={theme}/>
          <Btn onClick={submit} full loading={loading} theme={theme}>{isLogin?"Sign In":"Create Account"}</Btn>
        </div>
      </div>
    </div>
  );
};

const PostCard=({post,currentUser,onLike,onMessage,onViewProfile,theme})=>{
  const [liked,setLiked]=useState(post.likedBy?.includes(currentUser.uid)||false);
  const [likeCount,setLikeCount]=useState(post.likes||0);
  const mode=MODE_META[post.mode]||MODE_META.swap;
  
  const toggleLike=async(e)=>{
    e.stopPropagation();
    const newLiked=!liked;
    setLiked(newLiked);
    setLikeCount(c=>newLiked?c+1:c-1);
    onLike(post.id,newLiked);
  };
  
  return(
    <div className="slideUp" style={{background:theme.card,borderRadius:18,border:`1px solid ${theme.border}`,padding:18,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div onClick={()=>onViewProfile(post.authorId)} style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#FFF",cursor:"pointer"}}>
          {(post.authorName||"U")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div onClick={()=>onViewProfile(post.authorId)} style={{fontSize:15,fontWeight:700,color:theme.text,cursor:"pointer"}}>{post.authorName}</div>
          <div style={{fontSize:13,color:theme.textTer}}>{post.location} · {post.timeAgo}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <span style={{fontSize:11,fontWeight:700,color:mode.color,background:mode.bg,padding:"4px 10px",borderRadius:12}}>{mode.label}</span>
          <span style={{fontSize:10,fontWeight:700,color:post.type==="HAVE"?theme.success:theme.error,background:post.type==="HAVE"?`${theme.success}15`:`${theme.error}15`,padding:"3px 8px",borderRadius:10}}>{post.type==="HAVE"?"I HAVE":"I NEED"}</span>
        </div>
      </div>
      {post.urgent&&<div style={{background:`${theme.error}15`,border:`2px solid ${theme.error}`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:13,fontWeight:700,color:theme.error}}>🚨 URGENT</div>}
      <div style={{marginBottom:6,fontSize:12,fontWeight:700,color:theme.accent}}>{post.category}</div>
      <h3 style={{fontSize:17,fontWeight:700,color:theme.text,marginBottom:8,lineHeight:1.4}}>{post.title}</h3>
      <p style={{fontSize:15,color:theme.textSec,lineHeight:1.6,marginBottom:14}}>{post.desc}</p>
      <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:14,borderTop:`1px solid ${theme.border}`}}>
        <button onClick={toggleLike} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",padding:"8px 14px",cursor:"pointer"}}>
          <Icon name={liked?"heartFilled":"heart"} size={20} color={liked?theme.error:theme.textTer}/>
          <span style={{fontSize:15,fontWeight:600,color:liked?theme.error:theme.textSec}}>{likeCount}</span>
        </button>
        <button onClick={e=>{e.stopPropagation();onMessage({uid:post.authorId,name:post.authorName});}} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",padding:"8px 14px",cursor:"pointer"}}>
          <Icon name="message" size={20} color={theme.textTer}/>
          <span style={{fontSize:15,fontWeight:600,color:theme.textSec}}>Message</span>
        </button>
      </div>
    </div>
  );
};

const Home=({currentUser,onMessage,onViewProfile,theme})=>{
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [mode,setMode]=useState("all");
  const [ptype,setPtype]=useState("All");
  const [cat,setCat]=useState("All");
  
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      const data=snap.docs.map(d=>{
        const x=d.data();
        const secs=x.createdAt?.seconds||Date.now()/1000;
        const diff=Math.floor((Date.now()/1000)-secs);
        const timeAgo=diff<60?"now":diff<3600?`${Math.floor(diff/60)}m`:diff<86400?`${Math.floor(diff/3600)}h`:`${Math.floor(diff/86400)}d`;
        return{id:d.id,...x,timeAgo};
      });
      setPosts(data);setLoading(false);
    });
    return()=>unsub();
  },[]);
  
  const onLike=async(postId,liked)=>{
    try{
      await updateDoc(doc(db,"posts",postId),{
        likedBy:liked?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid),
        likes:increment(liked?1:-1)
      });
    }catch(e){}
  };
  
  const filtered=posts.filter(p=>{
    if(mode!=="all"&&p.mode!==mode)return false;
    if(ptype!=="All"&&p.type!==ptype)return false;
    if(cat!=="All"&&p.category!==cat)return false;
    if(search){const q=search.toLowerCase();return p.title?.toLowerCase().includes(q)||p.desc?.toLowerCase().includes(q);}
    return true;
  });
  
  const urgent=posts.filter(p=>p.urgent);
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,position:"sticky",top:0,zIndex:100}}>
        <h2 style={{fontSize:24,fontWeight:900,color:theme.text,marginBottom:14}}>Community Feed</h2>
        <div style={{position:"relative",marginBottom:12}}>
          <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",zIndex:1,pointerEvents:"none"}}><Icon name="search" size={20} color={theme.textTer}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." style={{width:"100%",padding:"12px 16px 12px 48px",borderRadius:12,border:`1px solid ${theme.border}`,fontSize:15,background:theme.card,color:theme.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10,overflowX:"auto"}}>
          {[{key:"all",label:"All"},{key:"swap",label:"Swap"},{key:"kindness",label:"Kindness"},{key:"emergency",label:"Emergency"},{key:"shelter",label:"Shelter"}].map(m=>(
            <button key={m.key} onClick={()=>setMode(m.key)} style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",background:mode===m.key?theme.primary:theme.card,color:mode===m.key?"#FFF":theme.textSec,fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{m.label}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {["All","HAVE","NEED"].map(t=>(
            <button key={t} onClick={()=>setPtype(t)} style={{padding:"8px 16px",borderRadius:20,border:"none",background:ptype===t?theme.accent:theme.card,color:ptype===t?"#FFF":theme.textSec,fontSize:14,fontWeight:600,cursor:"pointer"}}>{t==="HAVE"?"✅ I HAVE":t==="NEED"?"🙏 I NEED":"All"}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto"}}>
          {["All",...CATS].map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"6px 14px",borderRadius:16,border:"none",background:cat===c?theme.success:theme.card,color:cat===c?"#FFF":theme.textTer,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{padding:16}}>
        {urgent.length>0&&mode==="all"&&(
          <div style={{background:`${theme.error}15`,border:`2px solid ${theme.error}`,borderRadius:16,padding:16,marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:32}}>🚨</span>
            <div><div style={{fontWeight:800,color:theme.error,fontSize:15,marginBottom:4}}>Emergency Help Needed</div><div style={{fontSize:13,color:theme.textSec}}>{urgent.length} person{urgent.length>1?"s":""} need urgent help now</div></div>
          </div>
        )}
        {loading?<Loader/>:filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 20px",color:theme.textTer}}>
            <div style={{fontSize:56,marginBottom:16}}>📭</div>
            <p style={{fontSize:17,fontWeight:600}}>No posts found</p>
            <p style={{fontSize:14,marginTop:8}}>Try different filters or be the first to post!</p>
          </div>
        ):filtered.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onLike={onLike} onMessage={onMessage} onViewProfile={onViewProfile} theme={theme}/>)}
      </div>
    </div>
  );
};

const Create=({currentUser,theme})=>{
  const [type,setType]=useState("HAVE");
  const [mode,setMode]=useState("swap");
  const [cat,setCat]=useState("Food & Farm");
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [loc,setLoc]=useState("");
  const [urgent,setUrgent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const publish=async()=>{
    if(!title.trim()||desc.length<10||!loc.trim())return;
    setLoading(true);
    try{
      await addDoc(collection(db,"posts"),{
        type,mode,category:cat,title:title.trim(),desc:desc.trim(),location:loc.trim(),urgent:mode==="emergency"?urgent:false,
        authorId:currentUser.uid,authorName:currentUser.displayName||"Anonymous",
        likes:0,likedBy:[],createdAt:serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(()=>{setSuccess(false);setTitle("");setDesc("");setLoc("");setUrgent(false);},2000);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{fontSize:28,fontWeight:900,color:theme.text,marginBottom:24}}>Create Post</h2>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>What are you doing?</label>
        <div style={{display:"flex",gap:10}}>
          {["HAVE","NEED"].map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${type===t?theme.primary:theme.border}`,background:type===t?`${theme.primary}15`:theme.card,color:type===t?theme.primary:theme.textSec,fontWeight:800,fontSize:15,cursor:"pointer"}}>{t==="HAVE"?"✅ I HAVE":"🙏 I NEED"}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>Post Type</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.entries(MODE_META).map(([k,m])=>(
            <button key={k} onClick={()=>setMode(k)} style={{padding:14,borderRadius:14,border:`2px solid ${mode===k?m.color:theme.border}`,background:mode===k?m.bg:theme.card,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:14,fontWeight:800,color:mode===k?m.color:theme.text,marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:12,color:theme.textTer}}>{{swap:"Exchange items",kindness:"Give freely",emergency:"Urgent help",shelter:"Space needed"}[k]}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>Category</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 14px",borderRadius:16,border:`2px solid ${cat===c?theme.success:theme.border}`,background:cat===c?`${theme.success}15`:theme.card,color:cat===c?theme.success:theme.textSec,fontSize:13,fontWeight:700,cursor:"pointer"}}>{c}</button>
          ))}
        </div>
      </div>
      <Inp label="Title" value={title} onChange={setTitle} placeholder="What are you offering/looking for?" theme={theme}/>
      <Inp label="Description" value={desc} onChange={setDesc} placeholder="Provide full details..." multiline rows={6} theme={theme}/>
      <Inp label="Location" value={loc} onChange={setLoc} placeholder="Your area/city" icon="fire" theme={theme}/>
      {mode==="emergency"&&(
        <div style={{background:`${theme.error}15`,border:`2px solid ${theme.error}`,borderRadius:12,padding:14,marginBottom:16}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)} style={{width:20,height:20}}/>
            <span style={{fontSize:14,color:theme.error,fontWeight:700}}>🚨 Mark as URGENT — I need help immediately</span>
          </label>
        </div>
      )}
      <Alert type="success" msg={success?"Post published successfully!":""} theme={theme}/>
      <Btn onClick={publish} full loading={loading} icon="plus" theme={theme}>Publish Post</Btn>
    </div>
  );
};

const Messages=({currentUser,activeChat,setActiveChat,theme})=>{
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
    const text=input.trim();
    setInput("");
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
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{setActiveChat(null);setMsgs([]);}} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#FFF"}}>
          {(activeChat.name||"U")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:theme.text}}>{activeChat.name}</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,background:theme.bg,display:"flex",flexDirection:"column"}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:theme.textTer}}><Icon name="message" size={48} color={theme.textTer}/><p style={{fontSize:15,fontWeight:600,marginTop:12}}>Start chatting!</p></div>}
        {msgs.map(m=>{
          const isMe=m.from===currentUser.uid;
          return(
            <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:12}}>
              <div style={{maxWidth:"75%",padding:"12px 16px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?theme.primary:theme.card,color:isMe?"#FFF":theme.text,fontSize:15,lineHeight:1.5,wordBreak:"break-word"}}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault();send();}} style={{background:theme.surface,borderTop:`1px solid ${theme.border}`,padding:12,display:"flex",gap:10,alignItems:"center"}}>
        <input
          type="text"
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="Type a message..."
          style={{flex:1,padding:14,borderRadius:24,border:`2px solid ${theme.border}`,fontSize:16,background:theme.card,color:theme.text,outline:"none"}}
        />
        <button type="submit" disabled={!input.trim()} style={{width:50,height:50,borderRadius:"50%",background:input.trim()?theme.primary:theme.card,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:input.trim()?"pointer":"not-allowed",flexShrink:0}}><Icon name="send" size={22} color={input.trim()?"#FFF":theme.textTer}/></button>
      </form>
    </div>
  );
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16}}>
        <h2 style={{fontSize:24,fontWeight:900,color:theme.text}}>Messages</h2>
      </div>
      {loading?<Loader/>:threads.length===0?(
        <div style={{textAlign:"center",padding:"80px 20px",color:theme.textTer}}>
          <Icon name="message" size={56} color={theme.textTer}/>
          <p style={{fontSize:17,fontWeight:600,marginTop:16}}>No messages yet</p>
          <p style={{fontSize:14,marginTop:8}}>Tap "Message" on any post to start chatting</p>
        </div>
      ):threads.map(t=>{
        const otherId=t.participants?.find(p=>p!==currentUser.uid);
        const otherName=t.participantNames?.[otherId]||"User";
        return(
          <div key={t.id} onClick={()=>setActiveChat({uid:otherId,name:otherName})} className="slideUp" style={{background:theme.card,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#FFF"}}>
              {(otherName||"U")[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{otherName}</div>
              <div style={{fontSize:14,color:theme.textTer,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.lastMessage||"Start chatting"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SettingsPage=({onBack,currentUser,theme})=>{
  const [settings,setSettings]=useState({notifications:true,location:true,privacy:"public"});
  const [msg,setMsg]=useState("");
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",currentUser.uid));
      if(snap.exists()&&snap.data().settings)setSettings(snap.data().settings);
    };
    load();
  },[currentUser]);
  
  const save=async()=>{
    try{
      await updateDoc(doc(db,"users",currentUser.uid),{settings});
      setMsg("Settings saved successfully!");
      setTimeout(()=>setMsg(""),2000);
    }catch(e){setMsg("Failed to save");}
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Settings</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={msg} theme={theme}/>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:14,padding:18,marginBottom:16}}>
          <h3 style={{fontSize:17,fontWeight:700,color:theme.text,marginBottom:14}}>Notifications</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <span style={{fontSize:15,color:theme.textSec}}>Push Notifications</span>
            <input type="checkbox" checked={settings.notifications} onChange={e=>setSettings({...settings,notifications:e.target.checked})} style={{width:22,height:22}}/>
          </label>
        </div>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:14,padding:18,marginBottom:16}}>
          <h3 style={{fontSize:17,fontWeight:700,color:theme.text,marginBottom:14}}>Location</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <span style={{fontSize:15,color:theme.textSec}}>Show nearby posts</span>
            <input type="checkbox" checked={settings.location} onChange={e=>setSettings({...settings,location:e.target.checked})} style={{width:22,height:22}}/>
          </label>
        </div>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:14,padding:18,marginBottom:16}}>
          <h3 style={{fontSize:17,fontWeight:700,color:theme.text,marginBottom:14}}>Privacy</h3>
          <select value={settings.privacy} onChange={e=>setSettings({...settings,privacy:e.target.value})} style={{width:"100%",padding:14,borderRadius:10,border:`1px solid ${theme.border}`,fontSize:15,background:theme.surface,color:theme.text,outline:"none"}}>
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Btn onClick={save} full icon="check" theme={theme}>Save Settings</Btn>
      </div>
    </div>
  );
};

const ReportPage=({onBack,theme})=>{
  const [reason,setReason]=useState("");
  const [details,setDetails]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const submit=async()=>{
    if(!reason||!details)return;
    setLoading(true);
    try{
      await addDoc(collection(db,"reports"),{reason,details,createdAt:serverTimestamp()});
      setSuccess(true);
      setTimeout(()=>onBack(),1500);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Report User</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={success?"Report submitted successfully!":""} theme={theme}/>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>Reason</label>
          <select value={reason} onChange={e=>setReason(e.target.value)} style={{width:"100%",padding:14,borderRadius:12,border:`2px solid ${theme.border}`,fontSize:15,background:theme.surface,color:theme.text,outline:"none"}}>
            <option value="">Select reason</option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="fraud">Fraud</option>
            <option value="inappropriate">Inappropriate Content</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Inp label="Details" value={details} onChange={setDetails} placeholder="Please describe the issue..." multiline rows={6} theme={theme}/>
        <Btn onClick={submit} full loading={loading} icon="flag" theme={theme}>Submit Report</Btn>
      </div>
    </div>
  );
};

const HelpPage=({onBack,theme})=>{
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const submit=async()=>{
    if(!subject||!message)return;
    setLoading(true);
    try{
      await addDoc(collection(db,"support"),{subject,message,createdAt:serverTimestamp()});
      setSuccess(true);
      setTimeout(()=>onBack(),1500);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Help & Support</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={success?"Message sent! We'll respond within 24 hours.":""} theme={theme}/>
        <Inp label="Subject" value={subject} onChange={setSubject} placeholder="How can we help?" theme={theme}/>
        <Inp label="Message" value={message} onChange={setMessage} placeholder="Describe your issue or question..." multiline rows={6} theme={theme}/>
        <Btn onClick={submit} full loading={loading} icon="phone" theme={theme}>Send Message</Btn>
      </div>
    </div>
  );
};

const ThemeSelector=({onBack,currentTheme,onSelect,theme})=>(
  <div style={{paddingBottom:100}}>
    <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
      <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Choose Theme</h2>
    </div>
    <div style={{padding:16}}>
      {Object.entries(THEMES).map(([key,t])=>(
        <div key={key} onClick={()=>onSelect(key)} style={{background:t.surface,border:`3px solid ${currentTheme===key?theme.primary:t.border}`,borderRadius:16,padding:20,marginBottom:14,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:t.primary}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:700,color:t.text,textTransform:"capitalize"}}>{key}</div>
              <div style={{fontSize:14,color:t.textTer}}>Beautiful {key} theme</div>
            </div>
            {currentTheme===key&&<Icon name="check" size={24} color={theme.primary}/>}
          </div>
          <div style={{display:"flex",gap:8}}>
            {[t.primary,t.accent,t.success,t.error].map((c,i)=><div key={i} style={{width:32,height:32,borderRadius:8,background:c}}/>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UserProfileView=({userId,onBack,currentUser,theme})=>{
  const [profile,setProfile]=useState(null);
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [following,setFollowing]=useState(false);
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",userId));
      if(snap.exists()){
        const d=snap.data();
        setProfile(d);
        setFollowing(d.followers?.includes(currentUser.uid)||false);
      }
      const q=query(collection(db,"posts"),where("authorId","==",userId));
      const psnap=await getDocs(q);
      setPosts(psnap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    };
    load();
  },[userId,currentUser]);
  
  const toggleFollow=async()=>{
    const newFollowing=!following;
    setFollowing(newFollowing);
    try{
      await updateDoc(doc(db,"users",userId),{
        followers:newFollowing?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid)
      });
      await updateDoc(doc(db,"users",currentUser.uid),{
        following:newFollowing?arrayUnion(userId):arrayRemove(userId)
      });
    }catch(e){setFollowing(!newFollowing);}
  };
  
  if(loading)return <Loader/>;
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Profile</h2>
      </div>
      <div style={{background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,padding:32}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:96,height:96,borderRadius:"50%",background:"#FFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,fontWeight:900,color:theme.primary,margin:"0 auto 16px"}}>
            {(profile?.name||"U")[0].toUpperCase()}
          </div>
          <h2 style={{fontSize:24,fontWeight:900,color:"#FFF",marginBottom:8}}>{profile?.name}</h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.8)",marginBottom:4}}>{profile?.location||"Location not set"}</p>
          {profile?.bio&&<p style={{fontSize:14,color:"rgba(255,255,255,0.7)",fontStyle:"italic",marginBottom:16}}>{profile.bio}</p>}
          <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:20}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:900,color:"#FFF"}}>{profile?.followers?.length||0}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Followers</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:900,color:"#FFF"}}>{posts.length}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Posts</div>
            </div>
          </div>
          {userId!==currentUser.uid&&(
            <button onClick={toggleFollow} style={{background:following?"transparent":"#FFF",color:following?"#FFF":theme.primary,border:following?"2px solid #FFF":"none",borderRadius:24,padding:"12px 32px",fontSize:16,fontWeight:700,cursor:"pointer"}}>
              {following?"Following":"Follow"}
            </button>
          )}
        </div>
      </div>
      <div style={{padding:16}}>
        <h3 style={{fontSize:18,fontWeight:700,color:theme.text,marginBottom:14}}>Posts</h3>
        {posts.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:theme.textTer}}>
            <div style={{fontSize:48,marginBottom:12}}>📝</div>
            <p style={{fontSize:15,fontWeight:600}}>No posts yet</p>
          </div>
        ):posts.map(p=>{
          const mode=MODE_META[p.mode]||MODE_META.swap;
          return(
            <div key={p.id} style={{background:theme.card,borderRadius:14,border:`1px solid ${theme.border}`,padding:14,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:700,color:mode.color,background:mode.bg,padding:"4px 10px",borderRadius:12}}>{mode.label}</span>
                <span style={{fontSize:10,fontWeight:700,color:p.type==="HAVE"?theme.success:theme.error,background:p.type==="HAVE"?`${theme.success}15`:`${theme.error}15`,padding:"3px 8px",borderRadius:10}}>{p.type==="HAVE"?"I HAVE":"I NEED"}</span>
              </div>
              <h4 style={{fontSize:15,fontWeight:700,color:theme.text,marginBottom:6}}>{p.title}</h4>
              <p style={{fontSize:13,color:theme.textSec}}>{p.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserCard=({user,currentUser,onFollow,onViewProfile,theme})=>{
  const [following,setFollowing]=useState(user.followers?.includes(currentUser.uid)||false);
  
  const toggleFollow=async()=>{
    const newFollowing=!following;
    setFollowing(newFollowing);
    onFollow(user.id,newFollowing);
  };
  
  return(
    <div style={{background:theme.card,borderRadius:16,border:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
      <div onClick={()=>onViewProfile(user.id)} style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#FFF",cursor:"pointer"}}>
        {(user.name||"U")[0].toUpperCase()}
      </div>
      <div style={{flex:1}} onClick={()=>onViewProfile(user.id)} style={{cursor:"pointer"}}>
        <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{user.name}</div>
        <div style={{fontSize:13,color:theme.textTer}}>{user.location||"Exvora member"} · {user.followers?.length||0} followers</div>
      </div>
      {user.id!==currentUser.uid&&(
        <button onClick={toggleFollow} style={{background:following?"transparent":theme.primary,color:following?theme.primary:"#FFF",border:following?`2px solid ${theme.primary}`:"none",borderRadius:20,padding:"8px 16px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          {following?"Following":"Follow"}
        </button>
      )}
    </div>
  );
};

const EditProfilePage=({onBack,currentUser,theme,onUpdate})=>{
  const [name,setName]=useState("");
  const [bio,setBio]=useState("");
  const [location,setLocation]=useState("");
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const fileInputRef=useRef(null);
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",currentUser.uid));
      if(snap.exists()){
        const d=snap.data();
        setName(d.name||currentUser.displayName||"");
        setBio(d.bio||"");
        setLocation(d.location||"");
      }
    };
    load();
  },[currentUser]);
  
  const save=async()=>{
    if(!name.trim())return;
    setLoading(true);
    try{
      await updateDoc(doc(db,"users",currentUser.uid),{name:name.trim(),​​​​​​​​​​​​​​​​
