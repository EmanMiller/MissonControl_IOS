import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { Alert } from 'react-native';
import socketService from './socket';

class VoiceService {
  private isListening = false;
  private transcript = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  private onSpeechStart() {
    console.log('🎤 Speech recognition started');
    this.isListening = true;
  }

  private onSpeechRecognized(e: SpeechRecognizedEvent) {
    console.log('🗣️ Speech recognized', e);
  }

  private onSpeechEnd() {
    console.log('🔇 Speech recognition ended');
    this.isListening = false;
  }

  private onSpeechError(e: SpeechErrorEvent) {
    console.error('❌ Speech recognition error:', e.error);
    this.isListening = false;
    
    if (e.error?.message) {
      Alert.alert('Voice Recognition Error', e.error.message);
    }
  }

  private onSpeechResults(e: SpeechResultsEvent) {
    console.log('📝 Speech results:', e.value);
    if (e.value && e.value.length > 0) {
      this.transcript = e.value[0];
      this.handleVoiceTask(this.transcript);
    }
  }

  private onSpeechPartialResults(e: SpeechResultsEvent) {
    console.log('📝 Partial speech results:', e.value);
    // Could update UI with partial results here
  }

  private handleVoiceTask(transcript: string) {
    if (!transcript || transcript.trim().length === 0) {
      Alert.alert('No Speech Detected', 'Please try again.');
      return;
    }

    // Simple task detection patterns
    const taskPatterns = [
      /create task|new task|add task/i,
      /remind me to|remember to/i,
      /schedule|plan/i,
      /todo|to do/i,
    ];

    const isTaskRequest = taskPatterns.some(pattern => pattern.test(transcript));

    if (isTaskRequest) {
      this.createVoiceTask(transcript);
    } else {
      // General voice command or query
      Alert.alert(
        'Voice Input Received',
        `"${transcript}"\n\nWould you like to create a task from this?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Task', onPress: () => this.createVoiceTask(transcript) },
        ]
      );
    }
  }

  private createVoiceTask(transcript: string) {
    // Clean up the transcript to extract task content
    const cleanedTask = this.extractTaskFromTranscript(transcript);
    
    if (socketService.isSocketConnected()) {
      // Send to backend via Socket.io
      socketService.sendVoiceTask('', transcript);
      
      Alert.alert(
        'Voice Task Created',
        `Task: "${cleanedTask}"`,
        [{ text: 'OK' }]
      );
    } else {
      // Fallback: could store locally and sync later
      Alert.alert(
        'Connection Required',
        'Unable to create voice task. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }

  private extractTaskFromTranscript(transcript: string): string {
    // Remove common voice command prefixes
    const cleaned = transcript
      .replace(/^(create task|new task|add task|remind me to|remember to|schedule|plan)\s+/i, '')
      .replace(/^(todo|to do)\s+/i, '')
      .trim();

    return cleaned || transcript;
  }

  async startListening(): Promise<boolean> {
    if (this.isListening) {
      console.log('Already listening');
      return false;
    }

    try {
      await Voice.start('en-US');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
      return false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to cancel voice recognition:', error);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getLastTranscript(): string {
    return this.transcript;
  }

  // Check if voice recognition is available
  async isAvailable(): Promise<boolean> {
    try {
      return await Voice.isAvailable();
    } catch (error) {
      console.error('Voice recognition not available:', error);
      return false;
    }
  }

  // Cleanup
  destroy() {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export const voiceService = new VoiceService();
export default voiceService;