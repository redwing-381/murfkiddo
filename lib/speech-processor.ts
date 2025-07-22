/**
 * Natural Speech Processing System
 * Transforms AI-generated text into human-like speech patterns
 */

export interface SpeechProcessingOptions {
  addConversationalMarkers?: boolean
  addEmphasis?: boolean
  addBreathingPauses?: boolean
  addNaturalHesitations?: boolean
  conversationLevel?: 'formal' | 'casual' | 'friendly' | 'child-friendly'
}

export class NaturalSpeechProcessor {
  
  /**
   * Process text to make it sound more human and natural
   * Now focuses on punctuation-based natural pauses instead of SSML markers
   */
  static processForNaturalSpeech(
    text: string, 
    options: SpeechProcessingOptions = {}
  ): string {
    const {
      addConversationalMarkers = true,
      addEmphasis = true,
      addBreathingPauses = false, // Disabled - relying on natural speech patterns
      addNaturalHesitations = false,
      conversationLevel = 'child-friendly'
    } = options

    let processedText = text

    // Remove any markdown or formatting that might interfere
    processedText = this.cleanMarkdown(processedText)

    // Add natural punctuation for breathing
    processedText = this.addNaturalPunctuation(processedText)

    // Add emphasis through text formatting (not SSML)
    if (addEmphasis) {
      processedText = this.addTextEmphasis(processedText)
    }

    // Add conversational words for natural flow
    if (addConversationalMarkers) {
      processedText = this.addNaturalTransitions(processedText, conversationLevel)
    }

    return processedText.trim()
  }

  /**
   * Clean markdown and formatting from text
   */
  private static cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/#{1,6}\s?/g, '') // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/`([^`]+)`/g, '$1') // Remove code backticks
      .trim()
  }

  /**
   * Add natural punctuation for better speech flow without SSML
   */
  private static addNaturalPunctuation(text: string): string {
    return text
      // Ensure proper spacing after sentences for natural pauses
      .replace(/\.\s*/g, '. ')
      .replace(/!\s*/g, '! ')
      .replace(/\?\s*/g, '? ')
      
      // Add extra periods for longer natural pauses at key moments
      .replace(/\b(Once upon a time)\b/gi, 'Once upon a time...')
      .replace(/\b(The end)\b/gi, 'The end...')
      .replace(/\b(suddenly|all of a sudden)\b/gi, '$1...')
      
      // Ensure commas have proper spacing
      .replace(/,\s*/g, ', ')
      .replace(/:\s*/g, ': ')
      .replace(/;\s*/g, '; ')
  }

  /**
   * Add natural transitions and conversational words
   */
  private static addNaturalTransitions(text: string, level: string): string {
    let processed = text

    // Add natural transition words that create conversational flow
    processed = processed
      .replace(/\b(So)\b/gi, 'So then')
      .replace(/\b(Well)\b/gi, 'Well now')
      .replace(/\b(Now)\b/gi, 'Now then')

    // Child-friendly expressions
    if (level === 'child-friendly') {
      processed = processed
        .replace(/\b(Amazing|Great|Awesome)\b/gi, 'Oh, $1')
        .replace(/\b(Let's)\b/gi, 'Come on, let\'s')
    }

    return processed
  }

  /**
   * Add text-based emphasis instead of SSML
   */
  private static addTextEmphasis(text: string): string {
    return text
      // Emphasize numbers by adding "exactly" or "just"
      .replace(/\b(\d+|one|two|three|four|five)\b/gi, 'exactly $1')
      
      // Add emphasis words for important adjectives
      .replace(/\b(important|special)\b/gi, 'very $1')
      .replace(/\b(amazing|incredible)\b/gi, 'absolutely $1')
      
      // Add emphasis to emotional words
      .replace(/\b(excited|happy)\b/gi, 'really $1')
  }

  /**
   * Add natural emphasis to important words and phrases
   */
  private static addNaturalEmphasis(text: string, isLongText = false): string {
    if (isLongText) {
      // Minimal emphasis for long text
      return text
        .replace(/\b(\d+|one|two|three)\b/gi, '<break time="0.1s"/> $1 ')
        .replace(/\b(important|special|amazing)\b/gi, '<break time="0.1s"/> $1 ')
    }

    return text
      // Emphasize numbers and quantities
      .replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third)\b/gi,
               '<break time="0.2s"/> $1 <break time="0.2s"/>')
      
      // Emphasize important adjectives
      .replace(/\b(important|special|amazing|incredible|unique|perfect|best|worst|biggest|smallest)\b/gi,
               '<break time="0.1s"/> $1 <break time="0.2s"/>')
      
      // Add emphasis to emotional words
      .replace(/\b(love|hate|excited|scared|happy|sad|angry|surprised)\b/gi,
               '<break time="0.2s"/> $1 <break time="0.3s"/>')
  }

  /**
   * Add subtle natural hesitations (for casual conversation)
   */
  private static addNaturalHesitations(text: string): string {
    const hesitations = ['um', 'uh', 'well', 'you know']
    
    // Add hesitations randomly at sentence beginnings (10% chance)
    return text.replace(/\.\s+([A-Z])/g, (match, letter) => {
      if (Math.random() < 0.1) {
        const hesitation = hesitations[Math.floor(Math.random() * hesitations.length)]
        return `. <break time="0.5s"/> ${hesitation} <break time="0.3s"/> ${letter}`
      }
      return match
    })
  }

  /**
   * Add natural pacing and rhythm
   */
  private static addNaturalPacing(text: string): string {
    return text
      // Add slight pauses around quoted text
      .replace(/"/g, '<break time="0.2s"/> " <break time="0.1s"/>')
      
      // Add pauses around lists
      .replace(/\b(first|second|third|finally|lastly)\b/gi, 
               '<break time="0.3s"/> $1 <break time="0.2s"/>')
      
      // Add dramatic pauses before revealing information
      .replace(/\b(and the answer is|the result is|it turns out|here's the thing)\b/gi,
               '<break time="0.5s"/> $1 <break time="0.7s"/>')
      
      // Add pauses for storytelling
      .replace(/\b(once upon a time|long ago|suddenly|meanwhile|then)\b/gi,
               '<break time="0.4s"/> $1 <break time="0.3s"/>')
  }

  /**
   * Optimize processed text to fit within character limits
   */
  private static optimizeForLength(text: string, targetLength: number): string {
    if (text.length <= targetLength) {
      return text
    }

    console.log(`Text too long (${text.length} chars), optimizing for Murf API...`)

    let optimized = text

    // Step 1: Use shorter pause syntax
    optimized = optimized
      .replace(/<break time="0\.8s"\/>/g, '<break time="0.5s"/>')
      .replace(/<break time="0\.7s"\/>/g, '<break time="0.4s"/>')
      .replace(/<break time="0\.6s"\/>/g, '<break time="0.4s"/>')
      .replace(/<break time="0\.5s"\/>/g, '<break time="0.3s"/>')
      .replace(/<break time="0\.4s"\/>/g, '<break time="0.2s"/>')
      .replace(/<break time="0\.3s"\/>/g, '<break time="0.2s"/>')

    // Step 2: Remove some redundant pauses if still too long
    if (optimized.length > targetLength) {
      // Remove pause pairs (before and after words)
      optimized = optimized
        .replace(/<break time="0\.2s"\/>\s*([^<]*?)\s*<break time="0\.2s"\/>/g, '$1')
        .replace(/<break time="0\.1s"\/>\s*([^<]*?)\s*<break time="0\.2s"\/>/g, '$1')
    }

    // Step 3: Keep only essential pauses if still too long
    if (optimized.length > targetLength) {
      // Keep only sentence-ending pauses
      optimized = optimized
        .replace(/<break time="[0-9.]+s"\/>/g, '') // Remove all pauses
        .replace(/\.\s+/g, '. <break time="0.3s"/> ') // Add back only sentence pauses
        .replace(/!\s+/g, '! <break time="0.3s"/> ')
        .replace(/\?\s+/g, '? <break time="0.3s"/> ')
    }

    // Final check: truncate if absolutely necessary
    if (optimized.length > targetLength) {
      const truncatePoint = targetLength - 50 // Leave room for ending
      optimized = optimized.substring(0, truncatePoint)
      
      // Find last complete sentence
      const lastSentence = Math.max(
        optimized.lastIndexOf('.'),
        optimized.lastIndexOf('!'),
        optimized.lastIndexOf('?')
      )
      
      if (lastSentence > truncatePoint * 0.7) { // If we don't lose too much
        optimized = optimized.substring(0, lastSentence + 1)
      }
    }

    console.log(`Optimized from ${text.length} to ${optimized.length} characters`)
    return optimized
  }

  /**
   * Process text specifically for story telling
   */
  static processForStorytelling(text: string): string {
    let processed = this.processForNaturalSpeech(text, {
      addConversationalMarkers: true,
      addEmphasis: true,
      conversationLevel: 'child-friendly'
    })

    // Add storytelling enhancements with natural punctuation
    processed = processed
      .replace(/\b(Once upon a time)\b/gi, 'Once upon a time...')
      .replace(/\b(The end)\b/gi, 'And that... is the end.')
      .replace(/\b(suddenly|all of a sudden)\b/gi, 'Then, suddenly...')
      .replace(/\b(and they lived happily ever after)\b/gi, 'And they all lived... happily ever after.')

    return processed
  }

  /**
   * Process text for educational content
   */
  static processForEducation(text: string): string {
    return this.processForNaturalSpeech(text, {
      addConversationalMarkers: true,
      addEmphasis: true,
      conversationLevel: 'friendly'
    })
  }

  /**
   * Process text for casual conversation
   */
  static processForConversation(text: string): string {
    return this.processForNaturalSpeech(text, {
      addConversationalMarkers: true,
      addEmphasis: true,
      conversationLevel: 'casual'
    })
  }

  /**
   * Process text for bedtime/calming content
   */
  static processForBedtime(text: string): string {
    let processed = this.processForNaturalSpeech(text, {
      addConversationalMarkers: false,
      addEmphasis: false,
      conversationLevel: 'child-friendly'
    })

    // Add calming words and gentle phrasing
    processed = processed
      .replace(/\b(sleep|rest|dream)\b/gi, 'gently $1')
      .replace(/\b(peaceful|calm|quiet)\b/gi, 'so very $1')
      .replace(/\b(goodnight|good night)\b/gi, 'sweet dreams and goodnight')

    return processed
  }
} 