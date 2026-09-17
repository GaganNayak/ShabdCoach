// Word bank: 4 job tracks × 10 words. Kannada meanings need a native-speaker check before launch (BUILDPLAN 2.4).
export type Word = { word: string; en: string; hi: string; kn: string; example: string };

export const TRACKS = {
  interview: {
    label: "Interview basics",
    words: [
      { word: "punctual", en: "arriving or doing things on time", hi: "time pe aane wala, late na hone wala", kn: "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬರುವ", example: "I am always punctual for my shifts." },
      { word: "strength", en: "a quality you are good at", hi: "aapki khoobi, jisme aap achhe ho", kn: "ನಿಮ್ಮ ಉತ್ತಮ ಗುಣ ಅಥವಾ ಸಾಮರ್ಥ್ಯ", example: "My biggest strength is talking to customers calmly." },
      { word: "weakness", en: "something you need to improve", hi: "kami, jisme sudhaar karna hai", kn: "ನೀವು ಸುಧಾರಿಸಬೇಕಾದ ಕೊರತೆ", example: "My weakness is public speaking, so I am practising daily." },
      { word: "experience", en: "knowledge you get from doing work", hi: "kaam karke mila hua anubhav", kn: "ಅನುಭವ", example: "I have one year of experience in retail sales." },
      { word: "responsible", en: "someone who can be trusted to do their duty", hi: "zimmedaar", kn: "ಜವಾಬ್ದಾರಿಯುತ", example: "I was responsible for handling the cash counter." },
      { word: "teamwork", en: "working well together with others", hi: "team ke saath milkar kaam karna", kn: "ತಂಡವಾಗಿ ಒಟ್ಟಾಗಿ ಕೆಲಸ ಮಾಡುವುದು", example: "Good teamwork helped us finish the order on time." },
      { word: "flexible", en: "able to adjust to changes easily", hi: "situation ke hisaab se adjust karne wala", kn: "ಪರಿಸ್ಥಿತಿಗೆ ತಕ್ಕಂತೆ ಹೊಂದಿಕೊಳ್ಳುವ", example: "I am flexible with night shifts." },
      { word: "achievement", en: "something good you did through effort", hi: "mehnat se haasil ki gayi safalta", kn: "ಸಾಧನೆ", example: "My biggest achievement was becoming employee of the month." },
      { word: "confident", en: "sure about yourself and your abilities", hi: "khud par bharosa rakhne wala", kn: "ಆತ್ಮವಿಶ್ವಾಸವುಳ್ಳ", example: "I feel confident about handling customer calls." },
      { word: "eager", en: "wanting very much to do something", hi: "kuch karne ke liye bahut utsuk", kn: "ಏನನ್ನಾದರೂ ಮಾಡಲು ತುಂಬಾ ಉತ್ಸುಕ", example: "I am eager to learn new skills in this role." },
    ],
  },
  support: {
    label: "Customer support",
    words: [
      { word: "complaint", en: "when a customer says something is wrong", hi: "shikayat", kn: "ದೂರು", example: "I noted the customer's complaint about late delivery." },
      { word: "resolve", en: "to solve a problem", hi: "problem ko suljhana", kn: "ಸಮಸ್ಯೆಯನ್ನು ಬಗೆಹರಿಸು", example: "We will resolve your issue within 24 hours." },
      { word: "patience", en: "staying calm without getting angry", hi: "sabr, dhairya", kn: "ತಾಳ್ಮೆ", example: "Thank you for your patience, sir." },
      { word: "apologize", en: "to say sorry", hi: "maafi maangna", kn: "ಕ್ಷಮೆ ಕೇಳು", example: "I apologize for the trouble you faced." },
      { word: "refund", en: "money given back to a customer", hi: "paise wapas karna", kn: "ಹಣ ವಾಪಸ್ ನೀಡುವುದು", example: "Your refund will reach your account in five days." },
      { word: "escalate", en: "to pass a problem to a senior person", hi: "problem ko senior tak le jaana", kn: "ಸಮಸ್ಯೆಯನ್ನು ಮೇಲಧಿಕಾರಿಗೆ ಕಳುಹಿಸು", example: "I will escalate this to my team leader." },
      { word: "polite", en: "speaking in a kind and respectful way", hi: "vinamra, izzat se baat karne wala", kn: "ಸಭ್ಯ, ವಿನಯದಿಂದ ಮಾತನಾಡುವ", example: "Always stay polite, even with angry customers." },
      { word: "inconvenience", en: "trouble or difficulty caused to someone", hi: "takleef, pareshani", kn: "ತೊಂದರೆ, ಅನಾನುಕೂಲ", example: "Sorry for the inconvenience caused." },
      { word: "feedback", en: "opinion about how something was", hi: "raay, pratikriya", kn: "ಅಭಿಪ್ರಾಯ, ಪ್ರತಿಕ್ರಿಯೆ", example: "Please share your feedback about our service." },
      { word: "verify", en: "to check that something is correct", hi: "jaanch karna ki sahi hai ya nahi", kn: "ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸು", example: "Can I verify your registered phone number?" },
    ],
  },
  sales: {
    label: "Sales",
    words: [
      { word: "target", en: "the goal you must reach", hi: "lakshya, jo poora karna hai", kn: "ತಲುಪಬೇಕಾದ ಗುರಿ", example: "I achieved my monthly sales target." },
      { word: "convince", en: "to make someone agree or believe", hi: "kisi ko manaana", kn: "ಮನವೊಲಿಸು", example: "I convinced the customer to try the new plan." },
      { word: "discount", en: "a lower price than usual", hi: "keemat mein chhoot", kn: "ಬೆಲೆಯಲ್ಲಿ ರಿಯಾಯಿತಿ", example: "We are giving a ten percent discount today." },
      { word: "negotiate", en: "to discuss to reach an agreement", hi: "baat-cheet karke deal tay karna", kn: "ಮಾತುಕತೆ ನಡೆಸಿ ಒಪ್ಪಂದಕ್ಕೆ ಬರುವುದು", example: "The client wants to negotiate the price." },
      { word: "client", en: "a person or company that buys from you", hi: "grahak, customer", kn: "ಗ್ರಾಹಕ", example: "I visit three new clients every day." },
      { word: "benefit", en: "a good result or advantage", hi: "fayda", kn: "ಲಾಭ, ಪ್ರಯೋಜನ", example: "The main benefit of this plan is free delivery." },
      { word: "commission", en: "extra money earned for each sale", hi: "har sale par milne wala extra paisa", kn: "ಪ್ರತಿ ಮಾರಾಟಕ್ಕೆ ಸಿಗುವ ಹೆಚ್ಚುವರಿ ಹಣ", example: "I earn a commission on every policy I sell." },
      { word: "budget", en: "the amount of money someone can spend", hi: "kharch karne ki seema", kn: "ಖರ್ಚು ಮಾಡಲು ಇರುವ ಹಣದ ಮಿತಿ", example: "What is your budget for a new phone?" },
      { word: "follow up", en: "to contact someone again later", hi: "baad mein dobara sampark karna", kn: "ನಂತರ ಮತ್ತೆ ಸಂಪರ್ಕಿಸು", example: "I will follow up with you on Monday." },
      { word: "deal", en: "an agreement to buy or sell", hi: "sauda", kn: "ಒಪ್ಪಂದ, ವ್ಯವಹಾರ", example: "We closed the deal after two meetings." },
    ],
  },
  office: {
    label: "Office & workplace",
    words: [
      { word: "deadline", en: "the last date to finish work", hi: "kaam khatam karne ki aakhri taareekh", kn: "ಕೆಲಸ ಮುಗಿಸಬೇಕಾದ ಕೊನೆಯ ದಿನಾಂಕ", example: "The deadline for this report is Friday." },
      { word: "colleague", en: "a person you work with", hi: "saath kaam karne wala", kn: "ಸಹೋದ್ಯೋಗಿ", example: "My colleague helped me learn the software." },
      { word: "schedule", en: "a plan of when things will happen", hi: "samay-saarini, time table", kn: "ವೇಳಾಪಟ್ಟಿ", example: "Please check the meeting schedule." },
      { word: "priority", en: "the most important thing to do first", hi: "sabse zaroori kaam jo pehle karna hai", kn: "ಮೊದಲು ಮಾಡಬೇಕಾದ ಮುಖ್ಯ ಕೆಲಸ, ಆದ್ಯತೆ", example: "Customer safety is our top priority." },
      { word: "agenda", en: "list of topics for a meeting", hi: "meeting mein baat hone wale topics ki list", kn: "ಸಭೆಯಲ್ಲಿ ಚರ್ಚಿಸುವ ವಿಷಯಗಳ ಪಟ್ಟಿ", example: "The first point on the agenda is sales." },
      { word: "approve", en: "to officially say yes", hi: "manzoori dena", kn: "ಒಪ್ಪಿಗೆ ನೀಡು, ಅನುಮೋದಿಸು", example: "My manager approved my leave." },
      { word: "attendance", en: "being present at work", hi: "haaziri", kn: "ಹಾಜರಾತಿ", example: "Please mark your attendance before 9 AM." },
      { word: "submit", en: "to give work or a form to someone", hi: "jama karna", kn: "ಸಲ್ಲಿಸು", example: "I submitted my documents to HR." },
      { word: "professional", en: "behaving in a proper, work-like way", hi: "kaam ke hisaab se sahi vyavhaar", kn: "ವೃತ್ತಿಪರ", example: "Always dress in a professional way for work." },
      { word: "update", en: "the latest information", hi: "nayi jaankari", kn: "ಇತ್ತೀಚಿನ ಮಾಹಿತಿ", example: "Can you give me an update on the order?" },
    ],
  },
} satisfies Record<string, { label: string; words: Word[] }>;

export type TrackId = keyof typeof TRACKS;
