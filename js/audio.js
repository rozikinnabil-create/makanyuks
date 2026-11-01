/**
 * MealMate - Audio, Speech Synthesis & Voice Recorder Service
 * Handles ambient chime synthesizer (Web Audio API), Indonesian Text-to-Speech,
 * and user custom voice recordings (Microphone Recording & Audio Upload).
 */

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.isAlarmActive = false;
    this.alarmRepeatTimer = null;
    this.currentUtterance = null;
    this.currentAudioPlayer = null;

    // MediaRecorder state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStream = null;

    this.initVoices();
  }

  // Ensure AudioContext is initialized after user gesture
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initVoices() {
    if (!this.synth) return;

    const populate = () => {
      this.voices = this.synth.getVoices();
      window.dispatchEvent(new CustomEvent('voicesLoaded', { detail: { voices: this.voices } }));
    };

    populate();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = populate;
    }
  }

  getAvailableVoices() {
    if (!this.synth) return [];
    if (!this.voices || this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  getBestIndonesianVoice(preferredUri = '') {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    // 1. User preferred voice URI
    if (preferredUri) {
      const selected = voices.find(v => v.voiceURI === preferredUri);
      if (selected) return selected;
    }

    // 2. Explicit Indonesian voice (id-ID, id_ID, Indonesian)
    const indonesian = voices.find(v => 
      (v.lang && (v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase().includes('id-id'))) ||
      (v.name && v.name.toLowerCase().includes('indonesia'))
    );
    if (indonesian) return indonesian;

    // 3. Fallback to Malay
    const malay = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ms'));
    if (malay) return malay;

    // 4. Fallback default
    return voices.find(v => v.default) || voices[0];
  }

  /**
   * Synthesize gentle chime using Web Audio API
   */
  playGentleChime(volume = 0.8) {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        const notes = [
          { freq: 523.25, time: now + 0.0, dur: 0.8 }, // C5
          { freq: 659.25, time: now + 0.15, dur: 0.8 }, // E5
          { freq: 783.99, time: now + 0.35, dur: 1.0 }, // G5
          { freq: 1046.50, time: now + 0.55, dur: 1.4 } // C6
        ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          const noteVol = Math.max(0.01, volume * 0.22);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(noteVol, time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + dur);
        });

        setTimeout(resolve, 950);
      } catch (err) {
        console.warn('Web Audio chime playback failed:', err);
        resolve();
      }
    });
  }

  /**
   * Play user's custom recorded audio (Data URL or Blob URL)
   */
  playCustomAudio(audioDataUrl, volume = 0.85) {
    return new Promise((resolve) => {
      if (!audioDataUrl) {
        resolve();
        return;
      }

      this.stopCustomAudio();

      const audio = new Audio(audioDataUrl);
      this.currentAudioPlayer = audio;
      audio.volume = typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : 0.85;

      audio.onended = () => {
        this.currentAudioPlayer = null;
        resolve();
      };

      audio.onerror = (e) => {
        console.warn('Error playing custom audio:', e);
        this.currentAudioPlayer = null;
        resolve();
      };

      audio.play().catch(err => {
        console.warn('Playback error (check user gesture):', err);
        this.currentAudioPlayer = null;
        resolve();
      });
    });
  }

  stopCustomAudio() {
    if (this.currentAudioPlayer) {
      try {
        this.currentAudioPlayer.pause();
        this.currentAudioPlayer.currentTime = 0;
      } catch (e) {}
      this.currentAudioPlayer = null;
    }
  }

  /**
   * Play TTS Speech
   */
  speakText(text, settings = {}) {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const voice = this.getBestIndonesianVoice(settings.voiceURI);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'id-ID';
      } else {
        utterance.lang = 'id-ID';
      }

      utterance.volume = typeof settings.volume === 'number' ? settings.volume : 0.85;
      utterance.rate = typeof settings.speechRate === 'number' ? settings.speechRate : 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.currentUtterance = null;
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Trigger full meal reminder alarm:
   * 1. Check if custom voice is available (per meal or global)
   * 2. Play gentle chime
   * 3. Play user's voice OR speak Indonesian TTS
   */
  async triggerMealAlarm(schedule, settings = {}) {
    if (!settings.soundEnabled) return;

    this.stopAlarm();
    this.isAlarmActive = true;

    // Check for custom audio
    let customAudioData = null;
    if (window.audioStorage) {
      // Check meal-specific recording first
      customAudioData = await window.audioStorage.getAudio(`meal_${schedule.id}`);
      // If not, check global custom voice
      if (!customAudioData && settings.voiceMode === 'custom') {
        customAudioData = await window.audioStorage.getAudio('global_voice');
      }
    }

    const playSequence = async () => {
      if (!this.isAlarmActive) return;

      if (settings.chimeSound !== false) {
        await this.playGentleChime(settings.volume);
      }

      if (!this.isAlarmActive) return;

      if (customAudioData) {
        // Play user's own recorded voice!
        await this.playCustomAudio(customAudioData, settings.volume);
      } else {
        // Fallback to Indonesian Text-to-Speech
        const phrase = schedule.speechPhrase || `Saatnya ${schedule.name}. Selamat menikmati hidanganmu!`;
        await this.speakText(phrase, settings);
      }
    };

    await playSequence();

    // Repeat gently once after 25s if still active
    if (this.isAlarmActive) {
      this.alarmRepeatTimer = setTimeout(async () => {
        if (this.isAlarmActive) {
          await playSequence();
        }
      }, 25000);
    }
  }

  stopAlarm() {
    this.isAlarmActive = false;
    if (this.alarmRepeatTimer) {
      clearTimeout(this.alarmRepeatTimer);
      this.alarmRepeatTimer = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopCustomAudio();
    this.currentUtterance = null;
  }

  /**
   * Test current voice settings (TTS or Custom Audio)
   */
  async testVoice(sampleText, settings = {}, customAudioData = null) {
    this.stopAlarm();
    if (settings.chimeSound !== false) {
      await this.playGentleChime(settings.volume);
    }

    if (customAudioData) {
      await this.playCustomAudio(customAudioData, settings.volume);
    } else {
      await this.speakText(sampleText || 'Halo! Ini adalah contoh suara pengingat makan dari MealMate.', settings);
    }
  }

  // ================= MICROPHONE VOICE RECORDER =================
  async startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser Anda tidak mendukung perekaman mikrofon.');
    }

    this.audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recordingStream = stream;

    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
    let supportedType = mimeTypes.find(type => type === '' || MediaRecorder.isTypeSupported(type));

    const options = supportedType ? { mimeType: supportedType } : {};
    this.mediaRecorder = new MediaRecorder(stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    return true;
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
        
        // Stop all mic tracks
        if (this.recordingStream) {
          this.recordingStream.getTracks().forEach(track => track.stop());
          this.recordingStream = null;
        }

        // Convert blob to Base64 Data URL for persistent storage
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach(track => track.stop());
      this.recordingStream = null;
    }
    this.audioChunks = [];
  }
}

window.audioService = new AudioService();
