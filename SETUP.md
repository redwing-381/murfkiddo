# MurfKiddo API Setup Guide

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Murf TTS API Configuration  
MURF_API_KEY=your_murf_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Voice ID Configuration

⚠️ **IMPORTANT**: You may need to update the voice IDs in `app/api/generate-story/route.ts`

Current voice IDs are based on Murf's documentation examples:

```typescript
const voiceMap = {
  playful: 'en-US-natalie',  // Kid-friendly, energetic voice
  calm: 'en-US-terrell',     // Calm, soothing voice  
  dramatic: 'en-US-joe',     // More dramatic, storytelling voice
}
```

**To find your available voice IDs:**
1. Log into your Murf Studio dashboard
2. Go to the Voice Library
3. Browse voices and note their IDs (usually in format like `en-US-voicename`)
4. Look for kid-friendly voices that match your needs
5. Update the `voiceMap` object with your preferred voices

**Popular kid-friendly voice options typically include:**
- `en-US-natalie` - Young, energetic female voice
- `en-US-terrell` - Calm, gentle male voice
- `en-US-sara` - Warm female voice
- `en-US-cooper` - Friendly male voice

### 3. Murf API Information

✅ **Verified endpoint**: `https://api.murf.ai/v1/speech/generate`  
✅ **Authentication**: Uses `api-key` header (not Bearer token)  
✅ **Format**: WAV files with 24kHz sample rate  
✅ **Model**: Using GEN2 for highest quality

### 4. Run the Application

```bash
npm run dev
```

### 5. Test Story Mode

1. Go to `http://localhost:3000`
2. Click on "Story Mode"
3. Enter a story topic (e.g., "a friendly dragon")
4. Select voice type
5. Click "Tell Me a Story!"

## 🐛 Troubleshooting

### Common Issues:

1. **"API key invalid"**: Double-check your `.env.local` file and Murf API key
2. **"Voice ID not found"**: Update voice IDs with ones available in your Murf account
3. **Gemini API Error**: Ensure Gemini API key is correct and billing is enabled
4. **Audio Not Playing**: Check browser console for CORS or audio format issues
5. **Long Loading**: Story generation can take 10-30 seconds (Gemini + Murf processing)

### Debug Steps:

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify `.env.local` file is in project root (not tracked by git)

### Quick API Test:

You can test your Murf API key independently:
```bash
curl -X POST https://api.murf.ai/v1/speech/generate \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voiceId":"en-US-natalie","format":"WAV"}'
```

## 📚 API Documentation Links

- [Gemini AI API](https://ai.google.dev/docs)
- [Murf API Documentation](https://murf.ai/api/docs/introduction/quickstart)
- [Murf Voice Library](https://murf.ai/voices) (to find voice IDs)

## 🎯 Test Scenarios

Try these topics to test the integration:
- "a magical unicorn and a rainbow"
- "space adventure with friendly aliens" 
- "underwater treasure hunt"
- "talking animals in the forest"

## ✅ Success Indicators

- ✅ Story text appears within 10-30 seconds
- ✅ Audio player shows duration and play button becomes active
- ✅ Audio plays with voice matching selected style
- ✅ Download button works and saves audio file
- ✅ Progress bar shows during playback

## 🔧 Next Steps After Testing

If Story Mode works successfully:
1. ✨ **Implement Tutor Mode** (similar API pattern)
2. 🌍 **Add Language Buddy** (translation + TTS)
3. 🎮 **Create Play Mode games** with voice instructions
4. 🌙 **Build Bedtime Mode** with calming voices
5. 👨‍👩‍👧 **Add Parental Controls** and safety features

## 💡 Pro Tips

- Use shorter stories (200-300 words) for faster generation
- Test different voice styles to find the best match for each mode
- Consider caching popular stories to reduce API calls
- Monitor API usage to stay within your Murf plan limits 