import { Outlet } from 'react-router-dom';

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-sky-900 animate-gradient-xy overflow-hidden relative p-4 sm:p-8">
      
      {/* Decorative Animated Orbs */}
      <div className="absolute top-0 left-0 w-72 md:w-96 h-72 md:h-96 bg-sky-600 rounded-full mix-blend-screen filter blur-[100px] md:blur-[128px] opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 md:w-96 h-72 md:h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-[100px] md:blur-[128px] opacity-25 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-72 md:w-96 h-72 md:h-96 bg-sky-400 rounded-full mix-blend-screen filter blur-[100px] md:blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Container Card */}
      <div className="relative w-full max-w-5xl flex flex-col md:flex-row glass-panel rounded-3xl overflow-hidden shadow-2xl z-10 animate-fade-in-up border border-white/10">
        
        {/* Branding/Hero Side */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-b from-white/10 to-transparent border-r border-white/10 relative overflow-hidden">
           <div className="relative z-10">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 hover-float">
               <span className="text-4xl font-black text-sky-500 tracking-tighter">PS</span>
             </div>
             <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight tracking-tight">
               Politeknik Sukabumi
             </h1>
             <p className="text-lg text-sky-200 font-medium tracking-wide uppercase text-sm">
               Learning Management System
             </p>
           </div>
           
           <div className="relative z-10 mt-12">
              <div className="w-12 h-1 bg-orange-500 rounded-full mb-6 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
              <p className="text-base text-slate-300 leading-relaxed font-light">
                Platform akademik modern yang meredefinisi cara belajar Anda. Terintegrasi, cepat, dan kolaboratif tanpa batas ruang.
              </p>
           </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-14 bg-white flex flex-col justify-center relative">
          {/* Mobile Branding (only visible on small screens) */}
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
             <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-md">
               <span className="text-xl font-black text-white tracking-tighter">PS</span>
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800">LMS Polteksmi</h1>
             </div>
          </div>

          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
