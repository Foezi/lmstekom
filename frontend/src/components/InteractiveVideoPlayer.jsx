import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, CheckCircle, XCircle, Maximize, Minimize } from 'lucide-react';
import { getVideoQuestions, getVideoProgress, saveVideoProgress } from '../api/endpoints.js';
import toast from 'react-hot-toast';

export function InteractiveVideoPlayer({ materiId, youtubeId, role, onComplete }) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set());
  
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const [completed, setCompleted] = useState(false);
  const [isDosen] = useState(role === 'DOSEN' || role === 'ADMIN');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const lastValidTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const isHandlingQuestionRef = useRef(false);
  const checkTimeRef = useRef();

  // Selalu perbarui ref ke versi fungsi checkTime terbaru agar interval tidak terjebak closure lama
  checkTimeRef.current = (p) => {
    if (!p || p.getPlayerState() !== 1 || isHandlingQuestionRef.current) return;

    const time = p.getCurrentTime();
    const prevTime = lastValidTimeRef.current;
    
    // Cegah forward (hanya mahasiswa)
    if (!isDosen && time > prevTime + 2) {
      p.seekTo(prevTime);
      toast.error("Anda tidak dapat mempercepat video");
      return;
    }

    lastValidTimeRef.current = time;
    setCurrentTime(time);

    // Cek pertanyaan (Tampilkan untuk semua role agar Dosen bisa test)
    // Jika Dosen skip jauh (time > prevTime + 2), hanya cek titik mendarat.
    const checkStart = (time > prevTime + 2) ? Math.floor(time) : prevTime;
    const checkEnd = time;

    const question = questions.find(q => 
      q.timestamp >= checkStart && 
      q.timestamp <= checkEnd && 
      !answeredQuestionIds.has(q.id)
    );
      
    if (question) {
      isHandlingQuestionRef.current = true;
      p.pauseVideo();
      setIsPlaying(false);
      setActiveQuestion(question);
      setSelectedAnswer(null);
    }
  };

  useEffect(() => {
    loadData();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(saveIntervalRef.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [materiId]);

  const loadData = async () => {
    try {
      const q = await getVideoQuestions(materiId);
      setQuestions(q);

      if (!isDosen) {
        const p = await getVideoProgress(materiId);
        if (p?.completed) {
          setCompleted(true);
        }
      }
    } catch (err) {
      toast.error('Gagal memuat data video interaktif');
    }
  };

  const syncProgress = async (p) => {
    if (isDosen || completed || !p) return;
    try {
      await saveVideoProgress(materiId, { 
        lastTimestamp: Math.floor(p.getCurrentTime()), 
        videoDuration: Math.floor(p.getDuration()),
        completed: false
      });
    } catch (err) {
      // diam-diam gagal
    }
  };

  const onReady = (event) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    
    // Mulai tracking waktu
    intervalRef.current = setInterval(() => {
      if (checkTimeRef.current) checkTimeRef.current(event.target);
    }, 500);

    // Sinkronisasi progres setiap 10 detik
    saveIntervalRef.current = setInterval(() => {
      syncProgress(event.target);
    }, 10000);
  };



  const onStateChange = (event) => {
    setIsPlaying(event.data === 1);
    if (event.data === 2) { // PAUSE
       syncProgress(event.target);
    }
    if (event.data === 0) {
      // END
      if (!isDosen && !completed) {
        handleComplete();
      }
    }
  };

  const handleComplete = async () => {
    try {
      await saveVideoProgress(materiId, { completed: true, lastTimestamp: Math.floor(duration), videoDuration: Math.floor(duration) });
      setCompleted(true);
      toast.success("Anda telah menyelesaikan materi video ini!");
      if (onComplete) onComplete();
    } catch (err) {
      toast.error("Gagal menyimpan progres video");
    }
  };

  const handlePlayPause = () => {
    if (!player) return;
    if (activeQuestion) return; // tidak bisa play jika ada kuis
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const choice = activeQuestion.pilihan[selectedAnswer];
    if (choice.isCorrect) {
      toast.success("Jawaban Benar! Anda dapat melanjutkan menonton.");
      setAnsweredQuestionIds(prev => new Set(prev).add(activeQuestion.id));
      setActiveQuestion(null);
      isHandlingQuestionRef.current = false;
      player.playVideo();
    } else {
      toast.error("Jawaban Salah! Anda akan dikembalikan ke titik sebelumnya.");
      
      // Cari soal yang dijawab benar sebelumnya
      const previousQuestions = questions.filter(q => q.timestamp < activeQuestion.timestamp && answeredQuestionIds.has(q.id));
      const lastCheckpoint = previousQuestions.length > 0 ? previousQuestions[previousQuestions.length - 1].timestamp : 0;
      
      setActiveQuestion(null);
      isHandlingQuestionRef.current = false;
      lastValidTimeRef.current = lastCheckpoint;
      player.seekTo(lastCheckpoint);
      player.playVideo();
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
    },
  };

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden border border-slate-200 bg-black flex flex-col ${isFullscreen ? 'h-screen rounded-none' : 'rounded-lg aspect-video'}`}>
      <div className="relative flex-1 w-full pointer-events-none">
        <YouTube 
          videoId={youtubeId} 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange}
          className="absolute inset-0 w-full h-full pointer-events-none"
          iframeClassName="w-full h-full"
        />
        {/* Lapisan pelindung transparan */}
        <div className="absolute inset-0 z-10" style={{ cursor: 'pointer' }} onClick={handlePlayPause}></div>
      </div>

      {/* Kontrol Kustom */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePlayPause}
            className={`p-2 rounded-full transition-colors ${activeQuestion ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
            disabled={!!activeQuestion}
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
          </button>
          <div className="text-sm font-mono text-slate-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3">
            {completed && !isDosen && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-900/40 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> Selesai
              </div>
            )}
            {isDosen && (
              <div className="hidden sm:block text-xs text-slate-400">Mode Dosen</div>
            )}
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Kuis (Overlaid on top of video) */}
      {activeQuestion && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-lg mb-1">Pertanyaan Pemahaman</h3>
            <p className="text-sm text-slate-500 mb-4">Anda harus menjawab dengan benar untuk melanjutkan video.</p>
            
            <p className="font-medium text-slate-800 mb-4 whitespace-pre-wrap">{activeQuestion.pertanyaan}</p>
            
            <div className="space-y-2 mb-6">
              {activeQuestion.pilihan.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedAnswer === idx 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>
            
            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Jawab & Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
